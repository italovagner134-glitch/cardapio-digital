"use server";

import { createClient } from "@/lib/supabase/server";
import { getLivePromotions } from "@/lib/supabase/store-queries";
import { applyDiscount } from "@/lib/promotions";

export interface CartPriceCheck {
  productId: string;
  /** false = produto sumiu/foi excluído desde que entrou no carrinho. */
  exists: boolean;
  available: boolean;
  currentProductPriceCents: number;
  currentPromotionId: string | null;
}

/**
 * Revalida no servidor o preço-base de cada produto do carrinho e se ainda
 * há promoção viva pra ele (Parte 3.3/critério de aceite: "revalidado no
 * servidor no fechamento do pedido") — nunca confia no preço que já estava
 * salvo no localStorage, que pode ter ficado velho (dono mudou o preço, ou
 * a promoção acabou entre o cliente adicionar e fechar o pedido).
 *
 * Só cobre o preço do PRODUTO em si + a promoção — o preço dos adicionais
 * (product_options) já selecionados não é revalidado nesta rodada (eles
 * quase não mudam de preço no dia a dia, diferente de uma promoção "só
 * hoje"); fica como TODO se algum dia isso importar.
 */
export async function checkCartPrices(restaurantId: string, productIds: string[]): Promise<CartPriceCheck[]> {
  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length === 0) return [];

  const supabase = await createClient();

  const [{ data: products }, livePromotions] = await Promise.all([
    supabase.from("products").select("id, price_cents, is_available").in("id", uniqueIds),
    getLivePromotions(restaurantId),
  ]);

  const promoByProductId = new Map(
    livePromotions.filter((promo) => promo.product_id).map((promo) => [promo.product_id as string, promo]),
  );
  const productById = new Map((products ?? []).map((product) => [product.id, product]));

  return uniqueIds.map((productId) => {
    const product = productById.get(productId);
    if (!product) {
      return { productId, exists: false, available: false, currentProductPriceCents: 0, currentPromotionId: null };
    }

    const promo = promoByProductId.get(productId);
    return {
      productId,
      exists: true,
      available: product.is_available,
      currentProductPriceCents: promo ? applyDiscount(product.price_cents, promo) : product.price_cents,
      currentPromotionId: promo?.id ?? null,
    };
  });
}
