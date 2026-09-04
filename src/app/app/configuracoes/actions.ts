"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant } from "@/lib/restaurant-context";
import { restaurantSettingsSchema } from "@/lib/validations/settings";

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
