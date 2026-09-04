"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface ShippingProgressProps {
  /** `restaurants.free_shipping_min`, em REAIS (não centavos — exceção
   * documentada, ver lib/theme.ts/FreeShippingBanner). `null` = frete
   * grátis não configurado, a linha inteira some. */
  freeShippingMin: number | null;
  /** `null` = sem carrinho (linha 2 do painel, Parte 2.2: "Sem carrinho, a
   * linha vira informativa"). */
  subtotalCents: number | null;
}

/** Linha 2 do painel de urgência — também usada sozinha na variante
 * compacta (aberta, longe de fechar, com carrinho). Comemora o marco de
 * "frete grátis liberado" uma vez só: o brilho re-dispara apenas na
 * transição de "não atingiu" pra "atingiu", nunca de novo enquanto o
 * carrinho segue acima do valor (senão repete a cada re-render do
 * relógio do painel, que é a cada segundo). */
export function ShippingProgress({ freeShippingMin, subtotalCents }: ShippingProgressProps) {
  const minCents = freeShippingMin != null ? Math.round(freeShippingMin * 100) : null;
  const reached = minCents != null && subtotalCents != null && subtotalCents >= minCents;

  const wasReachedRef = useRef(false);
  const [celebrationKey, setCelebrationKey] = useState(0);
  useEffect(() => {
    if (reached && !wasReachedRef.current) setCelebrationKey((key) => key + 1);
    wasReachedRef.current = reached;
  }, [reached]);

  if (minCents == null) return null;

  if (subtotalCents == null || subtotalCents === 0) {
    return <p className="text-[11px] text-muted">Frete grátis acima de {formatBRL(minCents)}</p>;
  }

  if (reached) {
    return (
      <div>
        <p className="flex items-center gap-1 text-[11px] font-bold text-success">
          <Check size={13} aria-hidden="true" />
          Frete grátis liberado
        </p>
        <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-success">
          <div
            key={celebrationKey}
            aria-hidden="true"
            className="shipping-glow-once absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          />
        </div>
      </div>
    );
  }

  const pct = Math.min(100, (subtotalCents / minCents) * 100);
  const missingCents = minCents - subtotalCents;

  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-primary">Faltam {formatBRL(missingCents)} pro frete grátis</span>
        <span className="tabular-nums text-muted">
          {formatBRL(subtotalCents)} / {formatBRL(minCents)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-white/7">
        <div
          className="h-full rounded-full transition-[width] duration-[400ms]"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--primary-soft))" }}
        />
      </div>
    </div>
  );
}
