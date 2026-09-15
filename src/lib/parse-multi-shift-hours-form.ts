import { DIAS_DA_SEMANA } from "@/lib/validations/restaurant";
import type { DayShiftsInput } from "@/lib/validations/business-hours-multi";

/**
 * `opensAt-{dia}` e `closesAt-{dia}` são reaproveitados por N pares de
 * inputs (um por turno) — múltiplos inputs com o mesmo `name` chegam em
 * ordem no FormData, então `getAll` já devolve os turnos daquele dia na
 * ordem em que o MultiShiftHoursFields os renderizou, sem precisar de
 * índice explícito no nome do campo.
 *
 * `isClosed` vem do próprio switch "Fechado" (`closed-{dia}`), não de
 * `shifts.length === 0` — inferir do array vazio conflitava "marcado como
 * fechado" com "removeu o último turno sem marcar fechado", e nesse segundo
 * caso o dia salvava fechado em silêncio, sem a pessoa ter pedido isso (o
 * refine de dayShiftsSchema que devia barrar esse caso nunca disparava,
 * porque `isClosed` já vinha `true` antes da validação rodar).
 */
export function parseMultiShiftHoursForm(formData: FormData): DayShiftsInput[] {
  return DIAS_DA_SEMANA.map((_, dayOfWeek) => {
    const opens = formData.getAll(`opensAt-${dayOfWeek}`).map(String);
    const closes = formData.getAll(`closesAt-${dayOfWeek}`).map(String);
    const shifts = opens.map((opensAt, i) => ({ opensAt, closesAt: closes[i] ?? "" }));
    const isClosed = formData.get(`closed-${dayOfWeek}`) === "on";

    return { dayOfWeek, isClosed, shifts };
  });
}
