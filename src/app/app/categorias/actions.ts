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

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const slug = await findAvailableCategorySlug(supabase, restaurant.id, slugify(parsed.data.name) || "categoria");

  const { error } = await supabase.from("categories").insert({
    restaurant_id: restaurant.id,
    name: parsed.data.name,
    slug,
    description: parsed.data.description || null,
    sort_order: (last?.sort_order ?? -1) + 1,
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
    .update({ name: parsed.data.name, description: parsed.data.description || null })
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
}

export async function moveCategory(categoryId: string, direction: "up" | "down") {
  const { supabase, restaurant } = await requireRestaurant();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order", { ascending: true });

  if (!categories) return;

  const index = categories.findIndex((c) => c.id === categoryId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) return;

  const current = categories[index];
  const swap = categories[swapIndex];

  await Promise.all([
    supabase.from("categories").update({ sort_order: swap.sort_order }).eq("id", current.id),
    supabase.from("categories").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);

  revalidatePath("/app/categorias");
}
