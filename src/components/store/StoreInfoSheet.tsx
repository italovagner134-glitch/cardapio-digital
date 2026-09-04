"use client";

import { useEffect, useRef } from "react";
import { X, MapPin, Wallet, AtSign } from "lucide-react";
import type { BusinessHourRow } from "@/types/store";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_entrega: "Cartão na entrega",
};

interface StoreInfoSheetProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  address: string | null;
  city: string | null;
  businessHours: BusinessHourRow[];
  paymentMethods: string[];
  instagram: string | null;
}

/**
 * Renderizada em fluxo (sem portal pra document.body) de propósito: assim
 * herda as CSS variables do tema da loja aplicadas no root da página. Um
 * <Dialog> de portal (shadcn/Radix) não herdaria — ver relatório final.
 */
export function StoreInfoSheet({
  open,
  onClose,
  storeName,
  address,
  city,
  businessHours,
  paymentMethods,
  instagram,
}: StoreInfoSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Informações de ${storeName}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-surface p-6 outline-none sm:rounded-3xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-surface2 text-content transition-transform duration-150 active:scale-90"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <h2 className="pr-10 text-lg font-bold text-content">{storeName}</h2>

        <div className="mt-5 flex flex-col gap-5 text-sm text-content">
          {address && (
            <div className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <p>
                {address}
                {city ? ` — ${city}` : ""}
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 font-semibold">Horários</p>
            <ul className="flex flex-col gap-1">
              {DIAS.map((dia, index) => {
                const row = businessHours.find((h) => h.day_of_week === index);
                return (
                  <li key={dia} className="flex justify-between text-muted">
                    <span>{dia}</span>
                    <span>
                      {!row || row.is_closed || !row.opens_at || !row.closes_at
                        ? "Fechado"
                        : `${row.opens_at.slice(0, 5)} às ${row.closes_at.slice(0, 5)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {paymentMethods.length > 0 && (
            <div className="flex gap-2">
              <Wallet size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <p>{paymentMethods.map((method) => PAYMENT_LABELS[method] ?? method).join(" · ")}</p>
            </div>
          )}

          {instagram && (
            <div className="flex gap-2">
              <AtSign size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <p>{instagram}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
