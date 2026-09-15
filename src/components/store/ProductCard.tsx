"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { FlameIcon } from "./FlameIcon";
import { formatBRL } from "@/lib/format";
import { getProductPricing } from "@/lib/promotions";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";
import type { Product, Promotion } from "@/types/store";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  /** true quando a loja está fechada agora — desabilita o botão "+", mas o
   * card continua abrível (o cliente ainda pode ver o produto). */
  orderingDisabled?: boolean;
  /** Promoção viva deste produto, se houver (Parte 3.3: preço promocional
   * também no card, não só no bloco de destaque). */
  promotion?: Promotion;
}

export function ProductCard({ product, priority = false, orderingDisabled = false, promotion }: ProductCardProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const cart = useCart();
  // M4: URL de imagem quebrada (arquivo removido do storage, link externo
  // caído) mostrava o ícone padrão do navegador em vez do placeholder do
  // app — este estado troca pro mesmo fallback já usado quando não há URL.
  const [imageBroken, setImageBroken] = useState(false);

  const pricing = getProductPricing(product.price_cents, promotion);
  const hasRequiredGroup = product.product_option_groups.some((group) => group.min_select > 0);

  const badge = pricing.hasDiscount
    ? { label: `-${pricing.percentOff}%`, tone: "success" as const }
    : product.is_featured
      ? { label: "Mais pedido", tone: "primary" as const }
      : product.compare_at_price_cents
        ? { label: "Novo preço", tone: "success" as const }
        : null;

  function goToDetail() {
    router.push(routes.product(slug, product.slug));
  }

  function handleAddClick(event: React.MouseEvent) {
    event.stopPropagation();
    if (orderingDisabled) return;

    if (hasRequiredGroup) {
      // Não dá pra adicionar um lanche sem o cliente escolher o ponto da
      // carne — manda pro detalhe em vez de tentar simular a escolha aqui.
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
    toast.success(`${product.name} adicionado`, {
      description: formatBRL(pricing.finalPriceCents),
    });
  }

  return (
    // Não é um <button> real (evita aninhar o botão "+" dentro de outro
    // botão, inválido/quebra leitor de tela) — role+tabIndex dão o mesmo
    // comportamento de clique e foco por teclado pro card inteiro.
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
      className="relative w-full shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
      style={{ width: "44vw", minWidth: 150, maxWidth: 180 }}
    >
      <div className="relative aspect-square w-full bg-surface2">
        {product.image_url && !imageBroken ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority={priority}
            sizes="180px"
            className="object-cover"
            onError={() => setImageBroken(true)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <ImageOff size={28} aria-hidden="true" />
          </div>
        )}

        {badge && (
          <span
            className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-[12px] px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
              badge.tone === "primary" ? "bg-primary text-onprimary" : "bg-success text-white"
            }`}
          >
            {badge.tone === "primary" && <FlameIcon size={12} />}
            {badge.label}
          </span>
        )}

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
          className="group absolute bottom-3 right-3 flex size-11 items-center justify-center rounded-full bg-primary text-onprimary shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-transform duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          <Plus
            size={18}
            aria-hidden="true"
            className="transition-transform duration-150 group-active:rotate-90"
          />
        </button>
      </div>

      <div className="flex flex-col gap-1 p-3 pb-4">
        <p className="line-clamp-1 text-[13px] font-semibold text-content">{product.name}</p>
        <p className="line-clamp-2 h-8 text-[11px] leading-4 text-muted">{product.description}</p>
        {pricing.hasDiscount ? (
          <p className="flex items-baseline gap-1.5">
            <span className="text-[11px] text-muted line-through">{formatBRL(pricing.basePriceCents)}</span>
            <span className="text-[15px] font-bold text-primary">{formatBRL(pricing.finalPriceCents)}</span>
          </p>
        ) : (
          <p className="text-[15px] font-bold text-primary">{formatBRL(pricing.finalPriceCents)}</p>
        )}
      </div>
    </div>
  );
}
