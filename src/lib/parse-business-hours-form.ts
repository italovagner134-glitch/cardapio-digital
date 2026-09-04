import { DIAS_DA_SEMANA, type BusinessHourInput } from "@/lib/validations/restaurant";

/**
 * Lê os campos do BusinessHoursFields (uma faixa compartilhada + os dias
 * marcados como "de funcionamento") e monta as 7 linhas por dia que o
 * schema/RPC esperam. Compartilhado entre o onboarding e a edição de
 * horários — nunca duplicar essa leitura.
 */
export function parseBusinessHoursFromForm(formData: FormData): BusinessHourInput[] {
  const openDays = formData.getAll("openDays").map(Number);
  const sharedOpensAt = String(formData.get("opensAt") ?? "");
  const sharedClosesAt = String(formData.get("closesAt") ?? "");

  return DIAS_DA_SEMANA.map((_, dayOfWeek) => {
    const isClosed = !openDays.includes(dayOfWeek);
    return {
      dayOfWeek,
      isClosed,
      opensAt: isClosed ? "" : sharedOpensAt,
      closesAt: isClosed ? "" : sharedClosesAt,
    };
  });
}
