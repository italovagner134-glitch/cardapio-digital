"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRestaurantAddress, type SettingsActionState } from "./actions";
import type { Tables } from "@/lib/supabase/types";

interface AddressFormProps {
  restaurant: Tables<"restaurants">;
}

/** Endereço estruturado + lat/lng + CNPJ/razão social — as colunas já
 * existiam (Prompt 03), só faltava esta tela. Alimenta o card "Como chegar"
 * do InfoSheet público (lib/maps.ts lê exatamente estes campos). */
export function AddressForm({ restaurant }: AddressFormProps) {
  const [state, formAction, isPending] = useActionState<SettingsActionState, FormData>(
    updateRestaurantAddress,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Endereço
        </h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressStreet">Rua</Label>
            <Input
              id="addressStreet"
              name="addressStreet"
              defaultValue={restaurant.address_street ?? ""}
              placeholder="Rua das Flores"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressNumber">Número</Label>
            <Input
              id="addressNumber"
              name="addressNumber"
              defaultValue={restaurant.address_number ?? ""}
              placeholder="123"
              className="sm:w-28"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressDistrict">Bairro</Label>
            <Input
              id="addressDistrict"
              name="addressDistrict"
              defaultValue={restaurant.address_district ?? ""}
              placeholder="Centro"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressCity">Cidade</Label>
            <Input id="addressCity" name="addressCity" defaultValue={restaurant.address_city ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressState">UF</Label>
            <Input
              id="addressState"
              name="addressState"
              maxLength={2}
              defaultValue={restaurant.address_state ?? ""}
              placeholder="MG"
              className="uppercase"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressZip">CEP</Label>
            <Input id="addressZip" name="addressZip" defaultValue={restaurant.address_zip ?? ""} placeholder="35660-000" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="addressNote">Referência (opcional)</Label>
            <Input
              id="addressNote"
              name="addressNote"
              defaultValue={restaurant.address_note ?? ""}
              placeholder="Portão azul, ao lado da padaria"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="latitude">Latitude (opcional)</Label>
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              defaultValue={restaurant.latitude ?? ""}
              placeholder="-19.8619"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="longitude">Longitude (opcional)</Label>
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              defaultValue={restaurant.longitude ?? ""}
              placeholder="-44.6086"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Com latitude/longitude, o botão &ldquo;Como chegar&rdquo; do cardápio abre a rota exata — sem elas, usa o
          endereço digitado acima. Copie as coordenadas do Google Maps: clique com o botão direito no local do mapa.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dados fiscais (opcional)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="legalName">Razão social</Label>
            <Input id="legalName" name="legalName" defaultValue={restaurant.legal_name ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" name="cnpj" defaultValue={restaurant.cnpj ?? ""} placeholder="00.000.000/0001-00" />
          </div>
        </div>
      </section>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-manjericao-600">
          Endereço salvo.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Salvando…" : "Salvar endereço"}
      </Button>
    </form>
  );
}
