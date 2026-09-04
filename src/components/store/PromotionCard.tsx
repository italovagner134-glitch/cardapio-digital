"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import { FlameIcon } from "./FlameIcon";
import { PromotionCountdown } from "./PromotionCountdown";
import { formatBRL } from "@/lib/format";
import { applyDiscount, discountPercentOff, stockRemaining } from "@/lib/promotions";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import type { Promotion, Product } from "@/types/store";

interface PromotionCardProps {
  promotion: Promotion;
  product: Product;
  className?: string;
}

/** Card da Parte 3.3 — usado sozinho (full-width, quando só há uma promoção
 * viva), num carrossel de 78% (2+) e na página /promocoes. Sempre leva pro
 * produto com o desconto já aplicado. */
export function PromotionCard({ promotion, product, className = "" }: PromotionCardProps) {
  const router = useRouter();
  const { slug } = useStoreRef();

  const finalPriceCents = applyDiscount(product.price_cents, promotion);
  const hasDiscount = finalPriceCents < product.price_cents;
  const percentOff = hasDiscount ? discountPercentOff(product.price_cents, finalPriceCents) : 0;
  const remaining = stockRemaining(promotion);
  const imageUrl = promotion.image_url ?? product.image_url;

  return (
    <button
      type="button"
      onClick={() => router.push(routes.product(slug, product.slug))}
      className={`relative flex h-[140px] w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface text-left ${className}`}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <div className="flex flex-col gap-1.5">
          <span
            className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-onprimary"
            style={{ letterSpacing: "0.06em" }}
          >
            <FlameIcon size={12} />
            {promotion.badge_text}
          </span>
          <p className="line-clamp-1 text-[17px] font-bold text-content">{promotion.title}</p>
          {promotion.subtitle && <p className="line-clamp-2 text-xs leading-4 text-muted">{promotion.subtitle}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <p className="flex items-baseline gap-2">
            {hasDiscount && <span className="text-xs text-muted line-through">{formatBRL(product.price_cents)}</span>}
            <span className="text-xl font-bold text-primary">{formatBRL(finalPriceCents)}</span>
          </p>

          {remaining !== null && promotion.stock_limit && (
            <div className="flex flex-col gap-0.5">
              <div className="h-1 w-28 overflow-hidden rounded-full bg-surface2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, (remaining / promotion.stock_limit) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted">
                restam {remaining} de {promotion.stock_limit}
              </span>
            </div>
          )}

          {promotion.daily_end && <PromotionCountdown dailyEnd={promotion.daily_end} />}
        </div>
      </div>

      <div className="relative w-[40%] shrink-0">
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="200px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-surface2 text-muted">
            <ImageOff size={24} aria-hidden="true" />
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10"
          style={{ background: "linear-gradient(to right, var(--surface), transparent)" }}
        />
        {hasDiscount && (
          <span className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-success text-[12px] font-bold text-white">
            -{percentOff}%
          </span>
        )}
      </div>
    </button>
  );
}
