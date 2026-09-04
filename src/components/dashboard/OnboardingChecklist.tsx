import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistItem {
  label: string;
  done: boolean;
  href?: string;
}

interface OnboardingChecklistProps {
  /** Verdadeiro só se existir pelo menos um dia realmente aberto com horário
   * válido — ver `hasValidBusinessHours`. Uma tabela cheia de "fechado o
   * tempo todo" não conta como horário configurado. */
  hasValidBusinessHours: boolean;
  hasActiveCategory: boolean;
  hasProduct: boolean;
}

/** Só marca como concluído o que já existe de verdade. */
export function OnboardingChecklist({
  hasValidBusinessHours,
  hasActiveCategory,
  hasProduct,
}: OnboardingChecklistProps) {
  const items: ChecklistItem[] = [
    { label: "Informações básicas", done: true },
    { label: "Categorias", done: hasActiveCategory, href: "/app/categorias" },
    { label: "Produtos", done: hasProduct, href: "/app/produtos" },
    { label: "Horários", done: hasValidBusinessHours, href: "/app/horarios" },
    // QR Code "concluído" = cardápio público já tem conteúdo pra mostrar.
    { label: "QR Code", done: hasProduct, href: "/app/qrcode" },
  ];

  const doneCount = items.filter((item) => item.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-card-foreground">
          Seu restaurante está quase pronto
        </h2>
        <span className="font-mono text-sm text-muted-foreground">{percent}%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) => {
          const row = (
            <>
              {item.done ? (
                <CheckCircle2 className="size-4 text-manjericao-600" aria-hidden="true" />
              ) : (
                <Circle className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
              <span className={item.done ? "text-card-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
              {!item.done && !item.href && (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Em breve
                </span>
              )}
              {item.href && (
                <span className="ml-auto text-xs text-primary underline underline-offset-2">
                  {item.done ? "Editar" : "Configurar"}
                </span>
              )}
            </>
          );

          return (
            <li key={item.label} className="flex items-center gap-2.5 text-sm">
              {item.href ? (
                <Link href={item.href} className="flex flex-1 items-center gap-2.5">
                  {row}
                </Link>
              ) : (
                row
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
