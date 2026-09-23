import type { NextConfig } from "next";

// Fallback pro projeto Supabase de demonstração (Cida Lanche) — só as
// chaves PÚBLICAS (anon/publishable, feitas pra ir no bundle do cliente,
// nunca a service role). Cobre o deploy do Vercel enquanto as env vars não
// são configuradas lá; se `NEXT_PUBLIC_SUPABASE_URL`/`..._PUBLISHABLE_KEY`
// estiverem definidas no ambiente (produção "de verdade", outro
// restaurante), elas têm prioridade — o fallback nunca sobrescreve.
const DEMO_SUPABASE_URL = "https://jurbkjrqduclyawofjnb.supabase.co";
const DEMO_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_BVFykAGOdG7pnRb8_VshMg_Kvegf7gy";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEMO_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? DEMO_SUPABASE_PUBLISHABLE_KEY;
const supabaseHostname = new URL(supabaseUrl).hostname;

/**
 * Cabeçalhos de segurança, checados contra o app de verdade (não é um
 * bloco genérico colado): nenhum componente usa <script>/onclick inline
 * (nem a página estática em public/cardapio-estatico — só <style>), então
 * script-src fica sem 'unsafe-inline'/'unsafe-eval' em produção — só em dev
 * o Next precisa de eval pro Fast Refresh. next/font já auto-hospeda as
 * fontes (nenhuma chamada a fonts.googleapis.com em runtime). connect-src
 * inclui o host do Supabase pro cliente browser (src/lib/supabase/client.ts
 * existe pra isso, mesmo sem uso hoje — sem essa liberação, o primeiro
 * componente client que chamar Supabase direto do navegador quebraria
 * sem aviso nenhum, só um erro de CSP no console).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname}`,
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  },
  experimental: {
    serverActions: {
      // Teto do REQUEST inteiro, antes até de qualquer validação de
      // arquivo rodar (src/lib/uploads.ts) — maior upload aceito é vídeo de
      // capa (10MB); a folga cobre o overhead do multipart/os outros campos
      // do mesmo formulário.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
