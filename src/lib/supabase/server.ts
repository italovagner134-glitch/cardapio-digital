import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { SESSION_COOKIE_OPTIONS } from "./cookie-options";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Cada chamada lê os cookies da requisição atual — nunca reutilize
 * uma instância entre requisições.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita — o
            // middleware já cuida de renovar a sessão nesse caso.
          }
        },
      },
    },
  );
}
