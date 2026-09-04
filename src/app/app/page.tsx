import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = { title: "Painel — Cardápio Digital" };

export default async function AppPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("role, restaurants(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.restaurants) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Vamos colocar seu restaurante no ar 🚀
        </h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Leva menos de 2 minutos. Você pode ajustar tudo depois.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <OnboardingForm />
        </div>
      </div>
    );
  }

  const [{ data: businessHours }, { count: activeCategoriesCount }, { count: productsCount }] =
    await Promise.all([
      supabase
        .from("business_hours")
        .select("day_of_week, opens_at, closes_at, is_closed")
        .eq("restaurant_id", membership.restaurants.id),
      supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", membership.restaurants.id)
        .eq("is_active", true),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", membership.restaurants.id),
    ]);

  return (
    <DashboardShell
      restaurant={membership.restaurants}
      ownerName={(user.user_metadata?.full_name as string | undefined) ?? null}
      businessHours={businessHours ?? []}
      hasActiveCategory={(activeCategoriesCount ?? 0) > 0}
      hasProduct={(productsCount ?? 0) > 0}
    />
  );
}
