import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
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

/**
 * `requireRestaurant()` + rate limit — só pra ações que CRIAM registro
 * novo (categoria, promoção, produto). Fica separado de `requireRestaurant`
 * de propósito: aquele também gate toda página do painel, e limitar
 * navegação normal (abrir /app/categorias várias vezes) não faz sentido —
 * aqui é só o clique real de "criar", que uma sessão comprometida/script
 * poderia usar pra inundar o cardápio público de registro falso.
 *
 * `rateLimited` fica pro chamador decidir como mostrar o erro — cada
 * action tem seu próprio formato de ActionState, então este helper não
 * tenta devolver um `{error}` genérico.
 */
export async function requireRestaurantForCreate(
  kind: string,
): Promise<RestaurantMembership & { rateLimited: boolean }> {
  const membership = await requireRestaurant();

  const { success } = await checkRateLimit(`create-${kind}:user:${membership.restaurant.id}`, {
    limit: 20,
    windowSeconds: 60,
  });

  return { ...membership, rateLimited: !success };
}
