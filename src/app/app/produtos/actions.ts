"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant, requireRestaurantForCreate } from "@/lib/restaurant-context";
import { productSchema, optionGroupSchema, optionSchema } from "@/lib/validations/menu";
import { slugify } from "@/lib/slugify";
import { rateLimitMessage } from "@/lib/rate-limit";
import { validateUpload } from "@/lib/uploads";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type ProductActionState = { error?: string; success?: boolean } | undefined;
export type OptionGroupActionState = { error?: string; success?: boolean } | undefined;
export type OptionActionState = { error?: string; success?: boolean } | undefined;

const MAX_SLUG_ATTEMPTS = 20;

function parseProductForm(formData: FormData) {
  const compareAtRaw = formData.get("compareAtPriceCents");
  return productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    priceCents: formData.get("priceCents"),
    compareAtPriceCents: compareAtRaw && Number(compareAtRaw) > 0 ? compareAtRaw : undefined,
    categoryId: formData.get("categoryId"),
    isAvailable: formData.get("isAvailable") === "on",
    isFeatured: formData.get("isFeatured") === "on",
  });
}

async function findAvailableProductSlug(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  baseSlug: string,
  excludeProductId?: string,
): Promise<string> {
  let slug = baseSlug;

  for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
    let query = supabase
      .from("products")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("slug", slug);

    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }

    const { data: existing } = await query.maybeSingle();
    if (!existing) return slug;

    slug = `${baseSlug}-${attempt + 1}`;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function uploadProductImage(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  productId: string,
  file: FormDataEntryValue | null,
): Promise<string | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;

  const validation = await validateUpload(file, "image");
  if (!validation.ok) return undefined;

  const path = `${restaurantId}/products/${productId}.${validation.extension}`;

  const { error: uploadError } = await supabase.storage
    .from("restaurant-media")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return undefined;

  const { data } = supabase.storage.from("restaurant-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { supabase, restaurant, rateLimited } = await requireRestaurantForCreate("product");
  if (rateLimited) {
    return { error: rateLimitMessage() };
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { data: last } = await supabase
    .from("products")
    .select("sort_order")
    .eq("category_id", parsed.data.categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const slug = await findAvailableProductSlug(
    supabase,
    restaurant.id,
    slugify(parsed.data.name) || "produto",
  );

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      restaurant_id: restaurant.id,
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      price_cents: parsed.data.priceCents,
      compare_at_price_cents: parsed.data.compareAtPriceCents ?? null,
      is_available: parsed.data.isAvailable,
      is_featured: parsed.data.isFeatured,
      sort_order: (last?.sort_order ?? -1) + 1,
    })
    .select()
    .single();

  if (error || !product) {
    return { error: "Não foi possível criar o produto. Tente novamente." };
  }

  const imageUrl = await uploadProductImage(supabase, restaurant.id, product.id, formData.get("image"));
  if (imageUrl) {
    await supabase.from("products").update({ image_url: imageUrl }).eq("id", product.id);
  }

  revalidatePath("/app/produtos");
  revalidatePath("/app");
  return { success: true };
}

export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const imageUrl = await uploadProductImage(supabase, restaurant.id, productId, formData.get("image"));

  const { error } = await supabase
    .from("products")
    .update({
      category_id: parsed.data.categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_cents: parsed.data.priceCents,
      compare_at_price_cents: parsed.data.compareAtPriceCents ?? null,
      is_available: parsed.data.isAvailable,
      is_featured: parsed.data.isFeatured,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/produtos");
  revalidatePath("/app");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase.from("products").delete().eq("id", productId).eq("restaurant_id", restaurant.id);

  revalidatePath("/app/produtos");
  revalidatePath("/app");
}

export async function toggleProductAvailable(productId: string, nextValue: boolean) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase
    .from("products")
    .update({ is_available: nextValue })
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/app/produtos");
}

