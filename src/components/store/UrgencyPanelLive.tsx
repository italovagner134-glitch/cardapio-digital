"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { UrgencyClock } from "./UrgencyClock";
import { ShippingProgress } from "./ShippingProgress";
import { useCart } from "@/lib/cart/use-cart";
import { useStoreRef } from "@/lib/store-context";
import { useTicker } from "@/lib/ticker-context";
import { routes } from "@/lib/routes";
import { formatBRL } from "@/lib/format";
import { URGENCY_CTA_ID } from "@/lib/use-sticky-cart-bar-visible";
import { formatHM, isFinalStretch, isLastMinute, remainingMinutes, type UrgencyBucket, type UrgencyState } from "@/lib/urgency";

interface UrgencyPanelLiveProps {
  state: UrgencyState;
  bucket: Extract<UrgencyBucket, "open-far" | "within-threshold">;
  /** "Entrega em 45–55 min" — não depende do relógio, calculado no servidor
   * (UrgencyPanel.tsx) a partir do prep+entrega configurados. */
  deliveryWindowLabel: string;
}

/**
 * A parte do painel que depende de dois pedaços de estado que o servidor
 * não tem: o relógio vivo (Parte 3) e o carrinho (localStorage, Parte 1
 * deste componente — nenhum Server Component sabe se há item no carrinho).
 * `UrgencyPanel.tsx` (server) já decidiu o "bucket" — aqui só falta somar
 * "tem carrinho ou não" pra chegar na variante final (1 a 4 da tabela).
 */
export function UrgencyPanelLive({ state, bucket, deliveryWindowLabel }: UrgencyPanelLiveProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const cart = useCart();
  const nowMs = useTicker();

  const hasCart = cart.count > 0;

  // Variante 1: aberta, longe de fechar, sem carrinho — nada pra dizer.
  if (bucket === "open-far" && !hasCart) return null;

  const lastOrderAtMs = state.lastOrderAtISO ? new Date(state.lastOrderAtISO).getTime() : null;
  const windowStartMs = state.windowStartISO ? new Date(state.windowStartISO).getTime() : null;
  const windowMs = lastOrderAtMs != null && windowStartMs != null ? Math.max(1, lastOrderAtMs - windowStartMs) : null;

  // + clockOffsetMs: alinha o relógio (sempre real) com a linha do tempo
  // que gerou `state` — em produção o offset é ~0; só importa em dev, com
  // `?_now=` simulando um horário diferente do relógio de verdade (ver
  // UrgencyState.clockOffsetMs).
  //
  // Mesmo sentinela e mesmo fallback do UrgencyClock (nowMs === 0 = ainda
  // não sincronizou): usa o início da janela como valor estável, idêntico
  // no servidor e na 1ª pintura do cliente, pra não arriscar um mismatch
  // de hidratação por causa de um Date.now() divergente.
  const remainingMs =
    bucket === "within-threshold" && lastOrderAtMs != null
      ? nowMs === 0
        ? (windowMs ?? 0)
        : Math.max(0, lastOrderAtMs - (nowMs + state.clockOffsetMs))
      : null;

  const etaLabel = state.etaAtISO ? formatHM(state.etaAtISO) : null;

  let strong: string;
  let weak: string;

  if (bucket === "within-threshold" && remainingMs != null) {
    const lastMinute = isLastMinute(remainingMs);
    const finalStretch = isFinalStretch(remainingMs);
    const minutes = remainingMinutes(remainingMs);

    strong = lastMinute ? "Encerrando os pedidos" : `Últimos pedidos em ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
    weak = lastMinute
      ? `${Math.max(1, Math.ceil(remainingMs / 1000))} segundos para finalizar`
      : finalStretch
        ? `Ainda dá tempo — recebe até ${etaLabel}`
        : `Peça agora e recebe até ${etaLabel}`;
  } else {
    strong = etaLabel ? `Seu pedido chega até ${etaLabel}` : "";
    weak = deliveryWindowLabel;
  }

  return (
    <div
      className="mx-4 mt-3 rounded-2xl border border-line bg-surface p-3"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,.25)" }}
    >
      <div className="flex items-center gap-3">
        {bucket === "within-threshold" && state.lastOrderAtISO && state.windowStartISO && (
          <UrgencyClock
            lastOrderAtISO={state.lastOrderAtISO}
            windowStartISO={state.windowStartISO}
            clockOffsetMs={state.clockOffsetMs}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-content">{strong}</p>
          <p className="text-[11px] text-muted">{weak}</p>
        </div>
      </div>

      {hasCart && (
        <>
          <div className="my-3 h-px bg-line" />

          <ShippingProgress freeShippingMin={state.freeShippingMin} subtotalCents={cart.subtotalCents} />

          <button
            type="button"
            id={URGENCY_CTA_ID}
            onClick={() => router.push(routes.cart(slug))}
            className="mt-3 flex h-11 w-full items-center justify-between rounded-full bg-primary px-4 text-onprimary transition-transform duration-150 active:scale-[.98]"
            style={{ boxShadow: "0 6px 18px color-mix(in srgb, var(--primary) 30%, transparent)" }}
          >
            <span className="text-[13px] font-bold">Continuar meu pedido</span>
            <span className="flex items-center gap-1 text-[13px] font-bold tabular-nums">
              {formatBRL(cart.subtotalCents)}
              <ChevronRight size={16} aria-hidden="true" />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
