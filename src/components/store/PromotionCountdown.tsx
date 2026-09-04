"use client";

import { saoPauloTimeToday } from "@/lib/business-hours";
import { useTicker } from "@/lib/ticker-context";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** "Termina em 02:41:15" — a promoção acaba hoje às `dailyEnd`, no fuso da
 * loja. Lê do relógio único da aplicação (TickerProvider) em vez de abrir o
 * próprio timer — isso também elimina o mismatch de hidratação que existia
 * aqui (Date.now() chamado de novo no cliente quase sempre cai num segundo
 * diferente do usado no SSR; o ticker usa um sentinela fixo no servidor).
 * Não renderiza nada depois de acabar (o componente pai já para de
 * considerar a promoção viva no próximo refresh de dados do servidor). */
export function PromotionCountdown({ dailyEnd }: { dailyEnd: string }) {
  const targetMs = saoPauloTimeToday(dailyEnd).getTime();
  const nowMs = useTicker();
  // `nowMs === 0` é o sentinela de "ainda não sincronizou" (ver
  // ticker-context.tsx) — sem essa checagem, a subtração daria uma duração
  // de décadas por uma fração de segundo, antes do 1º tick real chegar.
  if (nowMs === 0) return null;
  const remainingMs = targetMs - nowMs;

  if (remainingMs <= 0) return null;

  return (
    <p className="text-[11px] font-medium text-muted">
      Termina em <span className="tabular-nums">{formatRemaining(remainingMs)}</span>
    </p>
  );
}
