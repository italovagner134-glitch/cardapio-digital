"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { businessHourSchema } from "@/lib/validations/restaurant";
import { parseBusinessHoursFromForm } from "@/lib/parse-business-hours-form";

export type UpdateBusinessHoursState = { error?: string; success?: boolean } | undefined;

const businessHoursArraySchema = z.array(businessHourSchema).length(7);

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

  const parsed = businessHoursArraySchema.safeParse(parseBusinessHoursFromForm(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os horários informados." };
  }

  const rows = parsed.data.map((hour) => ({
    restaurant_id: restaurantId,
    day_of_week: hour.dayOfWeek,
    opens_at: hour.isClosed ? null : hour.opensAt,
    closes_at: hour.isClosed ? null : hour.closesAt,
    is_closed: hour.isClosed,
    position: 0,
  }));

  // A tabela agora aceita mais de um turno por dia (almoço + jantar — Fase
  // 3/Parte 4.2), então não existe mais uma unique só em
  // (restaurant_id, day_of_week) pra fazer upsert em cima. Este formulário
  // ainda edita só um turno por dia (campo único opensAt/closesAt
  // compartilhado — ver parseBusinessHoursFromForm), então delete-e-insere
  // as 7 linhas do zero é equivalente e mais simples que tentar simular
  // upsert por (dia, turno). TODO: quando o painel ganhar edição de múltiplos
  // turnos por dia, este action precisa aceitar N linhas por dia em vez de
  // sempre regravar exatamente 7.
  // RLS (business_hours_delete_owner/insert_owner) garante que só o owner
  // deste restaurante consegue gravar — não confiamos só na tela.
  const { error: deleteError } = await supabase
    .from("business_hours")
    .delete()
    .eq("restaurant_id", restaurantId);

  if (deleteError) {
    return { error: "Não foi possível salvar os horários. Tente novamente." };
  }

  const { error: insertError } = await supabase.from("business_hours").insert(rows);

  if (insertError) {
    return { error: "Não foi possível salvar os horários. Tente novamente." };
  }

  revalidatePath("/app");
  revalidatePath("/app/horarios");
  return { success: true };
}
