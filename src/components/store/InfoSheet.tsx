"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  X,
  MapPin,
  Navigation,
  MoreHorizontal,
  Copy,
  Clock,
  Bike,
  Wallet,
  Phone,
  AtSign,
  Banknote,
  CreditCard,
  QrCode,
} from "lucide-react";
import { StoreStatusCountdown } from "./StoreStatusCountdown";
import { formatDayHoursLabel, nowInRestaurantTimezone, WEEKDAYS_PT } from "@/lib/business-hours";
import {
  buildAppleMapsUrl,
  buildDirectionsUrl,
  buildWazeUrl,
  formatAddressLine1,
  formatAddressLine2,
  formatFullAddress,
  hasLocation,
} from "@/lib/maps";
import { buildWhatsAppContactUrl } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/format";
import { useOverlayBehavior } from "@/lib/use-overlay-behavior";
import type { BusinessHourRow, Store, StoreSettings } from "@/types/store";

const WEEKDAY_LABELS = WEEKDAYS_PT.map((d) => d.charAt(0).toUpperCase() + d.slice(1));

const PAYMENT_META: Record<string, { label: string; icon: typeof Banknote }> = {
  dinheiro: { label: "Dinheiro", icon: Banknote },
  pix: { label: "Pix", icon: QrCode },
  cartao_entrega: { label: "Cartão na entrega", icon: CreditCard },
};

interface InfoSheetProps {
  open: boolean;
  onClose: () => void;
  store: Store;
  settings: StoreSettings | null;
  businessHours: BusinessHourRow[];
  lastOrderAtISO: string | null;
  closingTimeLabel: string | null;
  nextOpeningLabel: string | null;
}

/**
 * Bottom sheet de informações da loja (Parte 4) — sobe até 92% da altura,
 * fecha por Esc/backdrop/botão voltar (useOverlayParam, em quem chama isto)
 * e devolve o foco pro botão que abriu (useOverlayBehavior). Sem portal, de
 * propósito — herda as CSS vars do tema aplicadas no root da página (mesmo
 * motivo documentado na StoreInfoSheet anterior, que este componente
 * substitui por completo).
 */
