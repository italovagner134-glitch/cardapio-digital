"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface StoreRef {
  /** id do restaurante — chave das "gavetas" do localStorage (carrinho,
   * pedidos, perfil), nunca exposto na URL. */
  restaurantId: string;
  /** slug da loja — o segmento `[slug]` da URL, usado por lib/routes.ts. */
  slug: string;
}

/**
 * O par (id, slug) da loja atual — o suficiente pra useCart()/useOrders()/
 * useProfile() saberem qual "gaveta" usar e pros componentes montarem link
 * via lib/routes.ts, sem receber os dois como prop em toda folha da árvore
 * (header, bottom nav, drawer, cards...). Provido uma vez em [slug]/layout.tsx.
 */
const StoreRefContext = createContext<StoreRef | null>(null);

export function StoreRefProvider({ value, children }: { value: StoreRef; children: ReactNode }) {
  return <StoreRefContext.Provider value={value}>{children}</StoreRefContext.Provider>;
}

export function useStoreRef(): StoreRef {
  const ref = useContext(StoreRefContext);
  if (!ref) {
    throw new Error("useStoreRef() precisa estar dentro de <StoreRefProvider> (ver [slug]/layout.tsx).");
  }
  return ref;
}

export function useRestaurantId(): string {
  return useStoreRef().restaurantId;
}

export interface StoreOverlays {
  openMenu: () => void;
  openInfo: () => void;
}

/** Pra qualquer descendente (FreeShippingBanner, StoreStatusBar...) abrir o
 * InfoSheet/MenuDrawer sem receber a função como prop through StoreHome —
 * o estado dos dois overlays mora no AppShell (client, [slug]/layout.tsx),
 * bem acima da árvore de cada página. */
const StoreOverlaysContext = createContext<StoreOverlays | null>(null);

export function StoreOverlaysProvider({ value, children }: { value: StoreOverlays; children: ReactNode }) {
  return <StoreOverlaysContext.Provider value={value}>{children}</StoreOverlaysContext.Provider>;
}

export function useStoreOverlays(): StoreOverlays {
  const overlays = useContext(StoreOverlaysContext);
  if (!overlays) {
    throw new Error("useStoreOverlays() precisa estar dentro de <StoreOverlaysProvider> (ver [slug]/AppShell.tsx).");
  }
  return overlays;
}
