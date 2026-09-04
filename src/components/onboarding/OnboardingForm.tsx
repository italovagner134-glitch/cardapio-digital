"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessHoursFields } from "@/components/business-hours/BusinessHoursFields";
import { createRestaurant, type OnboardingActionState } from "@/app/app/actions";
import { CATEGORIAS_RESTAURANTE } from "@/lib/validations/restaurant";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState<OnboardingActionState, FormData>(
    createRestaurant,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-8" noValidate>
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Informações básicas
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">Nome do restaurante</Label>
            <Input id="name" name="name" required placeholder="Burger House" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" required>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Escolha uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_RESTAURANTE.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" required placeholder="(11) 3333-4444" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" required placeholder="(11) 99999-9999" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" required placeholder="São Paulo" />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" required placeholder="Rua Augusta, 123" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fotos (opcional)
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" name="logo" type="file" accept="image/*" />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cover">Imagem de capa</Label>
            <Input id="cover" name="cover" type="file" accept="image/*" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Horário de funcionamento
        </h2>

        <BusinessHoursFields />
      </section>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} size="lg">
        {isPending ? "Publicando…" : "Colocar meu restaurante no ar"}
      </Button>
    </form>
  );
}
