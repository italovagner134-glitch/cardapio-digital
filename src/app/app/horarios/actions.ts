"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { multiShiftHoursSchema } from "@/lib/validations/business-hours-multi";
import { parseMultiShiftHoursForm } from "@/lib/parse-multi-shift-hours-form";
import type { TablesInsert } from "@/lib/supabase/types";

type BusinessHourRow = TablesInsert<"business_hours">;

export type UpdateBusinessHoursState = { error?: string; success?: boolean } | undefined;

export async function updateBusinessHours(
  restaurantId: string,
  _prevState: UpdateBusinessHoursState,
  formData: FormData,
): Promise<UpdateBusinessHoursState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parsed = multiShiftHoursSchema.safeParse(parseMultiShiftHoursForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os horários informados." };
  }

  // Uma linha por turno, `position` = a ordem do turno dentro do dia (0 =
  // primeiro turno). Delete-e-insere as linhas do restaurante: mais simples
  // e igual de seguro que tentar casar upsert por (dia, turno), já que o
  // número de turnos por dia muda a cada salvamento.
  const rows: BusinessHourRow[] = parsed.data.flatMap((day): BusinessHourRow[] => {
    if (day.isClosed || day.shifts.length === 0) {
      return [
        {
          restaurant_id: restaurantId,
          day_of_week: day.dayOfWeek,
          opens_at: null,
          closes_at: null,
          is_closed: true,
          position: 0,
        },
      ];
    }

    return day.shifts.map((shift, position) => ({
      restaurant_id: restaurantId,
      day_of_week: day.dayOfWeek,
      opens_at: shift.opensAt,
      closes_at: shift.closesAt,
      is_closed: false,
      position,
    }));
  });

  // RPC atômica (delete+insert no mesmo transaction do lado do banco) — duas
  // chamadas PostgREST separadas deixavam uma janela em que, se o INSERT
  // falhasse logo depois do DELETE ter sido aplicado, o restaurante ficava
  // sem nenhuma linha de horário (isOpenNow() trata array vazio como
  // "sempre aberto"). RLS (business_hours_delete_owner/insert_owner)
  // continua valendo: a função roda `security invoker`, não ganha
  // privilégio extra.
  const { error } = await supabase.rpc("replace_business_hours", {
    p_restaurant_id: restaurantId,
    p_rows: rows,
  });

  if (error) {
    return { error: "Não foi possível salvar os horários. Tente novamente." };
  }

  revalidatePath("/app");
  revalidatePath("/app/horarios");
  return { success: true };
}
