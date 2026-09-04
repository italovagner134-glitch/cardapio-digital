"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Search,
  UtensilsCrossed,
  Tag,
  ClipboardList,
  ShoppingCart,
  Info,
  Wallet,
  Phone,
} from "lucide-react";
import { StoreStatusCountdown } from "./StoreStatusCountdown";
import { CATEGORY_ICONS, UtensilsIcon, type CategoryIconKey } from "./icons";
import { routes } from "@/lib/routes";
import { useOverlayBehavior } from "@/lib/use-overlay-behavior";
import { useCart } from "@/lib/cart/use-cart";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import type { Category, Store } from "@/types/store";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  store: Store;
  categories: Category[];
  lastOrderAtISO: string | null;
  closingTimeLabel: string | null;
  nextOpeningLabel: string | null;
  onOpenInfo: () => void;
}

/** Drawer lateral (Parte 5) — entra pela esquerda, 82% da largura, fecha por
 * swipe/backdrop/Esc/botão voltar (useOverlayParam em quem chama). */
export function MenuDrawer({
  open,
  onClose,
  store,
  categories,
  lastOrderAtISO,
  closingTimeLabel,
  nextOpeningLabel,
  onOpenInfo,
}: MenuDrawerProps) {
  const router = useRouter();
  const cart = useCart();
  const { panelRef } = useOverlayBehavior(open, onClose);
  const dragStartX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  if (!open) return null;

  function go(href: string) {
    onClose();
    router.push(href);
  }

  function handleTouchStart(event: React.TouchEvent) {
    dragStartX.current = event.touches[0].clientX;
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (dragStartX.current === null) return;
    const delta = event.touches[0].clientX - dragStartX.current;
    setDragOffset(Math.min(0, delta));
  }

  function handleTouchEnd() {
    if (dragOffset < -80) onClose();
    setDragOffset(0);
    dragStartX.current = null;
  }

  const navItems = [
    { label: "Cardápio", icon: UtensilsCrossed, onClick: () => go(routes.home(store.slug)) },
    { label: "Promoções", icon: Tag, onClick: () => go(routes.promotions(store.slug)) },
    { label: "Meus pedidos", icon: ClipboardList, onClick: () => go(routes.orders(store.slug)) },
    {
      label: "Carrinho",
      icon: ShoppingCart,
      badge: cart.count > 0 ? cart.count : undefined,
      onClick: () => go(routes.cart(store.slug)),
    },
    { label: "Informações da loja", icon: Info, onClick: () => { onClose(); onOpenInfo(); } },
    { label: "Formas de pagamento", icon: Wallet, onClick: () => { onClose(); onOpenInfo(); } },
  ];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Menu de ${store.name}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="absolute inset-y-0 left-0 flex w-[82%] max-w-[340px] flex-col overflow-y-auto bg-bg outline-none"
        style={{
          transform: `translateX(${dragOffset}px)`,
          transition: dragOffset === 0 ? "transform 200ms ease-out" : "none",
        }}
      >
        <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {store.logo_url ? (
              <Image src={store.logo_url} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-muted">
                {store.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-content">{store.name}</p>
              <StoreStatusCountdown
                lastOrderAtISO={lastOrderAtISO}
                closingTimeLabel={closingTimeLabel}
                nextOpeningLabel={nextOpeningLabel}
                closingSoonThresholdMin={store.closing_soon_threshold_min}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-content transition-transform duration-150 active:scale-90"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => go(routes.search(store.slug))}
          className="mx-5 mb-4 flex h-11 items-center gap-2 rounded-2xl border border-line px-4 text-sm text-muted"
        >
          <Search size={16} aria-hidden="true" />
          Buscar no cardápio
        </button>

        <nav className="flex flex-col px-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-content active:bg-surface2"
            >
              <item.icon size={18} className="text-muted" aria-hidden="true" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-onprimary">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          {store.whatsapp && (
            <a
              href={buildWhatsAppContactUrl(store.whatsapp, "Olá! Vi o cardápio e queria tirar uma dúvida.")}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-content active:bg-surface2"
            >
              <Phone size={18} className="text-muted" aria-hidden="true" />
              Fale no WhatsApp
            </a>
          )}
        </nav>

        {categories.length > 0 && (
          <div className="mt-2 border-t border-line px-5 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Categorias</p>
            <div className="flex flex-col">
              {categories.map((category) => {
                const Icon = CATEGORY_ICONS[category.icon_key as CategoryIconKey] ?? UtensilsIcon;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => go(routes.category(store.slug, category.slug))}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-content active:bg-surface2"
                  >
                    <Icon size={16} className="text-muted" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p className="mt-auto px-5 pb-6 pt-4 text-[11px] text-muted">Cardápio digital por Cardápio Digital</p>
      </div>
    </div>
  );
}
