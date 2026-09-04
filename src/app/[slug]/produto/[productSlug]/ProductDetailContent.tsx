"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageOff, Minus, Plus } from "lucide-react";
import { SolidHeader } from "@/components/store/SolidHeader";
import { formatBRL } from "@/lib/format";
import { getProductPricing } from "@/lib/promotions";
import { routes } from "@/lib/routes";
import { useStoreRef } from "@/lib/store-context";
import { useCart } from "@/lib/cart/use-cart";
import type { Product, Promotion } from "@/types/store";

interface ProductDetailContentProps {
  product: Product;
  promotion?: Promotion;
  orderingDisabled: boolean;
}

/**
 * Detalhe do produto como ROTA de verdade, não modal — resolve de vez o
 * problema documentado no antigo ProductModal.tsx (Dialog/Radix usa portal
 * pra document.body, que não herda as CSS vars do tema aplicadas no root da
 * página). A validação de grupo obrigatório e o cálculo de total são os
 * mesmos daquele componente, só que ligados ao carrinho de verdade agora.
 */
export function ProductDetailContent({ product, promotion, orderingDisabled }: ProductDetailContentProps) {
  const router = useRouter();
  const { slug } = useStoreRef();
  const cart = useCart();

  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const groups = [...product.product_option_groups].sort((a, b) => a.sort_order - b.sort_order);
  const pricing = getProductPricing(product.price_cents, promotion);

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
    return (
      sum + group.product_options.filter((option) => selected.includes(option.id)).reduce((s, o) => s + o.price_cents, 0)
    );
  }, 0);

  const unitPrice = pricing.finalPriceCents + optionsTotal;
  const total = unitPrice * quantity;

  function handleAdd() {
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

    const selectionEntries = groups.flatMap((group) => {
      const selected = selections[group.id] ?? [];
      return group.product_options
        .filter((option) => selected.includes(option.id))
        .map((option) => ({
          groupId: group.id,
          groupName: group.name,
          optionId: option.id,
          optionName: option.name,
          priceCents: option.price_cents,
        }));
    });

    cart.addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      imageUrl: product.image_url,
      quantity,
      note,
      selections: selectionEntries,
      optionsTotalCents: optionsTotal,
      unitBasePriceCents: product.price_cents + optionsTotal,
      unitPriceCents: unitPrice,
      promotionId: promotion?.id ?? null,
    });

    toast.success(`${product.name} adicionado`, { description: formatBRL(total) });
    router.push(routes.cart(slug));
  }

  return (
    <div>
      <SolidHeader title={product.name} onBack={() => router.back()} />

      <div className="relative aspect-square w-full bg-surface2">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill sizes="480px" priority className="object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <ImageOff size={40} aria-hidden="true" />
          </div>
        )}
        {pricing.hasDiscount && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white">
            -{pricing.percentOff}%
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4 pb-8">
        <div>
          <h2 className="text-xl font-bold text-content">{product.name}</h2>
          {product.description && <p className="mt-1 text-sm text-muted">{product.description}</p>}
        </div>

        {pricing.hasDiscount ? (
          <p className="flex items-baseline gap-2">
            <span className="text-sm text-muted line-through">{formatBRL(pricing.basePriceCents)}</span>
            <span className="text-xl font-bold text-primary">{formatBRL(pricing.finalPriceCents)}</span>
          </p>
        ) : (
          <p className="text-xl font-bold text-primary">{formatBRL(pricing.finalPriceCents)}</p>
        )}

        {!product.is_available && (
          <p className="rounded-lg bg-surface2 px-3 py-2 text-sm text-muted">Esse produto está esgotado no momento.</p>
        )}

        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-content">{group.name}</p>
              <span className="text-xs text-muted">
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
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                        selected ? "border-primary bg-primary/10" : "border-line"
                      }`}
                    >
                      <span className="text-content">{option.name}</span>
                      {option.price_cents > 0 && (
                        <span className="text-xs text-muted">+ {formatBRL(option.price_cents)}</span>
                      )}
                    </button>
                  );
                })}
            </div>
            {errors[group.id] && <p className="text-xs text-red-500">{errors[group.id]}</p>}
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label htmlFor="product-note" className="font-semibold text-content">
            Observação
          </label>
          <textarea
            id="product-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ex.: sem cebola"
            rows={2}
            className="rounded-xl border border-line bg-surface p-3 text-sm text-content outline-none focus-visible:border-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-content">Quantidade</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              className="flex size-9 items-center justify-center rounded-full border border-line text-content transition-transform duration-150 active:scale-90"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <span className="w-6 text-center font-semibold text-content">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
              className="flex size-9 items-center justify-center rounded-full border border-line text-content transition-transform duration-150 active:scale-90"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={!product.is_available || orderingDisabled}
          onClick={handleAdd}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-onprimary transition-transform duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {orderingDisabled ? "Loja fechada" : `Adicionar — ${formatBRL(total)}`}
        </button>
      </div>
    </div>
  );
}
