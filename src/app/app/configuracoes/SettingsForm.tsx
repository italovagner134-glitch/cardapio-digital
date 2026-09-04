"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { PAYMENT_METHODS } from "@/lib/validations/settings";
import { updateRestaurantSettings, type SettingsActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

interface SettingsFormProps {
  settings: Tables<"restaurant_settings"> | null;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    updateRestaurantSettings,
    undefined,
  );

  const paymentMethods = (settings?.payment_methods as string[] | null) ?? [
    "dinheiro",
    "pix",
    "cartao_entrega",
  ];

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tipos de pedido
        </h2>
        <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
          <span>Entrega</span>
          <Switch name="acceptsDelivery" defaultChecked={settings?.accepts_delivery ?? true} />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
          <span>Retirada no balcão</span>
          <Switch name="acceptsPickup" defaultChecked={settings?.accepts_pickup ?? true} />
        </label>
        <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
          <span>Consumo no local</span>
          <Switch name="acceptsDinein" defaultChecked={settings?.accepts_dinein ?? false} />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Entrega
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="minOrder">Pedido mínimo</Label>
            <CurrencyInput
              id="minOrder"
              name="minOrderCents"
              defaultValueCents={settings?.min_order_cents ?? 0}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="deliveryTimeMin">Entrega em (min)</Label>
            <Input
              id="deliveryTimeMin"
              name="deliveryTimeMin"
              type="number"
              min={0}
              defaultValue={settings?.delivery_time_min ?? ""}
              placeholder="30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="deliveryTimeMax">até (min)</Label>
            <Input
              id="deliveryTimeMax"
              name="deliveryTimeMax"
              type="number"
              min={0}
              defaultValue={settings?.delivery_time_max ?? ""}
              placeholder="50"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Formas de pagamento aceitas
        </h2>
        <div className="flex flex-wrap gap-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
            >
              <Checkbox
                name="paymentMethods"
                value={method.value}
                defaultChecked={paymentMethods.includes(method.value)}
              />
              <span>{method.label}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pixKey">Chave Pix (opcional, mostrada no checkout)</Label>
          <Input id="pixKey" name="pixKey" defaultValue={settings?.pix_key ?? ""} placeholder="11999999999" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Outros
        </h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instagram">Instagram (opcional)</Label>
          <Input
            id="instagram"
            name="instagram"
            defaultValue={settings?.instagram ?? ""}
            placeholder="@seurestaurante"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="orderNotice">Aviso no cardápio (opcional)</Label>
          <Textarea
            id="orderNotice"
            name="orderNotice"
            defaultValue={settings?.order_notice ?? ""}
            placeholder="Ex.: Hoje só aceitamos retirada no balcão."
            rows={2}
          />
        </div>
      </section>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-manjericao-600">
          Configurações salvas.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Salvando…" : "Salvar configurações"}
      </Button>
    </form>
  );
}
