import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { requireRestaurant } from "@/lib/restaurant-context";
import { PromotionsManager } from "./PromotionsManager";

export const metadata: Metadata = { title: "Promoções — Cardápio Digital" };

export default async function PromocoesPage() {
  const { supabase, restaurant } = await requireRestaurant();

  const [{ data: promotions }, { data: products }] = await Promise.all([
    supabase
      .from("promotions")
      .select("*, products(id, name)")
      .eq("restaurant_id", restaurant.id)
      .order("position", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Promoções</h1>
      <p className="mt-1 text-sm text-muted-foreground">{restaurant.name}</p>

      <div className="mt-6">
        <PromotionsManager promotions={promotions ?? []} products={products ?? []} />
      </div>
    </div>
  );
}
