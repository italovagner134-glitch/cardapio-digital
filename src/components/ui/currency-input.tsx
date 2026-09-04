"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface CurrencyInputProps {
  id?: string;
  name: string;
  defaultValueCents?: number;
  required?: boolean;
}

/**
 * Máscara de preço em R$ sem dependência externa: cada dígito digitado
 * empurra os anteriores, como em qualquer teclado numérico de caixa
 * (1 → R$ 0,01, 29 → R$ 0,29, 2990 → R$ 29,90). O valor real em centavos
 * vai num input escondido — nunca usar float pra dinheiro.
 */
export function CurrencyInput({ id, name, defaultValueCents = 0, required }: CurrencyInputProps) {
  const [cents, setCents] = useState(defaultValueCents);

  return (
    <>
      <input type="hidden" name={name} value={cents} />
      <Input
        id={id}
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={cents === 0 ? "" : centsToDisplay(cents)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          setCents(digits ? Number(digits) : 0);
        }}
        aria-required={required}
      />
    </>
  );
}
