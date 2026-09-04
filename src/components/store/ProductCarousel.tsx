"use client";

import { ProductCard } from "./ProductCard";
import type { Product, Promotion } from "@/types/store";

interface ProductCarouselProps {
  products: Product[];
  orderingDisabled?: boolean;
  promotionByProductId?: Map<string, Promotion>;
}

export function ProductCarousel({ products, orderingDisabled = false, promotionByProductId }: ProductCarouselProps) {
  return (
    <div
      className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-4"
      style={{ scrollPaddingLeft: 16, WebkitOverflowScrolling: "touch" }}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 2}
          orderingDisabled={orderingDisabled}
          promotion={promotionByProductId?.get(product.id)}
        />
      ))}
    </div>
  );
}
