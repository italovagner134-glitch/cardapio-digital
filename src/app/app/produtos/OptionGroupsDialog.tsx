"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOption,
  deleteOption,
  toggleOptionAvailable,
  type OptionGroupActionState,
  type OptionActionState,
} from "./actions";
import type { Tables } from "@/lib/supabase/types";

type GroupWithOptions = Tables<"product_option_groups"> & {
  product_options: Tables<"product_options">[];
};

interface OptionGroupsDialogProps {
  productId: string;
  productName: string;
  groups: GroupWithOptions[];
  trigger: React.ReactNode;
}

export function OptionGroupsDialog({
  productId,
  productName,
  groups,
  trigger,
}: OptionGroupsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complementos — {productName}</DialogTitle>
          <DialogDescription>
            Ex.: &ldquo;Ponto da carne&rdquo; (obrigatório, escolha 1) ou &ldquo;Adicionais&rdquo;
            (opcional, até 3).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
          <NewGroupForm productId={productId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({ group }: { group: GroupWithOptions }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [state, formAction, isSaving] = useActionState<OptionGroupActionState, FormData>(
    updateOptionGroup.bind(null, group.id),
    undefined,
  );

  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.success) setEditing(false);
  }

  return (
    <div className="rounded-xl border border-border p-4">
      {editing ? (
        <form action={formAction} className="flex flex-col gap-3" noValidate>
          <Input name="name" defaultValue={group.name} required placeholder="Nome do grupo" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Mínimo</Label>
              <Input name="minSelect" type="number" min={0} defaultValue={group.min_select} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Máximo</Label>
              <Input name="maxSelect" type="number" min={1} defaultValue={group.max_select} />
            </div>
          </div>
          <label className="flex items-center justify-between text-sm">
            <span>Obrigatório</span>
            <Switch name="isRequired" defaultChecked={group.is_required} />
          </label>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-card-foreground">{group.name}</p>
            <p className="text-xs text-muted-foreground">
              {group.is_required ? "Obrigatório" : "Opcional"} · escolha{" "}
              {group.min_select === group.max_select
                ? group.max_select
                : `${group.min_select} a ${group.max_select}`}
            </p>
          </div>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={isPending}
              aria-label="Excluir grupo"
              onClick={() => startTransition(() => deleteOptionGroup(group.id))}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
        {group.product_options.map((option) => (
          <OptionRow key={option.id} option={option} />
        ))}
        {group.product_options.length === 0 && (
          <li className="text-xs text-muted-foreground">Nenhuma opção ainda.</li>
        )}
      </ul>

      <NewOptionForm groupId={group.id} />
    </div>
  );
}

function OptionRow({ option }: { option: Tables<"product_options"> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 text-sm">
      <Switch
        checked={option.is_available}
        disabled={isPending}
        aria-label={option.is_available ? "Marcar indisponível" : "Marcar disponível"}
        onCheckedChange={(checked) =>
          startTransition(() => toggleOptionAvailable(option.id, checked))
        }
      />
      <span className={`flex-1 ${!option.is_available ? "text-muted-foreground line-through" : ""}`}>
        {option.name}
      </span>
      {option.price_cents > 0 && (
        <span className="font-mono text-xs text-muted-foreground">
          +{" "}
          {(option.price_cents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      )}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-6"
        disabled={isPending}
        onClick={() => startTransition(() => deleteOption(option.id))}
        aria-label="Excluir opção"
      >
        <Trash2 className="size-3.5 text-destructive" />
      </Button>
    </li>
  );
}

function NewGroupForm({ productId }: { productId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<OptionGroupActionState, FormData>(
    createOptionGroup.bind(null, productId),
    undefined,
  );

  // Resetar o form é uma mutação de DOM (ref), não estado React — precisa
  // ficar num efeito de verdade, diferente do padrão "ajustar durante a
  // renderização" usado pros dialogs (que só mexe em setState).
  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-4"
      noValidate
    >
      <p className="text-sm font-medium text-card-foreground">Novo grupo de complemento</p>
      <Input name="name" placeholder="Ex.: Ponto da carne" required />
      <div className="grid grid-cols-2 gap-2">
        <Input name="minSelect" type="number" min={0} defaultValue={0} placeholder="Mínimo" />
        <Input name="maxSelect" type="number" min={1} defaultValue={1} placeholder="Máximo" />
      </div>
      <label className="flex items-center justify-between text-sm">
        <span>Obrigatório</span>
        <Switch name="isRequired" />
      </label>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        <Plus className="size-4" /> {isPending ? "Criando…" : "Adicionar grupo"}
      </Button>
    </form>
  );
}

function NewOptionForm({ groupId }: { groupId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<OptionActionState, FormData>(
    createOption.bind(null, groupId),
    undefined,
  );

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-3 flex items-end gap-2" noValidate>
      <div className="flex flex-1 flex-col gap-1">
        <Label className="text-xs">Opção</Label>
        <Input name="name" placeholder="Ex.: Bacon extra" required />
      </div>
      <div className="flex w-28 flex-col gap-1">
        <Label className="text-xs">Preço</Label>
        <CurrencyInput name="priceCents" />
      </div>
      <Button type="submit" size="sm" disabled={isPending} aria-label="Adicionar opção">
        <Plus className="size-4" />
      </Button>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
