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
import { createCategory, updateCategory, type CategoryActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

interface CategoryFormDialogProps {
  category?: Tables<"categories">;
  trigger: React.ReactNode;
}

export function CategoryFormDialog({ category, trigger }: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false);
  const action = category ? updateCategory.bind(null, category.id) : createCategory;
  const [state, formAction, isPending] = useActionState<CategoryActionState, FormData>(
    action,
    undefined,
  );

  // Fecha o dialog após sucesso sem useEffect: ajusta o estado durante a
  // própria renderização (padrão recomendado pelo React para "reagir a uma
  // mudança de prop/estado"), em vez de um efeito com setState em cascata.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{category ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>
              Ex.: Hambúrgueres, Bebidas, Sobremesas. Você pode reordenar depois.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              name="name"
              required
              defaultValue={category?.name}
              placeholder="Hambúrgueres"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category-description">Descrição (opcional)</Label>
            <Textarea
              id="category-description"
              name="description"
              defaultValue={category?.description ?? ""}
              placeholder="Uma linha curta sobre a categoria"
              rows={2}
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
