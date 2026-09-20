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

const nextConfig: NextConfig = {
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
