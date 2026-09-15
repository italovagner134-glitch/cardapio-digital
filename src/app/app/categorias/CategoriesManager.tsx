"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, EyeOff } from "lucide-react";
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
import { CategoryFormDialog } from "./CategoryFormDialog";
import { deleteCategory, toggleCategoryActive, toggleCategoryVisible, moveCategory } from "./actions";
import { CATEGORY_ICONS, UtensilsIcon, type CategoryIconKey } from "@/components/store/icons";
import type { Tables } from "@/lib/supabase/types";

interface CategoriesManagerProps {
  categories: Tables<"categories">[];
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Seu cardápio ainda está vazio.</p>
        <CategoryFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Adicionar primeira categoria
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <CategoryFormDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Nova categoria
            </Button>
          }
        />
      </div>

      <ul className="flex flex-col gap-2">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex flex-col">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                disabled={index === 0 || isPending}
                aria-label="Mover para cima"
                onClick={() => {
                  setPendingId(category.id);
                  startTransition(() => moveCategory(category.id, "up"));
                }}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                disabled={index === categories.length - 1 || isPending}
                aria-label="Mover para baixo"
                onClick={() => {
                  setPendingId(category.id);
                  startTransition(() => moveCategory(category.id, "down"));
                }}
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </div>

            <div className="flex flex-1 items-center gap-2 min-w-0">
              {(() => {
                const Icon = CATEGORY_ICONS[category.icon_key as CategoryIconKey] ?? UtensilsIcon;
                return <Icon size={18} className="shrink-0 text-muted-foreground" />;
              })()}
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium text-card-foreground">
                  {category.name}
                  {!category.is_visible && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                      <EyeOff size={11} aria-hidden="true" />
                      Oculta
                    </span>
                  )}
                </p>
                {category.description && (
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Visível
                <Switch
                  checked={category.is_visible}
                  disabled={isPending && pendingId === category.id}
                  aria-label={
                    category.is_visible ? "Ocultar categoria da régua/home" : "Mostrar categoria na régua/home"
                  }
                  onCheckedChange={(checked) => {
                    setPendingId(category.id);
                    startTransition(() => toggleCategoryVisible(category.id, checked));
                  }}
                />
              </label>

              <Switch
                checked={category.is_active}
                disabled={isPending && pendingId === category.id}
                aria-label={category.is_active ? "Desativar categoria" : "Ativar categoria"}
                onCheckedChange={(checked) => {
                  setPendingId(category.id);
                  startTransition(() => toggleCategoryActive(category.id, checked));
                }}
              />

              <CategoryFormDialog
                category={category}
                trigger={
                  <Button type="button" variant="ghost" size="icon" aria-label="Editar categoria">
                    <Pencil className="size-4" />
                  </Button>
                }
              />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Excluir categoria">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir “{category.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Os produtos dessa categoria também serão excluídos. Essa ação não pode ser
                      desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => startTransition(() => deleteCategory(category.id))}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
