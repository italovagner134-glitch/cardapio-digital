"use client";

import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { PromotionCard } from "./PromotionCard";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import type { Promotion, Product } from "@/types/store";

interface PromotionBlockProps {
  promotions: Promotion[];
  productById: Map<string, Product>;
}

/** Parte 3.3: nenhuma promoção viva → não renderiza nada (nem espaço vazio,
 * nem "sem promoções no momento"). Uma → card full-width. Duas ou mais →
 * carrossel + "Ver todas". Promoção sem produto vinculado (product_id nulo
 * ou produto removido) não tem pra onde levar o clique, então é descartada
 * aqui — nunca chega a renderizar um card quebrado. */
export function PromotionBlock({ promotions, productById }: PromotionBlockProps) {
  const router = useRouter();
  const { slug } = useStoreRef();

  const withProduct = promotions
    .map((promo) => ({ promo, product: promo.product_id ? productById.get(promo.product_id) : undefined }))
    .filter((entry): entry is { promo: Promotion; product: Product } => !!entry.product);

  if (withProduct.length === 0) return null;

  if (withProduct.length === 1) {
    const { promo, product } = withProduct[0];
    return (
      <div className="mx-4 mt-4">
        <PromotionCard promotion={promo} product={product} />
      </div>
    );
  }

  return (
    <section className="mt-4">
      <SectionHeader
        icon={<Tag size={20} className="text-primary" aria-hidden="true" />}
        title="Promoções de hoje"
        onSeeAllClick={() => router.push(routes.promotions(slug))}
        seeAllLabel="Ver todas"
      />
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none px-4"
        style={{ scrollPaddingLeft: 16 }}
      >
        {withProduct.map(({ promo, product }) => (
          <PromotionCard key={promo.id} promotion={promo} product={product} className="w-[78%]" />
        ))}
      </div>
    </section>
  );
}
