import { nowInRestaurantTimezone } from "./business-hours";
import type { Promotion } from "@/types/store";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Valida se uma promoção está valendo AGORA, nesta ordem: is_active → janela
 * starts_at/ends_at → dia da semana (weekdays vazio = todo dia) → janela de
 * horário no dia (daily_start/daily_end) → estoque. Roda sempre no servidor,
 * no fuso da loja — nunca confia num "is_active" sozinho vindo do cliente.
 *
 * `at` é só pra teste com instante sintético (mesmo motivo do parâmetro em
 * business-hours.ts) — em produção é sempre chamado sem argumento.
 */
export function isPromotionLive(promo: Promotion, at?: Date): boolean {
  if (!promo.is_active) return false;

  const now = at ?? new Date();
  if (promo.starts_at && now < new Date(promo.starts_at)) return false;
  if (promo.ends_at && now > new Date(promo.ends_at)) return false;

  const { dayOfWeek, minutesOfDay } = nowInRestaurantTimezone(now);

  if (promo.weekdays.length > 0 && !promo.weekdays.includes(dayOfWeek)) return false;

  if (promo.daily_start && promo.daily_end) {
    const start = toMinutes(promo.daily_start);
    const end = toMinutes(promo.daily_end);
    // Mesma regra de "cruza a meia-noite" do business-hours: se o fim é
    // menor ou igual ao início, a janela atravessa 00:00.
    const withinWindow =
      end > start ? minutesOfDay >= start && minutesOfDay < end : minutesOfDay >= start || minutesOfDay < end;
    if (!withinWindow) return false;
  } else if (promo.daily_start && minutesOfDay < toMinutes(promo.daily_start)) {
    return false;
  } else if (promo.daily_end && minutesOfDay >= toMinutes(promo.daily_end)) {
    return false;
  }

  if (promo.stock_limit !== null && promo.stock_used >= promo.stock_limit) return false;

  return true;
}

/** Preço com o desconto da promoção aplicado, em centavos. `percent` desconta
 * %, `fixed` desconta um valor fixo em R$, `price` substitui o preço final,
 * `none` mantém o preço original (a promoção é só destaque visual). */
export function applyDiscount(
  basePriceCents: number,
  promo: Pick<Promotion, "discount_type" | "discount_value">,
): number {
  if (promo.discount_value == null) return basePriceCents;

  switch (promo.discount_type) {
    case "percent":
      return Math.max(0, Math.round(basePriceCents * (1 - promo.discount_value / 100)));
    case "fixed":
      return Math.max(0, basePriceCents - Math.round(promo.discount_value * 100));
    case "price":
      return Math.max(0, Math.round(promo.discount_value * 100));
    default:
      return basePriceCents;
  }
}

/** "-22%" pro selo de desconto — sempre calculado do preço de verdade, nunca
 * armazenado, pra nunca dessincronizar se o preço base do produto mudar. */
export function discountPercentOff(basePriceCents: number, finalPriceCents: number): number {
  if (basePriceCents <= 0) return 0;
  return Math.round((1 - finalPriceCents / basePriceCents) * 100);
}

/** `null` = sem limite de estoque (não mostra barra de progresso). */
export function stockRemaining(promo: Pick<Promotion, "stock_limit" | "stock_used">): number | null {
  if (promo.stock_limit == null) return null;
  return Math.max(0, promo.stock_limit - promo.stock_used);
}

export interface ProductPricing {
  basePriceCents: number;
  finalPriceCents: number;
  hasDiscount: boolean;
  percentOff: number;
}

/** Junta applyDiscount + discountPercentOff num só resultado — o que
 * ProductCard/ProductListCard/PromotionCard precisam pra decidir se mostram
 * o "de/por" riscado e o selo de desconto. `promo` null/undefined = sem
 * promoção, preço normal. */
export function getProductPricing(basePriceCents: number, promo: Promotion | null | undefined): ProductPricing {
  if (!promo) {
    return { basePriceCents, finalPriceCents: basePriceCents, hasDiscount: false, percentOff: 0 };
  }

  const finalPriceCents = applyDiscount(basePriceCents, promo);
  const hasDiscount = finalPriceCents < basePriceCents;

  return {
    basePriceCents,
    finalPriceCents,
    hasDiscount,
    percentOff: hasDiscount ? discountPercentOff(basePriceCents, finalPriceCents) : 0,
  };
}
