import { notFound } from "next/navigation";
import type { Metadata, Viewport } from "next";
import {
  getStoreBySlug,
  getStoreCategories,
  getFeaturedProducts,
  getAllProducts,
  getLivePromotions,
} from "@/lib/supabase/store-queries";
import { isOpenNow, getClosingTimeLabel, getLastOrderInstant, getNextOpeningLabel } from "@/lib/business-hours";
import { buildUrgencyState } from "@/lib/urgency";
import { StoreHome } from "@/components/store/StoreHome";
import type { Product } from "@/types/store";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * `?_now=2026-08-29T22:35:00-03:00` sobrescreve o "agora" usado por TODO
 * cálculo de horário/urgência desta página (não só o painel — a linha de
 * status simples e o `orderingDisabled` também, senão a home renderizaria
 * um estado inconsistente: painel "fechada" ao lado de "Aberto agora").
 * Só existe em desenvolvimento — em produção `_now` é ignorado, mesmo que
 * alguém tente passar o parâmetro na URL (Parte 8.3 do prompt de urgência).
 */
function resolveSimulatedNow(searchParams: { [key: string]: string | string[] | undefined }): Date | undefined {
  if (process.env.NODE_ENV !== "development") return undefined;
  const raw = searchParams._now;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);

  if (!bundle) return { title: "Cardápio não encontrado" };

  const { store } = bundle;
  return {
    title: `${store.name} — Cardápio Digital`,
    description: `Cardápio digital de ${store.name}${store.city ? ` em ${store.city}` : ""}.`,
    openGraph: {
      title: store.name,
      images: store.cover_url ? [store.cover_url] : undefined,
    },
  };
}

// theme-color acompanha o tema de cada loja (a barra de status do celular
// fica sobre a mídia de capa — ver StoreHeader). Varia por restaurante, não
// por posição de scroll: animar o valor por pixel não é suportado pelos
// navegadores de forma confiável, e o SO já amortece a transição sozinho.
export async function generateViewport({ params }: PageProps): Promise<Viewport> {
  const { slug } = await params;
  const bundle = await getStoreBySlug(slug);

  return {
    themeColor: bundle?.store.theme_bg ?? "#0B0B0C",
    width: "device-width",
    initialScale: 1,
  };
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const simulatedNow = resolveSimulatedNow(resolvedSearchParams);
  const bundle = await getStoreBySlug(slug);

  if (!bundle) {
    notFound();
  }

  const { store, businessHours } = bundle;

  const [categories, featuredProducts, allProducts, livePromotions] = await Promise.all([
    getStoreCategories(store.id),
    getFeaturedProducts(store.id),
    getAllProducts(store.id),
    getLivePromotions(store.id),
  ]);

  // Uma seção por categoria ativa que já tem produto disponível — inclui
  // "Combos" (ícone de presente) e qualquer outra que o dono tiver criado.
  // Categoria sem produto não aparece nem na régua de chips nem como seção
  // (Parte 2.3: "chip que leva a lugar vazio é pior que chip nenhum").
  const productsByCategoryId = new Map<string, Product[]>();
  for (const product of allProducts) {
    const list = productsByCategoryId.get(product.category_id) ?? [];
    list.push(product);
    productsByCategoryId.set(product.category_id, list);
  }

  const categorySections = categories
    .map((category) => ({
      category,
      products: (productsByCategoryId.get(category.id) ?? []).filter((p) => p.is_available),
    }))
    .filter((section) => section.products.length > 0);

  const chipCategories = categorySections.map((section) => section.category);
  const productById = new Map(allProducts.map((product) => [product.id, product]));

  // Um único instante pra tudo nesta página — real em produção, simulado
  // em dev (?_now=). buildUrgencyState E UrgencyPanel (via urgencyNowISO)
  // precisam do MESMO `now`; usar `new Date()` em cada um separadamente
  // deixaria o painel decidindo a variante contra um relógio diferente do
  // que gerou os instantes que ele está exibindo.
  const requestNow = simulatedNow ?? new Date();

  const isOpen = isOpenNow(businessHours, requestNow);
  const closingTimeLabel = isOpen ? getClosingTimeLabel(businessHours, requestNow) : null;
  const nextOpeningLabel = isOpen ? null : getNextOpeningLabel(businessHours, requestNow);
  const lastOrderAt = getLastOrderInstant(businessHours, store.last_order_offset_min, requestNow);

  const urgencyState = buildUrgencyState(
    businessHours,
    {
      prepTimeMin: store.prep_time_min,
      deliveryTimeMin: store.delivery_time_min,
      lastOrderOffsetMin: store.last_order_offset_min,
      closingSoonThresholdMin: store.closing_soon_threshold_min,
      freeShippingMin: store.free_shipping_min,
      urgencyPanelEnabled: store.urgency_panel_enabled,
    },
    requestNow,
  );

  return (
    <StoreHome
      store={store}
      isOpen={isOpen}
      lastOrderAtISO={lastOrderAt ? lastOrderAt.toISOString() : null}
      closingTimeLabel={closingTimeLabel}
      nextOpeningLabel={nextOpeningLabel}
      urgencyState={urgencyState}
      urgencyPanelEnabled={store.urgency_panel_enabled}
      prepTimeMin={store.prep_time_min}
      deliveryTimeMin={store.delivery_time_min}
      urgencyNowISO={requestNow.toISOString()}
      categories={chipCategories}
      featuredProducts={featuredProducts}
      categorySections={categorySections}
      allProducts={allProducts}
      livePromotions={livePromotions}
      productById={productById}
    />
  );
}