export async function toggleProductFeatured(productId: string, nextValue: boolean) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase
    .from("products")
    .update({ is_featured: nextValue })
    .eq("id", productId)
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/app/produtos");
}

export async function moveProduct(productId: string, categoryId: string, direction: "up" | "down") {
  const { supabase } = await requireRestaurant();

  const { data: products } = await supabase
    .from("products")
    .select("id, sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });

  if (!products) return;

  const index = products.findIndex((p) => p.id === productId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= products.length) return;

  const current = products[index];
  const swap = products[swapIndex];

  await Promise.all([
    supabase.from("products").update({ sort_order: swap.sort_order }).eq("id", current.id),
    supabase.from("products").update({ sort_order: current.sort_order }).eq("id", swap.id),
  ]);

  revalidatePath("/app/produtos");
}

// ---------------------------------------------------------------------------
// Grupos de complemento e opções (ex.: "Ponto da carne", "Adicionais").
// ---------------------------------------------------------------------------

function parseOptionGroupForm(formData: FormData) {
  return optionGroupSchema.safeParse({
    name: formData.get("name"),
    minSelect: formData.get("minSelect"),
    maxSelect: formData.get("maxSelect"),
    isRequired: formData.get("isRequired") === "on",
  });
}

export async function createOptionGroup(
  productId: string,
  _prevState: OptionGroupActionState,
  formData: FormData,
): Promise<OptionGroupActionState> {
  const { supabase } = await requireRestaurant();

  const parsed = parseOptionGroupForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { data: last } = await supabase
    .from("product_option_groups")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_option_groups").insert({
    product_id: productId,
    name: parsed.data.name,
    min_select: parsed.data.isRequired ? Math.max(1, parsed.data.minSelect) : parsed.data.minSelect,
    max_select: parsed.data.maxSelect,
    is_required: parsed.data.isRequired,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    return { error: "Não foi possível criar o grupo. Tente novamente." };
  }

  revalidatePath("/app/produtos");
  return { success: true };
}

export async function updateOptionGroup(
  groupId: string,
  _prevState: OptionGroupActionState,
  formData: FormData,
): Promise<OptionGroupActionState> {
  const { supabase } = await requireRestaurant();

  const parsed = parseOptionGroupForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { error } = await supabase
    .from("product_option_groups")
    .update({
      name: parsed.data.name,
      min_select: parsed.data.isRequired ? Math.max(1, parsed.data.minSelect) : parsed.data.minSelect,
      max_select: parsed.data.maxSelect,
      is_required: parsed.data.isRequired,
    })
    .eq("id", groupId);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/produtos");
  return { success: true };
}

export async function deleteOptionGroup(groupId: string) {
  const { supabase } = await requireRestaurant();
  await supabase.from("product_option_groups").delete().eq("id", groupId);
  revalidatePath("/app/produtos");
}

export async function createOption(
  groupId: string,
  _prevState: OptionActionState,
  formData: FormData,
): Promise<OptionActionState> {
  const { supabase } = await requireRestaurant();

  const parsed = optionSchema.safeParse({
    name: formData.get("name"),
    priceCents: formData.get("priceCents"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { data: last } = await supabase
    .from("product_options")
    .select("sort_order")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_options").insert({
    group_id: groupId,
    name: parsed.data.name,
    price_cents: parsed.data.priceCents,
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    return { error: "Não foi possível criar a opção. Tente novamente." };
  }

  revalidatePath("/app/produtos");
  return { success: true };
}

export async function deleteOption(optionId: string) {
  const { supabase } = await requireRestaurant();
  await supabase.from("product_options").delete().eq("id", optionId);
  revalidatePath("/app/produtos");
}

export async function toggleOptionAvailable(optionId: string, nextValue: boolean) {
  const { supabase } = await requireRestaurant();
  await supabase.from("product_options").update({ is_available: nextValue }).eq("id", optionId);
  revalidatePath("/app/produtos");
}
