"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "./SectionHeader";
import { ProductCarousel } from "./ProductCarousel";
import { ProductListCard } from "./ProductListCard";
import { GiftIcon, CATEGORY_ICONS, UtensilsIcon, type CategoryIconKey } from "./icons";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import type { Category, Product, Promotion } from "@/types/store";

interface CategorySectionProps {
  category: Category;
  products: Product[];
  orderingDisabled: boolean;
  promotionByProductId: Map<string, Promotion>;
  sectionRef: (element: HTMLElement | null) => void;
}

/** Uma seção de categoria da home — carrossel (Destaques/Combos) ou lista
 * vertical (o resto, Parte 2.1: "carrossel obriga o cliente a arrastar e ele
 * desiste" quando tem muito item). "Ver todos" manda pra página dedicada da
 * categoria (Parte 2.2). */
export function CategorySection({
  category,
  products,
  orderingDisabled,
  promotionByProductId,
  sectionRef,
}: CategorySectionProps) {
  const router = useRouter();
  const { slug } = useStoreRef();

  const isCombo = /combo/i.test(category.name);
  const CategoryIcon = CATEGORY_ICONS[category.icon_key as CategoryIconKey] ?? UtensilsIcon;

  return (
    <section
      id={`categoria-${category.slug}`}
      data-category-id={category.id}
      ref={sectionRef}
      className="scroll-mt-32"
    >
      <SectionHeader
        icon={
          isCombo ? (
            <GiftIcon size={20} className="text-primary" />
          ) : (
            <CategoryIcon size={20} className="text-primary" />
          )
        }
        title={category.name}
        onSeeAllClick={() => router.push(routes.category(slug, category.slug))}
      />

      {category.display_style === "carousel" ? (
        <ProductCarousel
          products={products}
          orderingDisabled={orderingDisabled}
          promotionByProductId={promotionByProductId}
        />
      ) : (
        <div className="mx-4 overflow-hidden rounded-2xl border border-line bg-surface">
          {products.map((product) => (
            <ProductListCard
              key={product.id}
              product={product}
              orderingDisabled={orderingDisabled}
              promotion={promotionByProductId.get(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
