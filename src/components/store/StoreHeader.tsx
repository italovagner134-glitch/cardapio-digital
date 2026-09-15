"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";
import { LogoPlaceholder } from "./LogoPlaceholder";
import { useHeaderProgress } from "@/lib/use-header-progress";
import { useStoreOverlays, useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";
import { routes } from "@/lib/routes";

interface StoreHeaderProps {
  storeName: string;
  logoUrl: string | null;
}

// Cor do ícone: começa em --on-media (branco fixo, legível sobre foto/vídeo)
// e migra pra --text conforme --header-p vai de 0 a 1.
const mediaToTextColor: CSSProperties = {
  color:
    "color-mix(in srgb, var(--text) calc(var(--header-p, 0) * 100%), var(--on-media))",
};

// "Glass chip" atrás de cada botão só-ícone: começa translúcido sobre a
// mídia e desaparece conforme o header vira sólido.
const glassChipStyle: CSSProperties = {
  backgroundColor:
    "color-mix(in srgb, black calc((1 - var(--header-p, 0)) * 25%), transparent)",
  borderColor:
    "color-mix(in srgb, white calc((1 - var(--header-p, 0)) * 10%), transparent)",
};

export function StoreHeader({ storeName, logoUrl }: StoreHeaderProps) {
  const headerRef = useHeaderProgress(96);
  const router = useRouter();
  const pathname = usePathname();
  const { slug } = useStoreRef();
  const { openMenu } = useStoreOverlays();
  const cart = useCart();
  const [logoBroken, setLogoBroken] = useState(false);

  function handleLogoClick() {
    // Na home, a logo rola pro topo (Parte 7); em qualquer outra tela,
    // volta pra home — em nenhum caso ela fica "sem ação".
    if (pathname === routes.home(slug)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(routes.home(slug));
    }
  }

  return (
    <header
      ref={headerRef as React.RefObject<HTMLElement>}
      className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-4"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Camada de fundo — transparente no topo, ganha --bg/blur/borda
          progressivamente conforme --header-p vai de 0 a 1 (ver
          useHeaderProgress). Nada disso re-renderiza React por pixel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b"
        style={{
          backgroundColor: "var(--bg)",
          opacity: "calc(var(--header-p, 0) * 0.92)",
          backdropFilter: "blur(calc(var(--header-p, 0) * 12px))",
          WebkitBackdropFilter: "blur(calc(var(--header-p, 0) * 12px))",
          borderColor:
            "color-mix(in srgb, var(--border) calc(var(--header-p, 0) * 100%), transparent)",
        }}
      />

      <button
        type="button"
        onClick={openMenu}
        aria-label="Abrir menu"
        className="relative flex size-11 items-center justify-center transition-transform duration-150 active:scale-95"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 m-auto size-10 rounded-full border backdrop-blur-[2px]"
          style={glassChipStyle}
        />
        <Menu
          size={22}
          className="relative drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          style={mediaToTextColor}
        />
      </button>

      <button
        type="button"
        onClick={handleLogoClick}
        aria-label={`Ir para o início de ${storeName}`}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {logoUrl && !logoBroken ? (
          <Image
            src={logoUrl}
            alt={storeName}
            width={120}
            height={40}
            priority
            className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            onError={() => setLogoBroken(true)}
          />
        ) : (
          <LogoPlaceholder
            className="h-10 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
            style={mediaToTextColor}
          />
        )}
      </button>

      <Link
        href={routes.cart(slug)}
        aria-label="Ver carrinho"
        className="relative flex size-11 items-center justify-center transition-transform duration-150 active:scale-95"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 m-auto size-10 rounded-full border backdrop-blur-[2px]"
          style={glassChipStyle}
        />
        <ShoppingBag
          size={22}
          className="relative drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
          style={mediaToTextColor}
        />
        {cart.count > 0 && (
          <span className="badge-pop absolute -right-0.5 -top-0.5 z-10 flex size-[18px] items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-onprimary">
            {cart.count}
          </span>
        )}
      </Link>
    </header>
  );
}
