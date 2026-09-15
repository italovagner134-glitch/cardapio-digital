"use client";

import { useActionState, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEEKDAYS_PT, isoToSaoPauloDateTimeLocal } from "@/lib/business-hours";
import { DISCOUNT_TYPES } from "@/lib/validations/promotions";
import { createPromotion, updatePromotion, type PromotionActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

type Promotion = Tables<"promotions">;
type Product = Tables<"products">;

interface PromotionFormDialogProps {
  products: Product[];
  promotion?: Promotion;
  trigger: React.ReactNode;
}

const WEEKDAY_SHORT = WEEKDAYS_PT.map((d) => d.slice(0, 3).replace(/^./, (c) => c.toUpperCase()));

// datetime-local pede "YYYY-MM-DDTHH:mm" — sempre no horário de São Paulo
// (não no fuso de quem está com o navegador aberto, que pode ser outro
// estado/país), o mesmo fuso fixo que toISOOrNull() (actions.ts) assume ao
// gravar. Delegado pro helper de business-hours.ts pra não duplicar a regra.
const toDateTimeLocal = isoToSaoPauloDateTimeLocal;

export function PromotionFormDialog({ products, promotion, trigger }: PromotionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [discountType, setDiscountType] = useState(promotion?.discount_type ?? "percent");
  const [weekdays, setWeekdays] = useState<number[]>(promotion?.weekdays ?? []);

  const action = promotion ? updatePromotion.bind(null, promotion.id) : createPromotion;
  const [state, formAction, isPending] = useActionState<PromotionActionState, FormData>(action, undefined);

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{promotion ? "Editar promoção" : "Nova promoção"}</DialogTitle>
            <DialogDescription>
              Aparece em destaque na Home e na aba Promoções do cardápio público, enquanto estiver dentro da
              janela configurada abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="promo-product">Produto</Label>
            <Select name="productId" defaultValue={promotion?.product_id ?? undefined} required>
              <SelectTrigger id="promo-product" className="w-full">
                <SelectValue placeholder="Escolha o produto em promoção" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-title">Título</Label>
              <Input
                id="promo-title"
                name="title"
                required
                defaultValue={promotion?.title}
                placeholder="Ex.: Terça é dia de X-Tudo"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-badge">Selo</Label>
              <Input
                id="promo-badge"
                name="badgeText"
                defaultValue={promotion?.badge_text ?? "PROMOÇÃO DO DIA"}
                placeholder="PROMOÇÃO DO DIA"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="promo-subtitle">Subtítulo (opcional)</Label>
            <Input
              id="promo-subtitle"
              name="subtitle"
              defaultValue={promotion?.subtitle ?? ""}
              placeholder="Ex.: Só hoje, das 18h às 22h"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-discount-type">Tipo de desconto</Label>
              <Select
                name="discountType"
                defaultValue={discountType}
                onValueChange={setDiscountType}
                required
              >
                <SelectTrigger id="promo-discount-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-discount-value">
                {discountType === "price" ? "Preço final (R$)" : discountType === "fixed" ? "Desconto (R$)" : "Desconto (%)"}
              </Label>
              <Input
                id="promo-discount-value"
                name="discountValue"
                type="number"
                step="0.01"
                min={0}
                disabled={discountType === "none"}
                defaultValue={promotion?.discount_value ?? ""}
                placeholder={discountType === "percent" ? "20" : "0,00"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Dias da semana (deixe tudo desmarcado pra valer todo dia)</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_SHORT.map((label, day) => (
                <label
                  key={day}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <input
                    type="checkbox"
                    name="weekdays"
                    value={day}
                    checked={weekdays.includes(day)}
                    onChange={() => toggleWeekday(day)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-daily-start">Vale a partir de (opcional)</Label>
              <Input id="promo-daily-start" name="dailyStart" type="time" defaultValue={promotion?.daily_start ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-daily-end">Até (opcional)</Label>
              <Input id="promo-daily-end" name="dailyEnd" type="time" defaultValue={promotion?.daily_end ?? ""} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-starts-at">Começa em (opcional)</Label>
              <Input
                id="promo-starts-at"
                name="startsAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(promotion?.starts_at ?? null)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="promo-ends-at">Termina em (opcional)</Label>
              <Input
                id="promo-ends-at"
                name="endsAt"
                type="datetime-local"
                defaultValue={toDateTimeLocal(promotion?.ends_at ?? null)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="promo-stock">Limite de unidades (opcional)</Label>
            <Input
              id="promo-stock"
              name="stockLimit"
              type="number"
              min={1}
              defaultValue={promotion?.stock_limit ?? ""}
              placeholder="Ex.: 20 — some da promoção quando esgotar"
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
