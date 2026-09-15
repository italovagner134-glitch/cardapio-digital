"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DIAS_DA_SEMANA } from "@/lib/validations/restaurant";
import type { DayShiftsInput } from "@/lib/validations/business-hours-multi";

interface MultiShiftHoursFieldsProps {
  defaultDays: DayShiftsInput[];
}

/**
 * Um card por dia da semana, cada um com 0+ turnos (almoço, jantar…) — cada
 * turno é um par opens_at/closes_at independente. Substitui, só nesta tela
 * (/app/horarios), a faixa única compartilhada do onboarding
 * (BusinessHoursFields) — ver o comentário em validations/restaurant.ts.
 */
export function MultiShiftHoursFields({ defaultDays }: MultiShiftHoursFieldsProps) {
  const [days, setDays] = useState<DayShiftsInput[]>(defaultDays);

  function setDay(dayOfWeek: number, next: DayShiftsInput) {
    setDays((prev) => prev.map((day) => (day.dayOfWeek === dayOfWeek ? next : day)));
  }

  function toggleClosed(day: DayShiftsInput, closed: boolean) {
    setDay(day.dayOfWeek, {
      ...day,
      isClosed: closed,
      shifts: closed ? [] : day.shifts.length > 0 ? day.shifts : [{ opensAt: "", closesAt: "" }],
    });
  }

  function addShift(day: DayShiftsInput) {
    setDay(day.dayOfWeek, { ...day, shifts: [...day.shifts, { opensAt: "", closesAt: "" }] });
  }

  function removeShift(day: DayShiftsInput, index: number) {
    setDay(day.dayOfWeek, { ...day, shifts: day.shifts.filter((_, i) => i !== index) });
  }

  function updateShift(day: DayShiftsInput, index: number, field: "opensAt" | "closesAt", value: string) {
    setDay(day.dayOfWeek, {
      ...day,
      shifts: day.shifts.map((shift, i) => (i === index ? { ...shift, [field]: value } : shift)),
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {days.map((day) => (
        <div key={day.dayOfWeek} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-card-foreground">{DIAS_DA_SEMANA[day.dayOfWeek]}</p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Fechado
              <Switch
                name={`closed-${day.dayOfWeek}`}
                checked={day.isClosed}
                onCheckedChange={(checked) => toggleClosed(day, checked)}
              />
            </label>
          </div>

          {!day.isClosed && (
            <div className="mt-3 flex flex-col gap-2">
              {day.shifts.map((shift, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="time"
                    name={`opensAt-${day.dayOfWeek}`}
                    value={shift.opensAt}
                    onChange={(e) => updateShift(day, index, "opensAt", e.target.value)}
                    required
                    aria-label={`${DIAS_DA_SEMANA[day.dayOfWeek]}, turno ${index + 1}, abre às`}
                  />
                  <span className="text-sm text-muted-foreground">até</span>
                  <Input
                    type="time"
                    name={`closesAt-${day.dayOfWeek}`}
                    value={shift.closesAt}
                    onChange={(e) => updateShift(day, index, "closesAt", e.target.value)}
                    required
                    aria-label={`${DIAS_DA_SEMANA[day.dayOfWeek]}, turno ${index + 1}, fecha às`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover turno"
                    onClick={() => removeShift(day, index)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start text-primary"
                onClick={() => addShift(day)}
              >
                <Plus className="size-3.5" /> Adicionar turno
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
