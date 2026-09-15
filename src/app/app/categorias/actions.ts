"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/restaurant-context";
import { categorySchema } from "@/lib/validations/menu";
import { slugify } from "@/lib/slugify";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CategoryActionState = { error?: string; success?: boolean } | undefined;

const MAX_SLUG_ATTEMPTS = 20;

/** Mesma lógica de src/app/app/produtos/actions.ts (findAvailableProductSlug)
 * — o slug é gerado uma vez na criação e nunca muda depois (Parte 2.3 do
 * prompt 03: renomear a categoria muda só o rótulo, não o link já
 * compartilhado). */
async function findAvailableCategorySlug(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) return slug;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    iconKey: formData.get("iconKey"),
    displayStyle: formData.get("displayStyle"),
  });
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  // `position` é a ordem que a loja pública usa de verdade (getStoreCategories
  // ordena por ela); `sort_order` é uma coluna legada que ninguém mais lê no
  // lado público — categoria nova entra no fim da lista visível de verdade.
  const { data: last } = await supabase
    .from("categories")
    .select("position")
    .eq("restaurant_id", restaurant.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const slug = await findAvailableCategorySlug(supabase, restaurant.id, slugify(parsed.data.name) || "categoria");

  const { error } = await supabase.from("categories").insert({
    restaurant_id: restaurant.id,
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    icon_key: parsed.data.iconKey,
    display_style: parsed.data.displayStyle,
    position: (last?.position ?? -1) + 1,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Você já tem uma categoria com esse nome."
          : "Não foi possível criar a categoria. Tente novamente.",
    };
  }

  revalidatePath("/app/categorias");
  revalidatePath("/app");
  return { success: true };
}

export async function updateCategory(
  categoryId: string,
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const parsed = parseCategoryForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      icon_key: parsed.data.iconKey,
      display_style: parsed.data.displayStyle,
    })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Você já tem uma categoria com esse nome."
          : "Não foi possível salvar. Tente novamente.",
    };
  }

  revalidatePath("/app/categorias");
  revalidatePath("/app");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase.from("categories").delete().eq("id", categoryId).eq("restaurant_id", restaurant.id);

  revalidatePath("/app/categorias");
  revalidatePath("/app");
}

export async function toggleCategoryActive(categoryId: string, nextValue: boolean) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase
    .from("categories")
    .update({ is_active: nextValue })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/app/categorias");
  revalidatePath("/app");
}

/** "Ocultar" (is_visible) é diferente de "desativar" (is_active, acima):
 * oculta só sai da régua/home pública — o link direto continua respondendo
 * (ver getCategoryBySlug). Desativar é exclusão de fato. */
export async function toggleCategoryVisible(categoryId: string, nextValue: boolean) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase
    .from("categories")
    .update({ is_visible: nextValue })
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/app/categorias");
  revalidatePath("/app");
}

export async function moveCategory(categoryId: string, direction: "up" | "down") {
  const { supabase, restaurant } = await requireRestaurant();

  // `position`, não `sort_order` — é a coluna que a loja pública lê de
  // verdade (getStoreCategories); reordenar aqui sem mexer em `position` não
  // tinha efeito nenhum na régua/home do cliente.
  const { data: categories } = await supabase
    .from("categories")
    .select("id, position")
    .eq("restaurant_id", restaurant.id)
    .order("position", { ascending: true });

  if (!categories) return;

  const index = categories.findIndex((c) => c.id === categoryId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) return;

  const current = categories[index];
  const swap = categories[swapIndex];

  await Promise.all([
    supabase.from("categories").update({ position: swap.position }).eq("id", current.id),
    supabase.from("categories").update({ position: current.position }).eq("id", swap.id),
  ]);

  revalidatePath("/app/categorias");
  revalidatePath("/app");
}
