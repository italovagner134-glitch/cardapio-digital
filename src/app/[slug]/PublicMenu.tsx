"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Search, Info, ImageOff, Clock } from "lucide-react";
import { isOpenNow } from "@/lib/business-hours";
import { InfoModal } from "./InfoModal";
import { ProductModal } from "./ProductModal";
import { ProductCard } from "./ProductCard";
import { formatBRL, type ProductWithOptions } from "./types";
import type { Tables } from "@/lib/supabase/types";

interface PublicMenuProps {
  restaurant: Tables<"restaurants">;
  settings: Tables<"restaurant_settings"> | null;
  businessHours: Pick<
    Tables<"business_hours">,
    "day_of_week" | "opens_at" | "closes_at" | "is_closed"
  >[];
  categories: Tables<"categories">[];
  products: ProductWithOptions[];
}

export function PublicMenu({
  restaurant,
  settings,
  businessHours,
  categories,
  products,
}: PublicMenuProps) {
  const [query, setQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithOptions | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(categories[0]?.id ?? null);

  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const open = isOpenNow(businessHours);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = normalizedQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(normalizedQuery) ||
          product.description?.toLowerCase().includes(normalizedQuery),
      )
    : products;

  const featuredProducts = useMemo(
    () => products.filter((product) => product.is_featured && product.is_available),
    [products],
  );

  const categoriesWithProducts = categories
    .map((category) => ({
      category,
      products: filteredProducts
        .filter((product) => product.category_id === category.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((entry) => entry.products.length > 0);

  useEffect(() => {
    if (normalizedQuery) return; // scroll-spy não faz sentido durante busca

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveCategoryId(visible[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );

    sectionRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [normalizedQuery, categoriesWithProducts.length]);

  function scrollToCategory(categoryId: string) {
    const element = sectionRefs.current.get(categoryId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-kraft-100 pb-16">
      {/* Capa */}
      <div className="relative h-40 w-full bg-tinta-900 sm:h-56">
        {restaurant.cover_url && (
          <Image
            src={restaurant.cover_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-tinta-900/60 to-transparent" />
      </div>

      {/* Logo + nome */}
      <div className="px-4">
        <div className="-mt-10 flex items-end gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-kraft-100 bg-white">
            {restaurant.logo_url ? (
              <Image src={restaurant.logo_url} alt={restaurant.name} fill sizes="80px" className="object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-tinta-900/30">
                <ImageOff className="size-6" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate font-heading text-xl font-bold text-tinta-900">
              {restaurant.name}
            </h1>
            {open !== null && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${open ? "bg-manjericao-600" : "bg-destructive"}`}
                />
                {open ? (
                  <span className="text-manjericao-600">Aberto agora</span>
                ) : (
                  <span className="text-destructive">Fechado agora</span>
                )}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-tinta-900/15 bg-white px-3 py-1.5 text-xs font-medium text-tinta-900"
          >
            <Info className="size-3.5" aria-hidden="true" />
            Informações
          </button>
        </div>

        {(settings?.delivery_time_min || settings?.min_order_cents) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-900/70">
            {settings?.accepts_delivery && settings.delivery_time_min && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden="true" />
                {settings.delivery_time_min}
                {settings.delivery_time_max ? `-${settings.delivery_time_max}` : ""} min
              </span>
            )}
            {settings?.min_order_cents ? (
              <span>Pedido mínimo {formatBRL(settings.min_order_cents)}</span>
            ) : null}
          </div>
        )}

        {settings?.order_notice && (
          <p className="mt-3 rounded-lg bg-mostarda-400/20 px-3 py-2 text-sm text-tinta-900">
            {settings.order_notice}
          </p>
        )}

        {/* Busca */}
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-900/40"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no cardápio"
            className="w-full rounded-full border border-tinta-900/15 bg-white py-2.5 pl-9 pr-4 text-sm text-tinta-900 outline-none focus-visible:border-pimenta-500"
          />
        </div>
      </div>

      {/* Destaques */}
      {featuredProducts.length > 0 && !normalizedQuery && (
        <div className="mt-5 flex gap-3 overflow-x-auto px-4 pb-1">
          {featuredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelectedProduct(product)}
              className="w-40 shrink-0 rounded-xl border border-tinta-900/10 bg-white p-2 text-left"
            >
              <div className="relative h-24 w-full overflow-hidden rounded-lg bg-kraft-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-tinta-900/30">
                    <ImageOff className="size-5" aria-hidden="true" />
                  </div>
                )}
              </div>
              <p className="mt-2 truncate text-sm font-medium text-tinta-900">{product.name}</p>
              <p className="font-mono text-xs text-tinta-900/70">{formatBRL(product.price_cents)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Barra de categorias */}
      {!normalizedQuery && categories.length > 0 && (
        <div className="sticky top-0 z-20 mt-5 flex gap-2 overflow-x-auto border-b border-tinta-900/10 bg-kraft-100/95 px-4 py-3 backdrop-blur">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => scrollToCategory(category.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeCategoryId === category.id
                  ? "bg-pimenta-500 text-white"
                  : "bg-white text-tinta-900/70"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Produtos */}
      <div className="mt-5 flex flex-col gap-6 px-4">
        {categoriesWithProducts.length === 0 && (
          <p className="py-12 text-center text-tinta-900/50">
            {normalizedQuery ? "Nada encontrado." : "Cardápio ainda sem produtos."}
          </p>
        )}

        {categoriesWithProducts.map(({ category, products: categoryProducts }) => (
          <section
            key={category.id}
            id={`cat-${category.id}`}
            ref={(element) => {
              if (element) sectionRefs.current.set(category.id, element);
              else sectionRefs.current.delete(category.id);
            }}
            className="scroll-mt-20"
          >
            <h2 className="mb-2 font-heading text-base font-semibold text-tinta-900">
              {category.name}
            </h2>
            <div className="flex flex-col gap-2">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <InfoModal
        open={infoOpen}
        onOpenChange={setInfoOpen}
        restaurant={restaurant}
        settings={settings}
        businessHours={businessHours}
      />

      <ProductModal product={selectedProduct} onOpenChange={(o) => !o && setSelectedProduct(null)} />
    </div>
  );
}
