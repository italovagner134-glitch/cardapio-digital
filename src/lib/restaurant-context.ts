import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables, Enums } from "@/lib/supabase/types";

export interface RestaurantMembership {
  supabase: Awaited<ReturnType<typeof createClient>>;
  restaurant: Tables<"restaurants">;
  role: Enums<"restaurant_role">;
}

/**
 * Busca o restaurante do usuário logado. Redireciona para /login (sem
 * sessão) ou /app (sem restaurante ainda — precisa terminar o onboarding).
 * Reutilizado por todas as telas do painel que dependem de um restaurante
 * já existir.
 */
export async function requireRestaurant(): Promise<RestaurantMembership> {
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
    redirect("/app");
  }

  return { supabase, restaurant: membership.restaurants, role: membership.role };
}
