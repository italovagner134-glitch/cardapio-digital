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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_ICONS, type CategoryIconKey } from "@/components/store/icons";
import { createCategory, updateCategory, type CategoryActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

const ICON_LABELS: Record<CategoryIconKey, string> = {
  star: "Estrela (destaque)",
  burger: "Hambúrguer",
  combo: "Combo",
  chicken: "Frango",
  drink: "Bebida",
  dessert: "Sobremesa",
  pizza: "Pizza",
  icecream: "Sorvete",
  fries: "Porção",
  utensils: "Talheres (genérico)",
};

const DISPLAY_STYLES = [
  { value: "list", label: "Lista (uma coluna, com imagem pequena)" },
  { value: "carousel", label: "Carrossel (grade de cards, imagem grande)" },
] as const;

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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="category-icon">Ícone</Label>
              <Select name="iconKey" defaultValue={category?.icon_key ?? "utensils"} required>
                <SelectTrigger id="category-icon" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_ICONS) as CategoryIconKey[]).map((key) => {
                    const Icon = CATEGORY_ICONS[key];
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <Icon size={16} />
                          {ICON_LABELS[key]}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category-display-style">Estilo de exibição</Label>
              <Select name="displayStyle" defaultValue={category?.display_style ?? "list"} required>
                <SelectTrigger id="category-display-style" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISPLAY_STYLES.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
