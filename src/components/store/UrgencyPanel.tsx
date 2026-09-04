import { Bell } from "lucide-react";
import { UrgencyPanelLive } from "./UrgencyPanelLive";
import { deriveUrgencyBucket, formatDeliveryWindowLabel, type UrgencyState } from "@/lib/urgency";

interface UrgencyPanelProps {
  state: UrgencyState;
  enabled: boolean;
  prepTimeMin: number;
  deliveryTimeMin: number;
  /** Já calculado por quem monta a página (getNextOpeningLabel), reaproveitado
   * aqui em vez de remontar o label em PT a partir do ISO — StoreStatusBar
   * já mostra o mesmo texto na linha de status simples. */
  nextOpeningLabel: string | null;
  /** O MESMO instante usado por quem montou `state` (buildUrgencyState) —
   * nunca um `new Date()` novo aqui. Em produção os dois são "agora" de
   * qualquer forma, mas em desenvolvimento (`?_now=`) usar instantes
   * diferentes faz o bucket "aberta dentro do limiar" ser calculado contra
   * o relógio real enquanto `state` foi montado pro horário simulado —
   * o painel ficava preso em "longe de fechar" mesmo simulando o
   * fechamento. */
  now: Date;
}

/**
 * Server Component — decide QUANDO o painel existe e, dos três eixos que
 * decidem a variante (aberta/fechada, dentro-do-limiar, tem-carrinho), os
 * dois primeiros: bucket vem de `deriveUrgencyBucket(state, agora)`. O
 * terceiro eixo (carrinho) só o cliente sabe — por isso os buckets "aberta"
 * delegam pro filho `'use client'` (UrgencyPanelLive); só o bucket
 * "fechada" não depende de carrinho nenhum (Parte 2.1, variante 5) e fica
 * inteiro aqui, sem hidratar nada.
 *
 * Princípio da Parte 0 do prompt: o painel só existe quando tem algo
 * verdadeiro a dizer. `enabled=false` (painel desligado pelo dono) e "nada
 * pra dizer" (bucket aberto-longe + sem carrinho, decidido dentro de
 * UrgencyPanelLive) são os dois jeitos de não renderizar nada.
 */
export function UrgencyPanel({ state, enabled, prepTimeMin, deliveryTimeMin, nextOpeningLabel, now }: UrgencyPanelProps) {
  if (!enabled) return null;

  const bucket = deriveUrgencyBucket(state, now);

  if (bucket === "closed") {
    return (
      <div
        className="mx-4 mt-3 rounded-2xl border border-line bg-surface p-3"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,.25)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-muted">Fechada agora</p>
            {nextOpeningLabel && <p className="text-[11px] text-muted">{nextOpeningLabel}</p>}
          </div>
          {/* TODO(painel do dono): assinatura de "avise-me quando abrir" —
              precisa de um jeito de guardar o interesse (e-mail/whatsapp) e
              de um disparo quando a loja reabre. Sem isso o botão fica só
              de intenção, deliberadamente inerte (não é Server Action nem
              'use client' ainda). */}
          <button
            type="button"
            disabled
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-muted opacity-60"
          >
            <Bell size={13} aria-hidden="true" />
            Avise-me quando abrir
          </button>
        </div>
      </div>
    );
  }

  return (
    <UrgencyPanelLive
      state={state}
      bucket={bucket}
      deliveryWindowLabel={formatDeliveryWindowLabel({ prepTimeMin, deliveryTimeMin })}
    />
  );
}
