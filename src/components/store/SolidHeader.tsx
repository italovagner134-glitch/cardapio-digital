"use client";

import Link from "next/link";
import { ArrowLeft, Menu, ShoppingBag } from "lucide-react";
import { useStoreOverlays, useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";
import { routes } from "@/lib/routes";

interface SolidHeaderProps {
  title: string;
  /** Sem onBack, mostra o hambúrguer (abre o menu) — é o caso das telas de
   * nível superior (busca, carrinho, pedidos, perfil, promoções). Com
   * onBack, mostra seta de voltar — telas que vieram de outra (categoria,
   * produto). */
  onBack?: () => void;
}

/** Header sólido, sticky (não flutuante sobre mídia) — usado por toda rota
 * que não é a home (Parte 2.2: "Header sólido com botão voltar, nome da
 * categoria e carrinho"). A home usa StoreHeader, que fica sobre a capa. */
export function SolidHeader({ title, onBack }: SolidHeaderProps) {
  const { slug } = useStoreRef();
  const { openMenu } = useStoreOverlays();
  const cart = useCart();

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-bg px-2"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <button
        type="button"
        onClick={onBack ?? openMenu}
        aria-label={onBack ? "Voltar" : "Abrir menu"}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-content transition-transform duration-150 active:scale-90"
      >
        {onBack ? <ArrowLeft size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      <h1 className="min-w-0 flex-1 truncate text-base font-bold text-content">{title}</h1>

      <Link
        href={routes.cart(slug)}
        aria-label="Ver carrinho"
        className="relative flex size-10 shrink-0 items-center justify-center rounded-full text-content transition-transform duration-150 active:scale-90"
      >
        <ShoppingBag size={20} aria-hidden="true" />
        {cart.count > 0 && (
          <span className="badge-pop absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-onprimary">
            {cart.count}
          </span>
        )}
      </Link>
    </header>
  );
}
