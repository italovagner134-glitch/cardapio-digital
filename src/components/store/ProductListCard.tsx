"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { getProductPricing } from "@/lib/promotions";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";
import type { Product, Promotion } from "@/types/store";

interface ProductListCardProps {
  product: Product;
  orderingDisabled?: boolean;
  promotion?: Promotion;
}

/** Card de linha (Parte 2.1) — formato certo pra categoria com muitos itens:
 * carrossel obriga o cliente a arrastar e ele desiste. Imagem 88×88 à
 * esquerda, conteúdo à direita, "+" no canto. Mesma regra de clique/adição
 * do ProductCard (grupo obrigatório manda pro detalhe em vez de adicionar
 * direto). */
export function ProductListCard({ product, orderingDisabled = false, promotion }: ProductListCardProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const cart = useCart();

  const pricing = getProductPricing(product.price_cents, promotion);
  const hasRequiredGroup = product.product_option_groups.some((group) => group.min_select > 0);

  function goToDetail() {
    router.push(routes.product(slug, product.slug));
  }

  function handleAddClick(event: React.MouseEvent) {
    event.stopPropagation();
    if (orderingDisabled) return;

    if (hasRequiredGroup) {
      goToDetail();
      return;
    }

    cart.addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      imageUrl: product.image_url,
      quantity: 1,
      note: "",
      selections: [],
      optionsTotalCents: 0,
      unitBasePriceCents: pricing.basePriceCents,
      unitPriceCents: pricing.finalPriceCents,
      promotionId: promotion?.id ?? null,
    });
    toast.success(`${product.name} adicionado`, { description: formatBRL(pricing.finalPriceCents) });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          goToDetail();
        }
      }}
      aria-label={`Ver ${product.name}`}
      className="flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-b-0"
    >
      <div className="relative size-[88px] shrink-0 overflow-hidden rounded-xl bg-surface2">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="88px" className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <ImageOff size={22} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="line-clamp-1 text-sm font-semibold text-content">{product.name}</p>
        <p className="line-clamp-2 text-xs leading-4 text-muted">{product.description}</p>
        {pricing.hasDiscount ? (
          <p className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-muted line-through">{formatBRL(pricing.basePriceCents)}</span>
            <span className="text-sm font-bold text-primary">{formatBRL(pricing.finalPriceCents)}</span>
          </p>
        ) : (
          <p className="text-sm font-bold text-primary">{formatBRL(pricing.finalPriceCents)}</p>
        )}
      </div>

      <div className="relative shrink-0 self-end">
        <button
          type="button"
          onClick={handleAddClick}
          disabled={orderingDisabled}
          aria-label={
            orderingDisabled
              ? `${product.name} indisponível — loja fechada`
              : hasRequiredGroup
                ? `Escolher opções de ${product.name}`
                : `Adicionar ${product.name} ao carrinho`
          }
          className="group flex size-8 items-center justify-center rounded-full bg-primary text-onprimary shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-transform duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          <Plus size={18} aria-hidden="true" className="transition-transform duration-150 group-active:rotate-90" />
        </button>
      </div>
    </div>
  );
}
