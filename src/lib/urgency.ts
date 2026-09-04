import { getLastOrderInstant, getNextOpenInstant, isOpenNow } from "./business-hours";
import type { BusinessHourRow } from "./business-hours";

const FIVE_MIN_MS = 5 * 60_000;

/** Config do painel de urgência — um subconjunto de `restaurants`, isolado
 * pra `buildUrgencyState` não depender do tipo inteiro da tabela (mesmo
 * espírito de `StoreTheme` em lib/theme.ts). */
export interface UrgencyStoreConfig {
  prepTimeMin: number;
  deliveryTimeMin: number;
  lastOrderOffsetMin: number;
  closingSoonThresholdMin: number;
  freeShippingMin: number | null;
  urgencyPanelEnabled: boolean;
}

export interface UrgencyState {
  isOpen: boolean;
  /** Instante em que a cozinha para de aceitar pedido hoje/no turno em
   * andamento. `null` = loja fechada agora. */
  lastOrderAtISO: string | null;
  /** Início da janela de "últimos pedidos" — `lastOrderAt` menos
   * `closingSoonThresholdMin`. Base do anel: ele esvazia entre este
   * instante e `lastOrderAtISO`. */
  windowStartISO: string | null;
  /** Promessa de horário de entrega se o pedido for feito agora — arredondada
   * pra cima pro múltiplo de 5 min. `null` quando fechada. */
  etaAtISO: string | null;
  /** Instante da próxima abertura — só preenchido quando fechada. */
  nextOpenAtISO: string | null;
  freeShippingMin: number | null;
  /**
   * `at.getTime() - Date.now()` no momento em que este estado foi montado.
   * Em produção é ~0 (as duas chamadas acontecem a poucos milissegundos de
   * distância) — só fica diferente de zero quando `at` veio de `?_now=`
   * (simulação, só em desenvolvimento). Os componentes que ticam ao vivo
   * (UrgencyClock, StoreStatusCountdown) somam isto no valor do relógio
   * compartilhado antes de calcular "quanto falta": sem isso, o relógio do
   * cliente (sempre real) e os instantes simulados do servidor ficariam em
   * linhas do tempo diferentes, e "faltam X min" viraria um número absurdo
   * (dias de diferença) assim que a página terminasse de carregar.
   */
  clockOffsetMs: number;
}

function roundUpToFiveMinutes(date: Date): Date {
  return new Date(Math.ceil(date.getTime() / FIVE_MIN_MS) * FIVE_MIN_MS);
}

/**
 * Roda no servidor, sempre no timezone da loja (America/Sao_Paulo) — nunca
 * no relógio do navegador de quem está olhando (Parte 1.2 do prompt de
 * urgência: o celular do cliente pode estar em outro fuso ou com o relógio
 * errado). Devolve só instantes ISO; o cliente (UrgencyClock) apenas
 * desconta o tempo até eles, nunca recalcula o "agora" da loja.
 *
 * `at` existe só pra simulação em desenvolvimento (?_now=... na home, ver
 * app/[slug]/page.tsx) e pra teste — em produção é sempre chamado sem esse
 * argumento.
 */
export function buildUrgencyState(
  businessHours: BusinessHourRow[],
  config: UrgencyStoreConfig,
  at: Date = new Date(),
): UrgencyState {
  const open = isOpenNow(businessHours, at) === true;

  const lastOrderAt = open ? getLastOrderInstant(businessHours, config.lastOrderOffsetMin, at) : null;
  const windowStart = lastOrderAt
    ? new Date(lastOrderAt.getTime() - config.closingSoonThresholdMin * 60_000)
    : null;
  const etaAt = open
    ? roundUpToFiveMinutes(new Date(at.getTime() + (config.prepTimeMin + config.deliveryTimeMin) * 60_000))
    : null;
  const nextOpenAt = open ? null : getNextOpenInstant(businessHours, at);

  return {
    isOpen: open,
    lastOrderAtISO: lastOrderAt ? lastOrderAt.toISOString() : null,
    windowStartISO: windowStart ? windowStart.toISOString() : null,
    etaAtISO: etaAt ? etaAt.toISOString() : null,
    nextOpenAtISO: nextOpenAt ? nextOpenAt.toISOString() : null,
    freeShippingMin: config.freeShippingMin,
    clockOffsetMs: at.getTime() - Date.now(),
  };
}

const LAST_MINUTE_MS = 60_000;
/** "Últimos 15 minutos": só troca o acento (âmbar → primary) e liga a
 * pulsação do anel — não é uma variante nova, é um modificador visual de
 * quem já está "dentro do limiar" (Parte 2.1). */
export const FINAL_STRETCH_MS = 15 * 60_000;

/** Bucket que o SERVIDOR decide (UrgencyPanel.tsx) — a parte "tem carrinho
 * ou não" fica pro cliente (o carrinho é localStorage, o servidor nunca
 * sabe). Calculado a partir de `lastOrderAtISO` vs. `now`, não de
 * `isOpenNow` sozinho, pra não duplicar a régua de limiar em dois lugares. */
export type UrgencyBucket = "closed" | "within-threshold" | "open-far";

export function deriveUrgencyBucket(state: UrgencyState, now: Date = new Date()): UrgencyBucket {
  if (!state.isOpen || !state.lastOrderAtISO) return "closed";
  if (new Date(state.lastOrderAtISO).getTime() - now.getTime() <= 0) return "closed";
  if (state.windowStartISO && now.getTime() >= new Date(state.windowStartISO).getTime()) return "within-threshold";
  return "open-far";
}

export function isFinalStretch(remainingMs: number): boolean {
  return remainingMs > 0 && remainingMs <= FINAL_STRETCH_MS;
}

export function isLastMinute(remainingMs: number): boolean {
  return remainingMs > 0 && remainingMs <= LAST_MINUTE_MS;
}

/** "13min" acima de 1 minuto restante, "47s" no último minuto — usado no
 * centro do anel (UrgencyClock) e nas linhas de texto do painel, sempre a
 * partir do mesmo `remainingMs` (derivado do relógio único da aplicação),
 * então os dois nunca desincronizam entre si. */
export function formatRemainingCompact(remainingMs: number): string {
  const clamped = Math.max(0, remainingMs);
  if (clamped > LAST_MINUTE_MS) return `${Math.ceil(clamped / 60_000)}min`;
  return `${Math.ceil(clamped / 1000)}s`;
}

/** Minutos restantes pra usar em frases tipo "Últimos pedidos em N minutos". */
export function remainingMinutes(remainingMs: number): number {
  return Math.max(0, Math.ceil(remainingMs / 60_000));
}

const SP_HM_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Instante ISO → "HH:MM" no fuso da loja — usado em toda promessa de
 * horário absoluto do painel ("recebe até 23:40", "Abre amanhã às 18:00"). */
export function formatHM(iso: string): string {
  return SP_HM_FORMATTER.format(new Date(iso));
}

/** "Entrega em 45–55 min" — janela de entrega pra quando a loja está longe
 * de fechar (variante 2 da tabela). Não é um valor que precisa ticar: é o
 * prep+entrega configurados pelo dono, com uma folga de 10 min pra não
 * soar como uma promessa precisa demais (essa promessa exata é o trabalho
 * do `etaAtISO`, mostrado como horário absoluto na linha forte). */
export function formatDeliveryWindowLabel(config: Pick<UrgencyStoreConfig, "prepTimeMin" | "deliveryTimeMin">): string {
  const base = Math.ceil((config.prepTimeMin + config.deliveryTimeMin) / 5) * 5;
  return `Entrega em ${base}–${base + 10} min`;
}
