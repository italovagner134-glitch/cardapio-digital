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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { createProduct, updateProduct, type ProductActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

interface ProductFormDialogProps {
  categories: Tables<"categories">[];
  product?: Tables<"products">;
  trigger: React.ReactNode;
}

export function ProductFormDialog({ categories, product, trigger }: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, isPending] = useActionState<ProductActionState, FormData>(
    action,
    undefined,
  );

  // Mesmo padrão do CategoryFormDialog: ajusta durante a renderização em
  // vez de useEffect, evitando o setState-em-efeito que o linter reprova.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              É assim que seu cliente vai ver no cardápio.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">Nome</Label>
            <Input
              id="product-name"
              name="name"
              required
              defaultValue={product?.name}
              placeholder="X-Tudo"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              name="description"
              defaultValue={product?.description ?? ""}
              placeholder="Pão brioche, hambúrguer artesanal, queijo, bacon, ovo e molho especial."
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-price">Preço</Label>
              <CurrencyInput
                id="product-price"
                name="priceCents"
                defaultValueCents={product?.price_cents ?? 0}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="product-compare-price">Preço &ldquo;de&rdquo; (opcional)</Label>
              <CurrencyInput
                id="product-compare-price"
                name="compareAtPriceCents"
                defaultValueCents={product?.compare_at_price_cents ?? 0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-category">Categoria</Label>
            <Select name="categoryId" defaultValue={product?.category_id} required>
              <SelectTrigger id="product-category" className="w-full">
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-image">Foto (opcional)</Label>
            <Input id="product-image" name="image" type="file" accept="image/*" />
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Disponível</span>
              <Switch name="isAvailable" defaultChecked={product?.is_available ?? true} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Destaque no cardápio</span>
              <Switch name="isFeatured" defaultChecked={product?.is_featured ?? false} />
            </label>
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
