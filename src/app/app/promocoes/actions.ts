"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurant, requireRestaurantForCreate } from "@/lib/restaurant-context";
import { promotionSchema } from "@/lib/validations/promotions";
import { saoPauloDateTimeToISO } from "@/lib/business-hours";
import { rateLimitMessage } from "@/lib/rate-limit";

export type PromotionActionState = { error?: string; success?: boolean } | undefined;

function parsePromotionForm(formData: FormData) {
  return promotionSchema.safeParse({
    productId: formData.get("productId"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    badgeText: formData.get("badgeText") || undefined,
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue") || undefined,
    weekdays: formData.getAll("weekdays"),
    dailyStart: formData.get("dailyStart"),
    dailyEnd: formData.get("dailyEnd"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    stockLimit: formData.get("stockLimit") || undefined,
  });
}

/** `<input type="datetime-local">` não carrega fuso — trata o valor como já
 * sendo o horário local da loja (mesma simplificação que business_hours faz
 * pra abertura/fechamento). Delega pro helper certo em vez de `new
 * Date(value)`: aquele leria o fuso do PROCESSO do servidor (ex.: UTC numa
 * função serverless), não o de São Paulo — promoção configurada pra "18h"
 * ia valer 3h mais cedo/tarde do que o dono digitou. */
function toISOOrNull(value: string | undefined): string | null {
  if (!value) return null;
  return saoPauloDateTimeToISO(value);
}

export async function createPromotion(
  _prevState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const { supabase, restaurant, rateLimited } = await requireRestaurantForCreate("promotion");
  if (rateLimited) {
    return { error: rateLimitMessage() };
  }

  const parsed = parsePromotionForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { data: last } = await supabase
    .from("promotions")
    .select("position")
    .eq("restaurant_id", restaurant.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("promotions").insert({
    restaurant_id: restaurant.id,
    product_id: parsed.data.productId,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle || null,
    badge_text: parsed.data.badgeText,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountType === "none" ? null : parsed.data.discountValue,
    weekdays: parsed.data.weekdays,
    daily_start: parsed.data.dailyStart || null,
    daily_end: parsed.data.dailyEnd || null,
    starts_at: toISOOrNull(parsed.data.startsAt),
    ends_at: toISOOrNull(parsed.data.endsAt),
    stock_limit: parsed.data.stockLimit ?? null,
    position: (last?.position ?? -1) + 1,
  });

  if (error) {
    return { error: "Não foi possível criar a promoção. Tente novamente." };
  }

  revalidatePath("/app/promocoes");
  revalidatePath(`/${restaurant.slug}`);
  return { success: true };
}

export async function updatePromotion(
  promotionId: string,
  _prevState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const { supabase, restaurant } = await requireRestaurant();

  const parsed = parsePromotionForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  const { error } = await supabase
    .from("promotions")
    .update({
      product_id: parsed.data.productId,
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      badge_text: parsed.data.badgeText,
      discount_type: parsed.data.discountType,
      discount_value: parsed.data.discountType === "none" ? null : parsed.data.discountValue,
      weekdays: parsed.data.weekdays,
      daily_start: parsed.data.dailyStart || null,
      daily_end: parsed.data.dailyEnd || null,
      starts_at: toISOOrNull(parsed.data.startsAt),
      ends_at: toISOOrNull(parsed.data.endsAt),
      stock_limit: parsed.data.stockLimit ?? null,
    })
    .eq("id", promotionId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/app/promocoes");
  revalidatePath(`/${restaurant.slug}`);
  return { success: true };
}

export async function deletePromotion(promotionId: string) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase.from("promotions").delete().eq("id", promotionId).eq("restaurant_id", restaurant.id);

  revalidatePath("/app/promocoes");
  revalidatePath(`/${restaurant.slug}`);
}

export async function togglePromotionActive(promotionId: string, nextValue: boolean) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase
    .from("promotions")
    .update({ is_active: nextValue })
    .eq("id", promotionId)
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/app/promocoes");
  revalidatePath(`/${restaurant.slug}`);
}

/** Zera o estoque usado — pra reabrir uma promoção "esgotada" (stock_used
 * atingiu stock_limit) sem precisar recriar tudo. */
export async function resetPromotionStock(promotionId: string) {
  const { supabase, restaurant } = await requireRestaurant();

  await supabase
    .from("promotions")
    .update({ stock_used: 0 })
    .eq("id", promotionId)
    .eq("restaurant_id", restaurant.id);

  revalidatePath("/app/promocoes");
  revalidatePath(`/${restaurant.slug}`);
}

export async function movePromotion(promotionId: string, direction: "up" | "down") {
  const { supabase, restaurant } = await requireRestaurant();

  const { data: promotions } = await supabase
    .from("promotions")
    .select("id, position")
    .eq("restaurant_id", restaurant.id)
    .order("position", { ascending: true });

  if (!promotions) return;

  const index = promotions.findIndex((p) => p.id === promotionId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;

  if (index === -1 || swapIndex < 0 || swapIndex >= promotions.length) return;

  const current = promotions[index];
  const swap = promotions[swapIndex];

  await Promise.all([
    supabase.from("promotions").update({ position: swap.position }).eq("id", current.id),
    supabase.from("promotions").update({ position: current.position }).eq("id", swap.id),
  ]);

  revalidatePath("/app/promocoes");
  revalidatePath(`/${restaurant.slug}`);
}
