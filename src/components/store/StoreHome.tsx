"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { StoreHeader } from "./StoreHeader";
import { StoreCover } from "./StoreCover";
import { StoreStatusBar } from "./StoreStatusBar";
import { UrgencyPanel } from "./UrgencyPanel";
import { MenuSearch } from "./MenuSearch";
import { CategoryChips, PROMOTIONS_CHIP_KEY } from "./CategoryChips";
import { SectionHeader } from "./SectionHeader";
import { FlameIcon } from "./FlameIcon";
import { ProductCarousel } from "./ProductCarousel";
import { ProductCard } from "./ProductCard";
import { CategorySection } from "./CategorySection";
import { PromotionBlock } from "./PromotionBlock";
import { FreeShippingBanner } from "./FreeShippingBanner";
import { EmptyMenu } from "./EmptyMenu";
import { matchesSearch } from "@/lib/search";
import { useStoreOverlays } from "@/lib/store-context";
import type { UrgencyState } from "@/lib/urgency";
import type { Store, Category, Product, Promotion } from "@/types/store";

interface CategorySectionData {
  category: Category;
  products: Product[];
}

interface StoreHomeProps {
  store: Store;
  isOpen: boolean | null;
  lastOrderAtISO: string | null;
  closingTimeLabel: string | null;
  nextOpeningLabel: string | null;
  urgencyState: UrgencyState;
  urgencyPanelEnabled: boolean;
  prepTimeMin: number;
  deliveryTimeMin: number;
  /** ISO do mesmo instante usado pra montar `urgencyState` (real ou
   * simulado via `?_now=`) — ver UrgencyPanel.tsx sobre por que precisa
   * ser o MESMO instante, não um `new Date()` novo aqui dentro. */
  urgencyNowISO: string;
  categories: Category[];
  featuredProducts: Product[];
  categorySections: CategorySectionData[];
  allProducts: Product[];
  livePromotions: Promotion[];
  productById: Map<string, Product>;
}

/**
 * Conteúdo da rota `/[slug]` — header/bottom nav/overlays já vêm do
 * AppShell em [slug]/layout.tsx, este componente só cuida do que é
 * específico da home (capa, status, busca, chips, promoções, seções).
 */
export function StoreHome({
  store,
  isOpen,
  lastOrderAtISO,
  closingTimeLabel,
  nextOpeningLabel,
  urgencyState,
  urgencyPanelEnabled,
  prepTimeMin,
  deliveryTimeMin,
  urgencyNowISO,
  categories,
  featuredProducts,
  categorySections,
  allProducts,
  livePromotions,
  productById,
}: StoreHomeProps) {
  const { openInfo } = useStoreOverlays();
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(
    livePromotions.length > 0 ? PROMOTIONS_CHIP_KEY : (categories[0]?.id ?? null),
  );
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const promotionsRef = useRef<HTMLDivElement>(null);

  const promotionByProductId = useMemo(() => {
    const map = new Map<string, Promotion>();
    for (const promo of livePromotions) {
      if (promo.product_id) map.set(promo.product_id, promo);
    }
    return map;
  }, [livePromotions]);

  // Loja "fechada" no sentido de operação (calculado no servidor). O
  // cronômetro (StoreStatusCountdown) refina a comunicação minuto a minuto,
  // mas quem manda no botão "+" ficar cinza é este booleano — se virar zero
  // enquanto a pessoa navega, o próprio cronômetro chama router.refresh() e
  // esta prop chega atualizada do servidor.
  const orderingDisabled = isOpen === false;

  const isSearching = query.trim().length > 0;
  const searchResults = isSearching
    ? allProducts.filter((product) => matchesSearch(query, product.name, product.description))
    : [];

  useEffect(() => {
    if (isSearching) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const categoryId = visible[0]?.target.getAttribute("data-category-id");
        if (categoryId) setActiveKey(categoryId);
      },
      { rootMargin: "-140px 0px -70% 0px", threshold: 0 },
    );

    sectionRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [isSearching, categorySections.length]);

  function handleChipSelect(category: Category) {
    setActiveKey(category.id);
    sectionRefs.current.get(category.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Permite compartilhar o link já posicionado na seção (Parte 2.1) —
    // sem re-render, só a URL.
    window.history.replaceState(null, "", `#categoria-${category.slug}`);
  }

  function handleSelectPromotions() {
    setActiveKey(PROMOTIONS_CHIP_KEY);
    promotionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasAnyProduct = allProducts.length > 0;

  return (
    <>
      {/* Header flutuante sobre a mídia — sem tarja (ver AppShell/StoreHeader). */}
      <section className="relative isolate">
        <StoreCover
          storeName={store.name}
          logoUrl={store.logo_url}
          coverType={store.cover_type}
          coverUrl={store.cover_url}
          coverVideoUrl={store.cover_video_url}
          coverPosterUrl={store.cover_poster_url}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/55 via-black/20 to-transparent"
        />
      </section>
      <StoreHeader storeName={store.name} logoUrl={store.logo_url} />

      <div className="px-4">
        <StoreStatusBar
          lastOrderAtISO={lastOrderAtISO}
          closingTimeLabel={closingTimeLabel}
          nextOpeningLabel={nextOpeningLabel}
          closingSoonThresholdMin={store.closing_soon_threshold_min}
          clockOffsetMs={urgencyState.clockOffsetMs}
        />
      </div>

      <UrgencyPanel
        state={urgencyState}
        enabled={urgencyPanelEnabled}
        prepTimeMin={prepTimeMin}
        deliveryTimeMin={deliveryTimeMin}
        nextOpeningLabel={nextOpeningLabel}
        now={new Date(urgencyNowISO)}
      />

      <div className="px-4">
        {/* Busca */}
        <div className="mt-4">
          <MenuSearch onQueryChange={setQuery} />
        </div>
      </div>

      {!hasAnyProduct ? (
        <EmptyMenu />
      ) : isSearching ? (
        <div className="mt-5 px-4">
          {searchResults.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-muted">Nenhum item encontrado para &ldquo;{query}&rdquo;</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-content transition-transform duration-150 active:scale-95"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  orderingDisabled={orderingDisabled}
                  promotion={promotionByProductId.get(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-4">
            <CategoryChips
              categories={categories}
              activeKey={activeKey}
              onSelectCategory={handleChipSelect}
              hasLivePromotions={livePromotions.length > 0}
              onSelectPromotions={handleSelectPromotions}
            />
          </div>

          {livePromotions.length > 0 && (
            <div ref={promotionsRef} className="scroll-mt-32">
              <PromotionBlock promotions={livePromotions} productById={productById} />
            </div>
          )}

          {featuredProducts.length > 0 && (
            <section>
              <SectionHeader icon={<FlameIcon size={20} />} title="Mais pedidos" />
              <ProductCarousel
                products={featuredProducts}
                orderingDisabled={orderingDisabled}
                promotionByProductId={promotionByProductId}
              />
            </section>
          )}

          {categorySections.map(({ category, products }) => (
            <CategorySection
              key={category.id}
              category={category}
              products={products}
              orderingDisabled={orderingDisabled}
              promotionByProductId={promotionByProductId}
              sectionRef={(element) => {
                if (element) sectionRefs.current.set(category.id, element);
                else sectionRefs.current.delete(category.id);
              }}
            />
          ))}

          <FreeShippingBanner minOrderValue={store.free_shipping_min} onClick={openInfo} />
        </>
      )}
    </>
  );
}
