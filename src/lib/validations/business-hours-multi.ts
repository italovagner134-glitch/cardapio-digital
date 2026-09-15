import { z } from "zod";
import { TIME_REGEX } from "@/lib/validations/restaurant";

/**
 * Edição de horários no painel (Fase 3, item 4) — ao contrário do contrato
 * simplificado do onboarding (validations/restaurant.ts, 1 faixa pro dia
 * inteiro), aqui cada dia aceita 0+ turnos (almoço, jantar…), cada um com o
 * próprio opens_at/closes_at — mesmo modelo que a tabela `business_hours` já
 * suporta via `position` (ver Prompt 03 / auditoria M-item "horários com
 * múltiplos turnos").
 */
const shiftSchema = z
  .object({
    opensAt: z.string().regex(TIME_REGEX, "Horário inválido."),
    closesAt: z.string().regex(TIME_REGEX, "Horário inválido."),
  })
  .refine((shift) => shift.opensAt < shift.closesAt, {
    message: "O horário de abertura precisa ser antes do de fechamento.",
    path: ["closesAt"],
  });

export const dayShiftsSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isClosed: z.boolean(),
    shifts: z.array(shiftSchema),
  })
  .refine((day) => day.isClosed || day.shifts.length > 0, {
    message: "Adicione pelo menos um turno ou marque o dia como fechado.",
    path: ["shifts"],
  })
  .refine(
    (day) => {
      if (day.shifts.length < 2) return true;
      const sorted = [...day.shifts].sort((a, b) => a.opensAt.localeCompare(b.opensAt));
      return sorted.every((shift, i) => i === 0 || shift.opensAt >= sorted[i - 1].closesAt);
    },
    { message: "Os turnos desse dia não podem se sobrepor.", path: ["shifts"] },
  );

export const multiShiftHoursSchema = z.array(dayShiftsSchema).length(7);

export type ShiftInput = z.infer<typeof shiftSchema>;
export type DayShiftsInput = z.infer<typeof dayShiftsSchema>;
