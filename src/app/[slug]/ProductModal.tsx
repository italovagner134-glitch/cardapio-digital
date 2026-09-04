"use client";

// NÃO LIGADO À TELA ATUAL: preservado de propósito. A home da loja pública
// (src/components/store/*) tem um sistema de tema dinâmico por restaurante
// via CSS variables aplicadas só na página; este componente usa <Dialog>
// (Radix/shadcn), que renderiza via portal em document.body e por isso não
// herdaria essas variáveis. A lógica de validação de grupos obrigatórios e
// cálculo de total AQUI DENTRO já está pronta e testada — na Fase 3, quando
// o carrinho existir, ou refaça essa UI sem portal (como StoreInfoSheet.tsx)
// ou aplique o tema também no container do portal.
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Minus, Plus, ImageOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatBRL, type ProductWithOptions } from "./types";

interface ProductModalProps {
  product: ProductWithOptions | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal de produto da Fase 2: calcula e valida o total (produto + adicionais
 * × quantidade), mas "Adicionar" ainda não tem carrinho pra guardar o item —
 * isso é a Fase 3. Aqui só confirmamos que a conta fecha certo.
 */
export function ProductModal({ product, onOpenChange }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reseta o estado quando o produto do modal muda — ajuste durante a
  // renderização em vez de useEffect (mesmo padrão usado nos dialogs do painel).
  const [lastProductId, setLastProductId] = useState<string | null>(null);
  if (product && product.id !== lastProductId) {
    setLastProductId(product.id);
    setQuantity(1);
    setSelections({});
    setNote("");
    setErrors({});
  }

  if (!product) return null;

  const groups = [...product.product_option_groups].sort((a, b) => a.sort_order - b.sort_order);

  function toggleOption(groupId: string, optionId: string, maxSelect: number) {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (maxSelect === 1) {
        return { ...prev, [groupId]: current[0] === optionId ? [] : [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
    setErrors((prev) => ({ ...prev, [groupId]: "" }));
  }

  const optionsTotal = groups.reduce((sum, group) => {
    const selected = selections[group.id] ?? [];
    const groupTotal = group.product_options
      .filter((option) => selected.includes(option.id))
      .reduce((s, option) => s + option.price_cents, 0);
    return sum + groupTotal;
  }, 0);

  const unitPrice = product.price_cents + optionsTotal;
  const total = unitPrice * quantity;

  function handleAdd() {
    if (!product) return;

    const newErrors: Record<string, string> = {};
    for (const group of groups) {
      const selectedCount = (selections[group.id] ?? []).length;
      if (selectedCount < group.min_select) {
        newErrors[group.id] = `Escolha pelo menos ${group.min_select}.`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    toast.success(`${product.name} — ${formatBRL(total)}`, {
      description: "O carrinho chega na próxima fase. Por enquanto isso só confirma o valor.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0">
        <div className="relative h-56 w-full bg-kraft-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="512px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-tinta-900/30">
              <ImageOff className="size-10" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5 p-6">
          <DialogHeader className="text-left">
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>

          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}

          <p className="font-mono text-lg font-semibold text-foreground">
            {formatBRL(product.price_cents)}
          </p>

          {!product.is_available && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Esse produto está esgotado no momento.
            </p>
          )}

          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <p className="font-medium text-foreground">{group.name}</p>
                <span className="text-xs text-muted-foreground">
                  {group.is_required ? "Obrigatório" : "Opcional"}
                  {group.max_select > 1 ? ` · até ${group.max_select}` : ""}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                {group.product_options
                  .filter((option) => option.is_available)
                  .map((option) => {
                    const selected = (selections[group.id] ?? []).includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleOption(group.id, option.id, group.max_select)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          selected ? "border-primary bg-accent" : "border-border"
                        }`}
                      >
                        <span>{option.name}</span>
                        {option.price_cents > 0 && (
                          <span className="font-mono text-xs text-muted-foreground">
                            + {formatBRL(option.price_cents)}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {errors[group.id] && <p className="text-xs text-destructive">{errors[group.id]}</p>}
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <label htmlFor="product-note" className="font-medium text-foreground">
              Observação
            </label>
            <Textarea
              id="product-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ex.: sem cebola"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Quantidade</span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Diminuir quantidade"
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-6 text-center font-mono">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Aumentar quantidade"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <Button type="button" size="lg" disabled={!product.is_available} onClick={handleAdd}>
            Adicionar — {formatBRL(total)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
