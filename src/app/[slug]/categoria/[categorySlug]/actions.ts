"use server";

import { getCategoryProductsPage, type CategorySort } from "@/lib/supabase/store-queries";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { Product } from "@/types/store";

/** Página seguinte de produtos da categoria (Parte 2.2: paginação
 * incremental de 20 em 20, ou reordenação — troca de ordenação sempre
 * recomeça do offset 0, chamada pelo mesmo action). */
export async function loadCategoryProducts(
  categoryId: string,
  sort: CategorySort,
  offset: number,
  limit: number,
): Promise<{ products: Product[]; total: number }> {
  // Limite mais folgado que o do carrinho — rolagem infinita numa categoria
  // grande liga isto várias vezes seguidas de propósito; ainda barra um bot
  // raspando o catálogo inteiro em rajada.
  const ip = await getClientIp();
  const { success } = await checkRateLimit(`category-page:ip:${ip}`, { limit: 60, windowSeconds: 60 });
  if (!success) {
    return { products: [], total: 0 };
  }

  return getCategoryProductsPage(categoryId, { sort, limit, offset });
}
