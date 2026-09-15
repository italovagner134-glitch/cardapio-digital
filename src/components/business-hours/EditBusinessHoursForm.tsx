"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { MultiShiftHoursFields } from "./MultiShiftHoursFields";
import { updateBusinessHours, type UpdateBusinessHoursState } from "@/app/app/horarios/actions";
import type { DayShiftsInput } from "@/lib/validations/business-hours-multi";

interface EditBusinessHoursFormProps {
  restaurantId: string;
  defaultDays: DayShiftsInput[];
}

export function EditBusinessHoursForm({ restaurantId, defaultDays }: EditBusinessHoursFormProps) {
  const [state, formAction, isPending] = useActionState<UpdateBusinessHoursState, FormData>(
    updateBusinessHours.bind(null, restaurantId),
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <MultiShiftHoursFields defaultDays={defaultDays} />

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
