import Link from "next/link";
import { Settings, ExternalLink } from "lucide-react";
import { Greeting } from "./Greeting";
import { OpenStatusBadge } from "./OpenStatusBadge";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { TopBar } from "./TopBar";
import { hasValidBusinessHours, type BusinessHourRow } from "@/lib/business-hours";
import type { Tables } from "@/lib/supabase/types";

type Restaurant = Tables<"restaurants">;

interface DashboardShellProps {
  restaurant: Restaurant;
  ownerName: string | null;
  businessHours: BusinessHourRow[];
  hasActiveCategory: boolean;
  hasProduct: boolean;
}

/**
 * Painel mínimo: saudação, status aberto/fechado e o checklist de
 * onboarding. "Pedidos de hoje" e os atalhos (seção 10) entram quando
 * pedidos existirem de verdade — melhor não mostrar cartões vazios
 * fingindo dado real.
 */
export function DashboardShell({
  restaurant,
  ownerName,
  businessHours,
  hasActiveCategory,
  hasProduct,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar restaurantName={restaurant.name} />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-2">
          <Greeting name={ownerName} />
          <OpenStatusBadge businessHours={businessHours} />
        </div>

        <OnboardingChecklist
          hasValidBusinessHours={hasValidBusinessHours(businessHours)}
          hasActiveCategory={hasActiveCategory}
          hasProduct={hasProduct}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/app/configuracoes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground hover:bg-accent"
          >
            <Settings className="size-4" aria-hidden="true" />
            Configurações
          </Link>
          <a
            href={`/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground hover:bg-accent"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Ver cardápio público
          </a>
        </div>
      </main>
    </div>
  );
}
