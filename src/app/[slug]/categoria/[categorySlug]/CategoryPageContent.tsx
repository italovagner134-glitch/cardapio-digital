"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SolidHeader } from "@/components/store/SolidHeader";
import { ProductListCard } from "@/components/store/ProductListCard";
import { ProductCard } from "@/components/store/ProductCard";
import { CATEGORY_ICONS, UtensilsIcon, type CategoryIconKey } from "@/components/store/icons";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { loadCategoryProducts } from "./actions";
import type { Category, Product, Promotion } from "@/types/store";
import type { CategorySort } from "@/lib/supabase/store-queries";

const SORT_OPTIONS: { value: CategorySort; label: string }[] = [
  { value: "featured", label: "Mais pedidos" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

const PAGE_SIZE = 20;

interface CategoryPageContentProps {
  category: Category;
  chips: Category[];
  initialProducts: Product[];
  total: number;
  promotionByProductId: Map<string, Promotion>;
  orderingDisabled: boolean;
}

export function CategoryPageContent({
  category,
  chips,
  initialProducts,
  total,
  promotionByProductId,
  orderingDisabled,
}: CategoryPageContentProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const [sort, setSort] = useState<CategorySort>("featured");
  const [products, setProducts] = useState(initialProducts);
  const [loadedTotal, setLoadedTotal] = useState(total);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  function handleSortChange(nextSort: CategorySort) {
    if (nextSort === sort) return;
    setSort(nextSort);
    startTransition(async () => {
      const page = await loadCategoryProducts(category.id, nextSort, 0, PAGE_SIZE);
      setProducts(page.products);
      setLoadedTotal(page.total);
    });
  }

  useEffect(() => {
    if (products.length >= loadedTotal) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isPending) {
          startTransition(async () => {
            const page = await loadCategoryProducts(category.id, sort, products.length, PAGE_SIZE);
            setProducts((prev) => [...prev, ...page.products]);
            setLoadedTotal(page.total);
          });
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [products.length, loadedTotal, isPending, category.id, sort]);

  const CategoryIcon = CATEGORY_ICONS[category.icon_key as CategoryIconKey] ?? UtensilsIcon;

  return (
    <div>
      <SolidHeader title={category.name} onBack={() => router.back()} />

      {/* Régua de chips — pula direto pra outra categoria sem voltar pra
          home (Parte 2.2). */}
      <div className="sticky top-16 z-30 flex gap-4 overflow-x-auto scrollbar-none bg-bg/95 px-4 py-3 backdrop-blur-md">
        {chips.map((chip) => {
          const Icon = CATEGORY_ICONS[chip.icon_key as CategoryIconKey] ?? UtensilsIcon;
          const active = chip.id === category.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => router.push(routes.category(slug, chip.slug))}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className="flex size-14 items-center justify-center border bg-surface text-primary transition-[border-radius,box-shadow,border-color] duration-[220ms]"
                style={{
                  borderRadius: active ? "9999px" : "1rem",
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  boxShadow: active ? "0 0 0 4px color-mix(in srgb, var(--primary) 12%, transparent)" : "none",
                }}
              >
                <Icon size={24} />
              </span>
              <span className={`text-[11px] font-medium ${active ? "font-semibold text-primary" : "text-muted"}`}>
                {chip.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-xs text-muted">
          {loadedTotal} {loadedTotal === 1 ? "item" : "itens"}
        </p>
      </div>

      {/* Barra de ordenação */}
      <div className="flex gap-2 px-4 py-3">
        {SORT_OPTIONS.map((option) => {
          const active = option.value === sort;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSortChange(option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? "bg-primary text-onprimary" : "border border-line text-muted"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <CategoryIcon size={40} className="text-muted" />
          <p className="text-sm text-muted">Nenhum item nesta categoria por enquanto</p>
        </div>
      ) : category.display_style === "carousel" ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              promotion={promotionByProductId.get(product.id)}
              orderingDisabled={orderingDisabled}
            />
          ))}
        </div>
      ) : (
        <div className="mx-4 overflow-hidden rounded-2xl border border-line bg-surface">
          {products.map((product) => (
            <ProductListCard
              key={product.id}
              product={product}
              promotion={promotionByProductId.get(product.id)}
              orderingDisabled={orderingDisabled}
            />
          ))}
        </div>
      )}

      {products.length < loadedTotal && <div ref={sentinelRef} className="h-8" />}
    </div>
  );
}
