"use client";

import { Suspense } from "react";
import { BottomNav } from "./BottomNav";
import { MenuDrawer } from "./MenuDrawer";
import { InfoSheet } from "./InfoSheet";
import { StickyCartBar } from "./StickyCartBar";
import { useOverlayParam } from "@/lib/use-overlay-param";
import { StoreOverlaysProvider } from "@/lib/store-context";
import { TickerProvider } from "@/lib/ticker-context";
import { useStickyCartBarVisible } from "@/lib/use-sticky-cart-bar-visible";
import type { Store, StoreSettings, BusinessHourRow, Category } from "@/types/store";

interface AppShellProps {
  store: Store;
  settings: StoreSettings | null;
  businessHours: BusinessHourRow[];
  categories: Category[];
  lastOrderAtISO: string | null;
  closingTimeLabel: string | null;
  nextOpeningLabel: string | null;
  children: React.ReactNode;
}

/**
 * Chrome compartilhado por toda rota `/[slug]/*`: bottom nav e os dois
 * overlays (menu/info) sincronizados com a URL — ver lib/use-overlay-param.ts
 * (Parte 1: botão voltar do Android fecha o overlay, não sai da loja). O
 * header NÃO mora aqui: a home usa StoreHeader (flutuante sobre a mídia,
 * Parte A1 da entrega anterior) e as demais rotas usam SolidHeader
 * (sólido, com voltar) — cada página escolhe o seu, ambos lendo
 * useStoreOverlays()/useCart() daqui de dentro.
 *
 * `useSearchParams()` (dentro de useOverlayParam) pede um Suspense boundary
 * mesmo em rota já dinâmica, senão o Next avisa em build — como a rota é
 * sempre dinâmica na prática (cookies do Supabase), o fallback não chega a
 * aparecer; fica só null por segurança (os filhos dependem do
 * StoreOverlaysProvider, que só existe depois de suspender).
 */
export function AppShell(props: AppShellProps) {
  return (
    <Suspense fallback={null}>
      <AppShellInner {...props} />
    </Suspense>
  );
}

function AppShellInner({
  store,
  settings,
  businessHours,
  categories,
  lastOrderAtISO,
  closingTimeLabel,
  nextOpeningLabel,
  children,
}: AppShellProps) {
  const menu = useOverlayParam("menu");
  const info = useOverlayParam("info");
  const cartBarVisible = useStickyCartBarVisible();

  return (
    <TickerProvider>
      <StoreOverlaysProvider value={{ openMenu: menu.open, openInfo: info.open }}>
        {/* Espaço extra só quando a barra fixa do carrinho está na tela —
            senão ela cobre o último item do cardápio (Parte 4 do prompt de
            urgência). `pb-24` do wrapper em [slug]/layout.tsx já reserva
            espaço pra bottom nav; isto soma o tanto que falta pra barra. */}
        <div style={{ paddingBottom: cartBarVisible ? "68px" : 0 }}>{children}</div>

        <StickyCartBar visible={cartBarVisible} freeShippingMin={store.free_shipping_min} />
        <BottomNav />

        <MenuDrawer
          open={menu.isOpen}
          onClose={menu.close}
          store={store}
          categories={categories}
          lastOrderAtISO={lastOrderAtISO}
          closingTimeLabel={closingTimeLabel}
          nextOpeningLabel={nextOpeningLabel}
          onOpenInfo={info.open}
        />

        <InfoSheet
          open={info.isOpen}
          onClose={info.close}
          store={store}
          settings={settings}
          businessHours={businessHours}
          lastOrderAtISO={lastOrderAtISO}
          closingTimeLabel={closingTimeLabel}
          nextOpeningLabel={nextOpeningLabel}
        />
      </StoreOverlaysProvider>
    </TickerProvider>
  );
}
