import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isPromotionLive } from "@/lib/promotions";
import type { Store, Category, Product, BusinessHourRow, StoreSettings, Promotion } from "@/types/store";

export interface StoreBundle {
  store: Store;
  settings: StoreSettings | null;
  businessHours: BusinessHourRow[];
}

/**
 * Restaurante (com os campos de tema) + configurações + horários, só se
 * estiver publicado (`status = 'active'`). `null` vira 404 na page.
 *
 * `cache()` do React: a partir desta etapa a mesma loja é buscada por mais
 * de um Server Component na mesma requisição (layout.tsx pro chrome +
 * page.tsx de cada rota) — sem isso seria uma query duplicada por navegação.
 */
export const getStoreBySlug = cache(async function getStoreBySlug(slug: string): Promise<StoreBundle | null> {
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!store) return null;

  const [{ data: settings }, { data: businessHours }] = await Promise.all([
    supabase.from("restaurant_settings").select("*").eq("restaurant_id", store.id).maybeSingle(),
    supabase
      .from("business_hours")
      .select("day_of_week, opens_at, closes_at, is_closed, position")
      .eq("restaurant_id", store.id)
      .order("day_of_week", { ascending: true })
      .order("position", { ascending: true }),
  ]);

  return { store, settings: settings ?? null, businessHours: businessHours ?? [] };
});

/** Categorias visíveis na régua/home, na ordem de exibição do dono
 * (Parte 2.3: "categoria sem nenhum produto disponível não aparece" é
 * filtrado por quem RENDERIZA os chips, não aqui — esta função já devolve
 * todas as visíveis, com ou sem produto). */
export const getStoreCategories = cache(async function getStoreCategories(restaurantId: string): Promise<Category[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  return data ?? [];
});

/**
 * Categoria por slug — SEM filtrar `is_visible`, de propósito: uma categoria
 * oculta ainda precisa resolver por link direto (Parte 2.3: "a URL continua
 * respondendo"), só sai da régua/home. `is_active=false` (exclusão de
 * verdade) continua bloqueado pela RLS normalmente.
 */
export async function getCategoryBySlug(restaurantId: string, categorySlug: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("slug", categorySlug)
    .eq("is_active", true)
    .maybeSingle();

  return data ?? null;
}

/**
 * "Mais pedidos": ainda não existe histórico de vendas (isso é Fase 3/4,
 * quando `orders` existir) — por ora usa `is_featured` como o dono já marca
 * manualmente em Produtos, ordenado por `sort_order` como proxy honesto.
 */
export async function getFeaturedProducts(restaurantId: string): Promise<Product[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, product_option_groups(*, product_options(*))")
    .eq("restaurant_id", restaurantId)
    .eq("is_featured", true)
    .eq("is_available", true)
    .order("sort_order", { ascending: true })
    .limit(10);

  return data ?? [];
}

export async function getAllProducts(restaurantId: string): Promise<Product[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, product_option_groups(*, product_options(*))")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getProductBySlug(restaurantId: string, productSlug: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*, product_option_groups(*, product_options(*))")
    .eq("restaurant_id", restaurantId)
    .eq("slug", productSlug)
    .maybeSingle();

  return data ?? null;
}

export type CategorySort = "featured" | "price_asc" | "price_desc";

interface CategoryProductsPage {
  products: Product[];
  total: number;
}

/** Lista paginada de uma categoria (Parte 2.2: "Ver todos" + paginação
 * incremental de 20 em 20 + ordenação). `total` alimenta o contador
 * "18 itens" sem precisar de uma segunda query. */
export async function getCategoryProductsPage(
  categoryId: string,
  { sort, limit, offset }: { sort: CategorySort; limit: number; offset: number },
): Promise<CategoryProductsPage> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, product_option_groups(*, product_options(*))", { count: "exact" })
    .eq("category_id", categoryId)
    .eq("is_available", true);

  if (sort === "price_asc") query = query.order("price_cents", { ascending: true });
  else if (sort === "price_desc") query = query.order("price_cents", { ascending: false });
  else query = query.order("is_featured", { ascending: false }).order("sort_order", { ascending: true });

  const { data, count } = await query.range(offset, offset + limit - 1);

  return { products: data ?? [], total: count ?? 0 };
}

/** Só as promoções que estão valendo NESTE INSTANTE (Parte 3.2:
 * isPromotionLive roda no servidor, no fuso da loja) — a RLS já filtra
 * is_active + restaurante público; aqui refina janela de dia/hora/estoque. */
export async function getLivePromotions(restaurantId: string): Promise<Promotion[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("promotions")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("position", { ascending: true });

  return (data ?? []).filter((promo) => isPromotionLive(promo));
}

/** Map<product_id, Promotion> só das promoções vivas — pra threadar preço
 * promocional em qualquer listagem de produto (home, categoria, busca) sem
 * repetir a query de promoções em cada uma. */
export function buildPromotionByProductId(promotions: Promotion[]): Map<string, Promotion> {
  const map = new Map<string, Promotion>();
  for (const promo of promotions) {
    if (promo.product_id) map.set(promo.product_id, promo);
  }
  return map;
}
