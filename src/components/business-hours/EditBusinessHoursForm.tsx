"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { BusinessHoursFields } from "./BusinessHoursFields";
import { updateBusinessHours, type UpdateBusinessHoursState } from "@/app/app/horarios/actions";

interface EditBusinessHoursFormProps {
  restaurantId: string;
  defaultOpensAt?: string;
  defaultClosesAt?: string;
  defaultOpenDays?: number[];
}

export function EditBusinessHoursForm({
  restaurantId,
  defaultOpensAt,
  defaultClosesAt,
  defaultOpenDays,
}: EditBusinessHoursFormProps) {
  const [state, formAction, isPending] = useActionState<UpdateBusinessHoursState, FormData>(
    updateBusinessHours.bind(null, restaurantId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <BusinessHoursFields
        defaultOpensAt={defaultOpensAt}
        defaultClosesAt={defaultClosesAt}
        defaultOpenDays={defaultOpenDays}
      />

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-manjericao-600">
          Horários atualizados.
        </p>
      )}

      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Salvando…" : "Salvar horários"}
      </Button>
    </form>
  );
}
