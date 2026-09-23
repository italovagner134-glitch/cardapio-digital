import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Sobrescreve os padrões do @supabase/ssr pro cookie de sessão — os
 * padrões da lib (DEFAULT_COOKIE_OPTIONS) são `httpOnly: false` e
 * `maxAge: 400 dias`, pensados pra cobrir o caso geral da lib, não pra
 * este produto:
 *
 * - `httpOnly: false` deixa o token de sessão legível por qualquer script
 *   rodando na página — se algum dia entrar um XSS, ele lê o cookie
 *   direto. Forçamos `true`. (Seguro aqui: o cliente browser do Supabase,
 *   src/lib/supabase/client.ts, não tem uso nenhum no projeto hoje — nada
 *   depende de ler esse cookie via JS.)
 * - `secure: true` só em produção — força HTTPS, mas em `secure: true`
 *   sem essa condição o cookie nunca seria salvo em `next dev` local
 *   (HTTP), quebrando login em desenvolvimento.
 * - `maxAge` de 400 dias pra 7 — reduz bastante a janela de um cookie
 *   roubado continuar valendo, sem forçar o dono a logar de novo toda
 *   hora (é um painel de restaurante, não banco — 7 dias é um equilíbrio
 *   razoável; ajuste aqui se quiser mais curto).
 * - `sameSite: "lax"` já era o padrão da lib — mantido, é a proteção
 *   certa contra CSRF sem quebrar o redirect do fluxo de login.
 */
export const SESSION_COOKIE_OPTIONS: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 dias
};
