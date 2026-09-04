"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTicker } from "@/lib/ticker-context";
import { formatRemainingCompact, isFinalStretch, isLastMinute } from "@/lib/urgency";

const RADIUS = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // 138.23
const AMBER = "#F59E0B";

interface UrgencyClockProps {
  lastOrderAtISO: string;
  windowStartISO: string;
  /** `UrgencyState.clockOffsetMs` — ~0 em produção, só relevante em dev
   * com `?_now=` simulando um horário diferente do relógio de verdade. */
  clockOffsetMs: number;
}

/**
 * O anel de 52×52 + o número no centro (Parte 2.2/3 do prompt de urgência).
 * Só existe dentro da janela "dentro do limiar" — quem decide SE ele
 * aparece é o pai (UrgencyPanelLive); aqui dentro é só "quanto falta e como
 * desenhar isso".
 *
 * Lê o "agora" do relógio único da aplicação (TickerProvider) — não abre
 * o próprio setInterval (critério de aceite: um relógio só pro app
 * inteiro). Cuida sozinho de dois efeitos colaterais que são
 * especificamente dele: revalidar a página quando o tempo zera (a loja
 * "fecha sozinha") e anunciar a virada de fase pra leitor de tela.
 */
export function UrgencyClock({ lastOrderAtISO, windowStartISO, clockOffsetMs }: UrgencyClockProps) {
  const router = useRouter();
  const nowMs = useTicker();

  const lastOrderAt = new Date(lastOrderAtISO).getTime();
  const windowStart = new Date(windowStartISO).getTime();
  const windowMs = Math.max(1, lastOrderAt - windowStart);

  // `nowMs === 0` é o sentinela de "ainda não sincronizou" (ver
  // ticker-context.tsx) — trata como "acabou de entrar na janela" (anel
  // cheio) em vez de um número inflado por um instante. `+ clockOffsetMs`
  // alinha o relógio real com a linha do tempo simulada em dev (ver
  // UrgencyState.clockOffsetMs) — ~0 em produção.
  const remainingMs = nowMs === 0 ? windowMs : Math.max(0, lastOrderAt - (nowMs + clockOffsetMs));
  const fraction = Math.min(1, Math.max(0, remainingMs / windowMs));
  const dashoffset = CIRCUMFERENCE * (1 - fraction);

  const finalStretch = isFinalStretch(remainingMs);
  const lastMinute = isLastMinute(remainingMs);
  const accent = finalStretch ? "var(--primary)" : AMBER;

  // Chegou a zero: sem reload — só pede pro Next revalidar os dados da
  // página (o servidor recalcula isOpen/orderingDisabled de novo, os
  // botões de adicionar desabilitam sozinhos). Mesmo padrão do
  // StoreStatusCountdown, guardado por ref pra disparar uma vez só.
  const refreshedRef = useRef(false);
  useEffect(() => {
    if (nowMs !== 0 && remainingMs <= 0 && !refreshedRef.current) {
      refreshedRef.current = true;
      router.refresh();
    }
  }, [remainingMs, nowMs, router]);

  // Anuncia só a virada de fase pro leitor de tela — como isto é texto
  // ESTÁVEL enquanto a fase não muda (não um efeito de "disparar uma vez"),
  // o aria-live não repete o anúncio a cada re-render por segundo, só
  // quando o conteúdo do span realmente muda.
  const announcement = lastMinute
    ? "Menos de um minuto para o encerramento dos pedidos."
    : finalStretch
      ? "A loja encerra os pedidos em 15 minutos."
      : "";

  return (
    <div className="relative flex size-[52px] shrink-0 items-center justify-center">
      <svg
        width={52}
        height={52}
        viewBox="0 0 52 52"
        aria-hidden="true"
        className={finalStretch ? "urgency-ring-pulse" : undefined}
      >
        <circle r={RADIUS} cx={26} cy={26} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle
          r={RADIUS}
          cx={26}
          cy={26}
          fill="none"
          stroke={accent}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 26 26)"
          className="urgency-ring-progress"
        />
      </svg>
      <time dateTime={lastOrderAtISO} aria-live="off" className="absolute text-[11px] font-bold tabular-nums text-content">
        {formatRemainingCompact(remainingMs)}
      </time>
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
