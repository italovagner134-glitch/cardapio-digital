"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PromotionFormDialog } from "./PromotionFormDialog";
import { deletePromotion, togglePromotionActive, movePromotion, resetPromotionStock } from "./actions";
import type { Tables } from "@/lib/supabase/types";

type Promotion = Tables<"promotions"> & { products: Pick<Tables<"products">, "id" | "name"> | null };
type Product = Tables<"products">;

interface PromotionsManagerProps {
  promotions: Promotion[];
  products: Product[];
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function discountSummary(promo: Promotion): string {
  if (promo.discount_type === "none" || promo.discount_value == null) return "Sem desconto";
  if (promo.discount_type === "percent") return `-${promo.discount_value}%`;
  if (promo.discount_type === "fixed") return `-${formatBRL(promo.discount_value)}`;
  return `Por ${formatBRL(promo.discount_value)}`;
}

export function PromotionsManager({ promotions, products }: PromotionsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Cadastre um produto antes de criar uma promoção.</p>
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Nenhuma promoção criada ainda.</p>
        <PromotionFormDialog
          products={products}
          trigger={
            <Button>
              <Plus className="size-4" /> Criar promoção
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <PromotionFormDialog
          products={products}
          trigger={
            <Button>
              <Plus className="size-4" /> Nova promoção
            </Button>
          }
        />
      </div>

      <ul className="flex flex-col gap-2">
        {promotions.map((promo, index) => {
          const soldOut = promo.stock_limit != null && promo.stock_used >= promo.stock_limit;
          return (
            <li key={promo.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-col">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === 0 || isPending}
                  aria-label="Mover para cima"
                  onClick={() => {
                    setPendingId(promo.id);
                    startTransition(() => movePromotion(promo.id, "up"));
                  }}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  disabled={index === promotions.length - 1 || isPending}
                  aria-label="Mover para baixo"
                  onClick={() => {
                    setPendingId(promo.id);
                    startTransition(() => movePromotion(promo.id, "down"));
                  }}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-card-foreground">{promo.title}</p>
                <p className="text-sm text-muted-foreground">
                  {promo.products?.name ?? "Produto removido"} · {discountSummary(promo)}
                  {promo.stock_limit != null && (
                    <>
                      {" "}
                      · {promo.stock_used}/{promo.stock_limit} usadas
                      {soldOut && " · esgotada"}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {soldOut && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Reabrir promoção (zerar estoque usado)"
                    disabled={isPending && pendingId === promo.id}
                    onClick={() => {
                      setPendingId(promo.id);
                      startTransition(() => resetPromotionStock(promo.id));
                    }}
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                )}

                <Switch
                  checked={promo.is_active}
                  disabled={isPending && pendingId === promo.id}
                  aria-label={promo.is_active ? "Desativar promoção" : "Ativar promoção"}
                  onCheckedChange={(checked) => {
                    setPendingId(promo.id);
                    startTransition(() => togglePromotionActive(promo.id, checked));
                  }}
                />

                <PromotionFormDialog
                  products={products}
                  promotion={promo}
                  trigger={
                    <Button type="button" variant="ghost" size="icon" aria-label="Editar promoção">
                      <Pencil className="size-4" />
                    </Button>
                  }
                />

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" aria-label="Excluir promoção">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir “{promo.title}”?</AlertDialogTitle>
                      <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => startTransition(() => deletePromotion(promo.id))}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
