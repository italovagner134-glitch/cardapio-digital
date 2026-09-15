import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EditBusinessHoursForm } from "@/components/business-hours/EditBusinessHoursForm";
import type { DayShiftsInput } from "@/lib/validations/business-hours-multi";

export const metadata: Metadata = { title: "Horários — Cardápio Digital" };

export default async function HorariosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("restaurant_users")
    .select("role, restaurants(id, name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.restaurants) {
    redirect("/app");
  }

  const { data: businessHours } = await supabase
    .from("business_hours")
    .select("day_of_week, opens_at, closes_at, is_closed, position")
    .eq("restaurant_id", membership.restaurants.id)
    .order("day_of_week", { ascending: true })
    .order("position", { ascending: true });

  const rows = businessHours ?? [];
  const defaultDays: DayShiftsInput[] = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const dayRows = rows.filter((row) => row.day_of_week === dayOfWeek);
    const isClosed = dayRows.length === 0 || dayRows.every((row) => row.is_closed);

    return {
      dayOfWeek,
      isClosed,
      shifts: isClosed
        ? []
        : dayRows
            .filter((row) => !row.is_closed && row.opens_at && row.closes_at)
            .map((row) => ({ opensAt: row.opens_at!.slice(0, 5), closesAt: row.closes_at!.slice(0, 5) })),
    };
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>

      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
        Horários de funcionamento
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{membership.restaurants.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Cada dia pode ter mais de um turno — útil pra quem fecha na hora do almoço e reabre à noite.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        {membership.role === "owner" ? (
          <EditBusinessHoursForm restaurantId={membership.restaurants.id} defaultDays={defaultDays} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Só o dono do restaurante pode alterar os horários. Peça para ele fazer essa mudança.
          </p>
        )}
      </div>
    </div>
  );
}
