"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";

export type LoginActionState = { error?: string } | undefined;

export async function signIn(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os dados informados." };
  }

  // Duas travas: por IP (alguém tentando várias contas do mesmo lugar) e
  // por e-mail (alguém tentando UMA conta de vários lugares/proxies) — uma
  // sozinha não cobre os dois jeitos de força bruta.
  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(`login:ip:${ip}`, { limit: 10, windowSeconds: 600 }),
    checkRateLimit(`login:email:${parsed.data.email.toLowerCase()}`, { limit: 5, windowSeconds: 900 }),
  ]);

  if (!byIp.success || !byEmail.success) {
    return { error: rateLimitMessage(byIp.success ? byEmail.retryAfterSeconds : byIp.retryAfterSeconds) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect("/app");
}
