import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireRestaurant } from "@/lib/restaurant-context";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Configurações — Cardápio Digital" };

export default async function ConfiguracoesPage() {
  const { supabase, restaurant } = await requireRestaurant();

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">{restaurant.name}</p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
