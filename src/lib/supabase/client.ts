import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Cliente Supabase para uso em componentes client ("use client"). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
