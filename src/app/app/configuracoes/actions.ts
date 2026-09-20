"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/restaurant-context";
import { restaurantSettingsSchema } from "@/lib/validations/settings";
import { restaurantAddressSchema } from "@/lib/validations/restaurant-address";
import { validateUpload } from "@/lib/uploads";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "@/lib/supabase/types";

export type SettingsActionState = { error?: string; success?: boolean } | undefined;

async function uploadRestaurantMedia(
  supabase: SupabaseClient<Database>,
  restaurantId: string,
  kind: string,
  file: File,
  extension: string,
): Promise<string | undefined> {
  const path = `${restaurantId}/${kind}.${extension}`;

  const { error } = await supabase.storage
    .from("restaurant-media")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return undefined;

  const { data } = supabase.storage.from("restaurant-media").getPublicUrl(path);
  return data.publicUrl;
}

export async function updateRestaurantSettings(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const parsed = restaurantSettingsSchema.safeParse({
    acceptsDelivery: formData.get("acceptsDelivery") === "on",
    acceptsPickup: formData.get("acceptsPickup") === "on",
    acceptsDinein: formData.get("acceptsDinein") === "on",
    minOrderCents: formData.get("minOrderCents"),
    deliveryFeeCents: formData.get("deliveryFeeCents"),
    deliveryTimeMin: formData.get("deliveryTimeMin") || undefined,
    deliveryTimeMax: formData.get("deliveryTimeMax") || undefined,
    paymentMethods: formData.getAll("paymentMethods"),
    pixKey: formData.get("pixKey"),
    instagram: formData.get("instagram"),
    orderNotice: formData.get("orderNotice"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { error } = await supabase
    .from("restaurant_settings")
    .upsert(
      {
        restaurant_id: restaurant.id,
        accepts_delivery: parsed.data.acceptsDelivery,
        accepts_pickup: parsed.data.acceptsPickup,
        accepts_dinein: parsed.data.acceptsDinein,
        min_order_cents: parsed.data.minOrderCents,
        delivery_fee_cents: parsed.data.deliveryFeeCents,
        delivery_time_min: parsed.data.deliveryTimeMin ?? null,
        delivery_time_max: parsed.data.deliveryTimeMax ?? null,
        payment_methods: parsed.data.paymentMethods,
        pix_key: parsed.data.pixKey || null,
        instagram: parsed.data.instagram || null,
        order_notice: parsed.data.orderNotice || null,
      },
      { onConflict: "restaurant_id" },
    );

  if (error) {
    return { error: "Não foi possível salvar as configurações. Tente novamente." };
  }

  revalidatePath("/app/configuracoes");
  revalidatePath(`/${restaurant.slug}`);
  return { success: true };
}

/**
 * Logo + capa (foto OU vídeo) — a UI pra isto não existia (só o onboarding
 * gravava logo/capa, uma vez, na criação do restaurante; não tinha como
 * trocar depois). `cover_type`/`cover_video_url`/`cover_poster_url` já
 * existiam no banco desde o Prompt 03 — StoreCover.tsx (loja pública) já
 * sabe renderizar os dois formatos, só faltava dar pro dono trocar.
 *
 * Cada arquivo é opcional e independente: só atualiza o que veio
 * preenchido nesta submissão, nunca apaga uma mídia existente por causa de
 * outro campo não ter sido reenviado.
 */
export async function updateRestaurantMedia(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const coverType = formData.get("coverType");
  if (coverType !== "image" && coverType !== "video") {
    return { error: "Escolha um tipo de capa." };
  }

  const urls: Partial<Record<"logo_url" | "cover_url" | "cover_video_url" | "cover_poster_url", string>> = {};

  const uploads = [
    { field: "logo", kind: "image", storageKind: "logo", column: "logo_url", label: "Logo" },
    { field: "coverImage", kind: "image", storageKind: "cover", column: "cover_url", label: "Capa" },
    { field: "coverVideo", kind: "video", storageKind: "cover-video", column: "cover_video_url", label: "Vídeo de capa" },
    {
      field: "coverPoster",
      kind: "image",
      storageKind: "cover-poster",
      column: "cover_poster_url",
      label: "Capa do vídeo",
    },
  ] as const;

  for (const { field, kind, storageKind, column, label } of uploads) {
    const file = formData.get(field);
    if (!(file instanceof File) || file.size === 0) continue;

    const validation = await validateUpload(file, kind);
    if (!validation.ok) {
      return { error: `${label}: ${validation.error}` };
    }

    const url = await uploadRestaurantMedia(supabase, restaurant.id, storageKind, file, validation.extension!);
    if (!url) {
      return { error: `Não foi possível enviar: ${label.toLowerCase()}. Tente novamente.` };
    }
    urls[column] = url;
  }

  const updates: TablesUpdate<"restaurants"> = { cover_type: coverType, ...urls };

  const { error } = await supabase.from("restaurants").update(updates).eq("id", restaurant.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/configuracoes");
  revalidatePath(`/${restaurant.slug}`);
  return { success: true };
}

export async function updateRestaurantAddress(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const parsed = restaurantAddressSchema.safeParse({
    addressStreet: formData.get("addressStreet"),
    addressNumber: formData.get("addressNumber"),
    addressDistrict: formData.get("addressDistrict"),
    addressCity: formData.get("addressCity"),
    addressState: formData.get("addressState"),
    addressZip: formData.get("addressZip"),
    addressNote: formData.get("addressNote"),
    latitude: formData.get("latitude") || undefined,
    longitude: formData.get("longitude") || undefined,
    cnpj: formData.get("cnpj"),
    legalName: formData.get("legalName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { error } = await supabase
    .from("restaurants")
    .update({
      address_street: parsed.data.addressStreet || null,
      address_number: parsed.data.addressNumber || null,
      address_district: parsed.data.addressDistrict || null,
      address_city: parsed.data.addressCity || null,
      address_state: parsed.data.addressState || null,
      address_zip: parsed.data.addressZip || null,
      address_note: parsed.data.addressNote || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      cnpj: parsed.data.cnpj || null,
      legal_name: parsed.data.legalName || null,
    })
    .eq("id", restaurant.id);

  if (error) {
    return { error: "Não foi possível salvar o endereço. Tente novamente." };
  }

  revalidatePath("/app/configuracoes");
  revalidatePath(`/${restaurant.slug}`);
  return { success: true };
}
