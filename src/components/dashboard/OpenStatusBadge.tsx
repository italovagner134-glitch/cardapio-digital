import { isOpenNow, type BusinessHourRow } from "@/lib/business-hours";

interface OpenStatusBadgeProps {
  businessHours: BusinessHourRow[];
}

/**
 * Calculado no fuso fixo America/Sao_Paulo (ver lib/business-hours), não no
 * relógio de quem está olhando — por isso pode ser um componente de
 * servidor: servidor e cliente sempre concordam no resultado.
 */
export function OpenStatusBadge({ businessHours }: OpenStatusBadgeProps) {
  const open = isOpenNow(businessHours);

  if (open === null) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        Horário não configurado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium">
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${open ? "bg-manjericao-600" : "bg-destructive"}`}
      />
      {open ? (
        <span className="text-manjericao-600">Restaurante aberto</span>
      ) : (
        <span className="text-destructive">Fechado agora</span>
      )}
    </span>
  );
}
