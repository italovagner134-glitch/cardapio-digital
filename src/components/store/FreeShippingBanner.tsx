"use client";

import { Bike, ChevronRight } from "lucide-react";
import { formatBRL } from "@/lib/format";

interface FreeShippingBannerProps {
  minOrderValue: number | null;
  onClick: () => void;
}

export function FreeShippingBanner({ minOrderValue, onClick }: FreeShippingBannerProps) {
  if (!minOrderValue) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-4 mt-6 flex w-[calc(100%-2rem)] items-center gap-3 rounded-2xl p-4 text-left text-onprimary transition-transform duration-150 active:scale-[0.98]"
      style={{
        background: "linear-gradient(100deg, var(--primary) 0%, var(--primary-soft) 100%)",
      }}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Bike size={18} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Frete grátis acima de {formatBRL(Math.round(minOrderValue * 100))}</p>
        <p className="text-[11px] opacity-85">Entrega rápida e segura para você!</p>
      </div>

      <ChevronRight size={20} className="ml-auto shrink-0" aria-hidden="true" />
    </button>
  );
}
