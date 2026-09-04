import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DIAS_DA_SEMANA } from "@/lib/validations/restaurant";

const DIA_ABREVIADO = ["D", "S", "T", "Q", "Q", "S", "S"];

interface BusinessHoursFieldsProps {
  defaultOpensAt?: string;
  defaultClosesAt?: string;
  /** Dias considerados abertos ao carregar o formulário. Padrão: todos. */
  defaultOpenDays?: number[];
}

/**
 * Horário simplificado: uma faixa única aplicada a todos os dias marcados
 * como "de funcionamento". Os chips seguem a convenção universal de
 * seletor de recorrência (ex.: "repetir em: D S T Q Q S S") — marcam os
 * dias em que o restaurante ABRE, não os dias fechados. Todos vêm marcados
 * por padrão: se o dono não mexer em nada, o resultado seguro é "aberto
 * todo dia", nunca "fechado todo dia".
 */
export function BusinessHoursFields({
  defaultOpensAt = "",
  defaultClosesAt = "",
  defaultOpenDays = [0, 1, 2, 3, 4, 5, 6],
}: BusinessHoursFieldsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="opensAt">Abre às</Label>
          <Input id="opensAt" name="opensAt" type="time" defaultValue={defaultOpensAt} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="closesAt">Fecha às</Label>
          <Input
            id="closesAt"
            name="closesAt"
            type="time"
            defaultValue={defaultClosesAt}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Dias de funcionamento</Label>
        <div className="flex flex-wrap gap-3">
          {DIAS_DA_SEMANA.map((dia, index) => (
            <label
              key={dia}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent"
            >
              <Checkbox
                name="openDays"
                value={String(index)}
                defaultChecked={defaultOpenDays.includes(index)}
                aria-label={dia}
              />
              <span>{DIA_ABREVIADO[index]}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Desmarque os dias em que o restaurante não abre.
        </p>
      </div>
    </div>
  );
}
