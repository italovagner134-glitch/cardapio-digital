"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/use-cart";
import { useStoreRef } from "@/lib/store-context";
import { routes } from "@/lib/routes";
import { formatBRL } from "@/lib/format";

interface StickyCartBarProps {
  /** Calculado uma vez só em AppShell (useStickyCartBarVisible) — não
   * recalculado aqui dentro pra não abrir um 2º IntersectionObserver
   * observando o mesmo alvo que o de AppShell já observa. */
  visible: boolean;
  /** `restaurants.free_shipping_min`, em reais — mesma exceção de unidade
   * documentada em ShippingProgress/FreeShippingBanner. `null` = sem frete
   * grátis configurado, a barra fica só com o título. */
  freeShippingMin: number | null;
}

/**
 * Complemento obrigatório do CTA do painel de urgência (Parte 4 do
 * prompt): o CTA só existe no topo da home, e a pessoa passa a maior parte
 * do tempo rolando o cardápio ou dentro de um produto. Some sozinha quando
 * o CTA do painel está visível (useStickyCartBarVisible, em AppShell,
 * cuida disso via IntersectionObserver) pra nunca duplicar com ele.
 */
export function StickyCartBar({ visible, freeShippingMin }: StickyCartBarProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const cart = useCart();

  if (!visible) return null;

  const minCents = freeShippingMin != null ? Math.round(freeShippingMin * 100) : null;
  const shippingLabel =
    minCents == null
      ? null
      : cart.subtotalCents >= minCents
        ? "Frete grátis liberado"
        : `Faltam ${formatBRL(minCents - cart.subtotalCents)} pro frete grátis`;

  return (
    <button
      type="button"
      onClick={() => router.push(routes.cart(slug))}
      className="sticky-cart-bar-in fixed inset-x-0 z-30 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-2.5 text-left backdrop-blur-md"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-onprimary">
        {cart.count}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-content">Continuar meu pedido</span>
        {shippingLabel && <span className="block truncate text-[10px] text-muted">{shippingLabel}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold tabular-nums text-content">
        {formatBRL(cart.subtotalCents)}
        <ChevronRight size={16} aria-hidden="true" />
      </span>
    </button>
  );
}
