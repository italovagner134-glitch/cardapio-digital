"use client";

import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import { SolidHeader } from "@/components/store/SolidHeader";
import { PromotionCard } from "@/components/store/PromotionCard";
import type { Product, Promotion } from "@/types/store";

interface PromotionsPageContentProps {
  promotions: { promo: Promotion; product: Product }[];
}

export function PromotionsPageContent({ promotions }: PromotionsPageContentProps) {
  const router = useRouter();

  return (
    <div>
      <SolidHeader title="Promoções" onBack={() => router.back()} />

      {promotions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <Tag size={40} className="text-muted" aria-hidden="true" />
          <p className="text-sm text-muted">Nenhuma promoção ativa no momento</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          {promotions.map(({ promo, product }) => (
            <PromotionCard key={promo.id} promotion={promo} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
