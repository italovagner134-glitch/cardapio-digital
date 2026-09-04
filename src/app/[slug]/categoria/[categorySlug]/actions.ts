"use server";

import { getCategoryProductsPage, type CategorySort } from "@/lib/supabase/store-queries";
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
  return getCategoryProductsPage(categoryId, { sort, limit, offset });
}
