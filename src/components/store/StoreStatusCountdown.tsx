"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTicker } from "@/lib/ticker-context";

const LAST_ORDERS_TIER_MIN = 15;
const AMBER = "#F59E0B";

interface StoreStatusCountdownProps {
  /** Instante real (ISO) em que a cozinha para de aceitar pedido — calculado
   * no servidor (getLastOrderInstant), nunca no fuso de quem está olhando.
   * `null` = loja fechada agora. */
  lastOrderAtISO: string | null;
  closingTimeLabel: string | null;
  nextOpeningLabel: string | null;
  closingSoonThresholdMin: number;
  /** `UrgencyState.clockOffsetMs` — ~0 em produção, só relevante em dev
   * com `?_now=` simulando um horário diferente do relógio de verdade
   * (`lastOrderAtISO` reflete o simulado; o relógio ao vivo é sempre
   * real). Default 0 pra quem ainda não passa isso. */
  clockOffsetMs?: number;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 3600) {
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

type Tier = "closed" | "normal" | "closing-soon" | "last-orders";

function getTier(remainingMs: number | null, thresholdMin: number): Tier {
  if (remainingMs === null || remainingMs <= 0) return "closed";
  if (remainingMs <= LAST_ORDERS_TIER_MIN * 60_000) return "last-orders";
  if (remainingMs <= thresholdMin * 60_000) return "closing-soon";
  return "normal";
}

export function StoreStatusCountdown({
  lastOrderAtISO,
  closingTimeLabel,
  nextOpeningLabel,
  closingSoonThresholdMin,
  clockOffsetMs = 0,
}: StoreStatusCountdownProps) {
  const router = useRouter();
  const lastOrderAt = lastOrderAtISO ? new Date(lastOrderAtISO).getTime() : null;

  // Lê do relógio único da aplicação (TickerProvider, em AppShell) em vez de
  // abrir o próprio setInterval — um relógio só, não um por componente
  // (critério de aceite do painel de urgência).
  const nowMs = useTicker();
  const remainingMs = lastOrderAt ? lastOrderAt - (nowMs + clockOffsetMs) : null;

  const tier = getTier(remainingMs, closingSoonThresholdMin);

  // Chegou a zero: sem reload — só pede pro Next revalidar os dados da
  // página (horário mudou, o servidor recalcula tudo de novo).
  const refreshedRef = useRef(false);
  useEffect(() => {
    if (tier === "closed" && lastOrderAt && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
    }
    if (tier !== "closed") refreshedRef.current = false;
  }, [tier, lastOrderAt, router]);

  const announcement =
    tier === "closing-soon"
      ? `A loja fecha em ${closingSoonThresholdMin} minutos.`
      : tier === "last-orders"
        ? "Últimos pedidos — a loja está fechando."
        : tier === "closed"
          ? "A loja está fechada agora."
          : "";

  if (tier === "closed") {
    return (
      <StatusLines
        dotColor="var(--muted)"
        pulse={false}
        line1="Fechado agora"
        line2={nextOpeningLabel}
        color="var(--muted)"
        announcement={announcement}
      />
    );
  }

  if (tier === "normal") {
    return (
      <StatusLines
        dotColor="var(--success)"
        pulse={false}
        line1="Aberto agora"
        line2={closingTimeLabel ? `Fecha às ${closingTimeLabel}` : null}
        color="var(--success)"
        announcement={announcement}
      />
    );
  }

  const label = formatRemaining(remainingMs ?? 0);

  if (tier === "last-orders") {
    return (
      <div
        className="inline-flex flex-col gap-0.5 rounded-lg px-2 py-1"
        style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
      >
        <StatusLines
          dotColor="var(--primary)"
          pulse
          line1="Últimos pedidos"
          line2={
            <time dateTime={lastOrderAtISO ?? undefined} aria-live="off">
              Encerra em <span className="tabular-nums">{label}</span>
            </time>
          }
          color="var(--primary)"
          announcement={announcement}
        />
      </div>
    );
  }

  // closing-soon (âmbar)
  return (
    <StatusLines
      dotColor="var(--success)"
      pulse={false}
      line1="Aberto agora"
      line2={
        <time dateTime={lastOrderAtISO ?? undefined} aria-live="off">
          Fechando em <span className="tabular-nums">{label}</span>
        </time>
      }
      color={AMBER}
      announcement={announcement}
    />
  );
}

interface StatusLinesProps {
  dotColor: string;
  pulse: boolean;
  line1: string;
  line2: React.ReactNode;
  color: string;
  announcement: string;
}

function StatusLines({ dotColor, pulse, line1, line2, color, announcement }: StatusLinesProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-2 text-sm font-semibold">
        <span className="relative flex size-2">
          {pulse && (
            <span
              className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
              style={{ backgroundColor: dotColor }}
            />
          )}
          <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: dotColor }} />
        </span>
        <span style={{ color }}>{line1}</span>
      </span>
      {line2 && (
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {line2}
        </span>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