export function InfoSheet({
  open,
  onClose,
  store,
  settings,
  businessHours,
  lastOrderAtISO,
  closingTimeLabel,
  nextOpeningLabel,
}: InfoSheetProps) {
  const { panelRef } = useOverlayBehavior(open, onClose);
  const [directionsSheetOpen, setDirectionsSheetOpen] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  if (!open) return null;

  const { dayOfWeek: today } = nowInRestaurantTimezone();
  const showLocation = hasLocation(store);
  const paymentMethods = Array.isArray(settings?.payment_methods) ? (settings.payment_methods as string[]) : [];

  function handleHandleTouchStart(event: React.TouchEvent) {
    dragStartY.current = event.touches[0].clientY;
  }

  function handleHandleTouchMove(event: React.TouchEvent) {
    if (dragStartY.current === null) return;
    const delta = event.touches[0].clientY - dragStartY.current;
    setDragOffset(Math.max(0, delta));
  }

  function handleHandleTouchEnd() {
    if (dragOffset > 100) onClose();
    setDragOffset(0);
    dragStartY.current = null;
  }

  function handleCopyAddress() {
    navigator.clipboard
      .writeText(formatFullAddress(store))
      .then(() => toast.success("Endereço copiado"))
      .catch(() => toast.error("Não foi possível copiar o endereço"));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={`Informações de ${store.name}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-bg outline-none"
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: dragOffset === 0 ? "transform 200ms ease-out" : "none",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-surface2 text-content transition-transform duration-150 active:scale-90"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div
          className="flex justify-center pb-1 pt-3"
          onTouchStart={handleHandleTouchStart}
          onTouchMove={handleHandleTouchMove}
          onTouchEnd={handleHandleTouchEnd}
        >
          <span className="h-1.5 w-10 rounded-full bg-surface2" aria-hidden="true" />
        </div>

        <div className="overflow-y-auto pb-8">
          {/* 4.1 — Cabeçalho */}
          <div className="flex items-center gap-3 px-6 pb-4 pt-2">
            {store.logo_url ? (
              <Image
                src={store.logo_url}
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-muted">
                {store.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-content">{store.name}</h2>
              <StoreStatusCountdown
                lastOrderAtISO={lastOrderAtISO}
                closingTimeLabel={closingTimeLabel}
                nextOpeningLabel={nextOpeningLabel}
                closingSoonThresholdMin={store.closing_soon_threshold_min}
              />
            </div>
          </div>

          {/* 4.2 — Horário de funcionamento */}
          <section className="mx-4 mb-3 rounded-2xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={16} className="text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-content">Horário de funcionamento</h3>
            </div>
            <ul className="flex flex-col gap-0.5">
              {WEEKDAY_LABELS.map((label, day) => {
                const isToday = day === today;
                return (
                  <li
                    key={label}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5"
                    style={
                      isToday ? { backgroundColor: "color-mix(in srgb, var(--primary) 6%, transparent)" } : undefined
                    }
                  >
                    <span className={`flex items-center gap-2 text-sm ${isToday ? "font-semibold text-content" : "text-muted"}`}>
                      {label}
                      {isToday && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          HOJE
                        </span>
                      )}
                    </span>
                    <span className="text-sm tabular-nums text-muted">{formatDayHoursLabel(businessHours, day)}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 4.3 — Endereço e "Como chegar até nós" */}
          {showLocation && (
            <section className="mx-4 mb-3 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-content">Endereço</h3>
              </div>

              <p className="text-sm text-content">{formatAddressLine1(store)}</p>
              <p className="text-xs text-muted">{formatAddressLine2(store)}</p>
              {store.address_note && <p className="mt-1 text-xs italic text-muted">{store.address_note}</p>}

              {store.latitude != null && store.longitude != null && (
                <StaticMapPreview lat={store.latitude} lng={store.longitude} />
              )}

              <div className="mt-3 flex gap-2">
                <a
                  href={buildDirectionsUrl(store)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-onprimary transition-transform duration-150 active:scale-[0.98]"
                >
                  <Navigation size={18} aria-hidden="true" />
                  Como chegar até nós
                </a>
                <button
                  type="button"
                  onClick={() => setDirectionsSheetOpen(true)}
                  aria-label="Outros apps de mapa"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line text-content transition-transform duration-150 active:scale-90"
                >
                  <MoreHorizontal size={18} aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyAddress}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line text-sm font-medium text-content transition-transform duration-150 active:scale-[0.98]"
              >
                <Copy size={16} aria-hidden="true" />
                Copiar endereço
              </button>
            </section>
          )}

          {/* 4.4 — Entrega e retirada */}
          {settings && (settings.accepts_delivery || settings.accepts_pickup) && (
            <section className="mx-4 mb-3 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Bike size={16} className="text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-content">Entrega e retirada</h3>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm text-content">
                {settings.accepts_delivery && settings.delivery_time_min != null && settings.delivery_time_max != null && (
                  <li className="flex justify-between">
                    <span className="text-muted">Tempo estimado</span>
                    <span>
                      {settings.delivery_time_min}–{settings.delivery_time_max} min
                    </span>
                  </li>
                )}
                {settings.accepts_delivery && settings.min_order_cents > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted">Pedido mínimo</span>
                    <span>{formatBRL(settings.min_order_cents)}</span>
                  </li>
                )}
                {store.free_shipping_min != null && (
                  <li className="flex justify-between">
                    <span className="text-muted">Frete grátis a partir de</span>
                    <span>{formatBRL(Math.round(store.free_shipping_min * 100))}</span>
                  </li>
                )}
                {settings.accepts_pickup && <li className="text-muted">Retirada no local disponível</li>}
              </ul>
            </section>
          )}

          {/* 4.5 — Formas de pagamento */}
          {paymentMethods.length > 0 && (
            <section className="mx-4 mb-3 rounded-2xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet size={16} className="text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-content">Formas de pagamento</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => {
                  const meta = PAYMENT_META[method] ?? { label: method, icon: Wallet };
                  const Icon = meta.icon;
                  return (
                    <span
                      key={method}
                      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-content"
                    >
                      <Icon size={14} aria-hidden="true" />
                      {meta.label}
                    </span>
                  );
                })}
              </div>
              {paymentMethods.includes("dinheiro") && settings?.has_change && (
                <p className="mt-2 text-xs text-muted">Levamos troco</p>
              )}
            </section>
          )}

          {/* 4.6 — Contato e redes */}
          {(store.whatsapp || store.phone || settings?.instagram) && (
            <section className="mx-4 mb-3 rounded-2xl border border-line bg-surface p-4">
              <h3 className="mb-3 text-sm font-semibold text-content">Contato</h3>
              <div className="flex flex-wrap gap-2">
                {store.whatsapp && (
                  <a
                    href={buildWhatsAppContactUrl(store.whatsapp, "Olá! Vi o cardápio e queria tirar uma dúvida.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-content"
                  >
                    <Phone size={14} aria-hidden="true" />
                    WhatsApp
                  </a>
                )}
                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-content"
                  >
                    <Phone size={14} aria-hidden="true" />
                    Ligar
                  </a>
                )}
                {settings?.instagram && (
                  <a
                    href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-content"
                  >
                    <AtSign size={14} aria-hidden="true" />
                    Instagram
                  </a>
                )}
              </div>
            </section>
          )}

          {/* 4.7 — Rodapé */}
          {(store.cnpj || store.legal_name) && (
            <p className="mx-6 mt-2 text-[11px] text-muted">
              {store.legal_name}
              {store.legal_name && store.cnpj ? " · " : ""}
              {store.cnpj && `CNPJ ${store.cnpj}`}
            </p>
          )}
        </div>
      </div>

      {directionsSheetOpen && (
        <DirectionsSheet store={store} onClose={() => setDirectionsSheetOpen(false)} />
      )}
    </div>
  );
}

function StaticMapPreview({ lat, lng }: { lat: number; lng: number }) {
  const apiKey = process.env.NEXT_PUBLIC_STATIC_MAPS_KEY;

  if (apiKey) {
    const src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=480x240&scale=2&markers=color:0xFF7A00%7C${lat},${lng}&key=${apiKey}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- imagem externa dinâmica (Static Maps), fora do domínio configurado no next/image
      <img src={src} alt="Mapa com a localização da loja" className="mt-3 h-[120px] w-full rounded-xl object-cover" />
    );
  }

  return (
    <div className="mt-3 flex h-[120px] w-full items-center justify-center rounded-xl bg-surface2">
      <MapPin size={28} className="text-primary" aria-hidden="true" />
    </div>
  );
}

/** Mini-sheet com as alternativas de app de mapa (Parte 4.3: toque
 * prolongado / ícone de opções ao lado do botão principal). */
function DirectionsSheet({ store, onClose }: { store: Store; onClose: () => void }) {
  const { panelRef } = useOverlayBehavior(true, onClose);
  const isApple = typeof navigator !== "undefined" && /iPhone|iPad|Mac/.test(navigator.platform);
  const waze = buildWazeUrl(store);
  const apple = isApple ? buildAppleMapsUrl(store) : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Escolher app de mapa"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-[480px] rounded-t-3xl bg-bg p-4 pb-8 outline-none"
      >
        <div className="mb-2 flex justify-center">
          <span className="h-1.5 w-10 rounded-full bg-surface2" aria-hidden="true" />
        </div>
        <p className="mb-3 px-2 text-sm font-semibold text-content">Abrir rota em</p>
        <div className="flex flex-col gap-1">
          <a
            href={buildDirectionsUrl(store)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="rounded-xl px-3 py-3 text-sm font-medium text-content active:bg-surface2"
          >
            Google Maps
          </a>
          {waze && (
            <a
              href={waze}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="rounded-xl px-3 py-3 text-sm font-medium text-content active:bg-surface2"
            >
              Waze
            </a>
          )}
          {apple && (
            <a
              href={apple}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="rounded-xl px-3 py-3 text-sm font-medium text-content active:bg-surface2"
            >
              Apple Maps
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
