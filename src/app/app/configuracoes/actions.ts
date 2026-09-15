"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/restaurant-context";
import { restaurantSettingsSchema } from "@/lib/validations/settings";
import { restaurantAddressSchema } from "@/lib/validations/restaurant-address";

export type SettingsActionState = { error?: string; success?: boolean } | undefined;

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
