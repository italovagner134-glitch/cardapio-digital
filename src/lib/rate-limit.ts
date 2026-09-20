import { headers } from "next/headers";

/**
 * Proteção contra força bruta/spam nos pontos sensíveis (login, cadastro,
 * escrita no painel, ações públicas do carrinho).
 *
 * Serverless não tem memória compartilhada entre instâncias — um limitador
 * em memória sozinho pode ser burlado por quem bate em instâncias
 * diferentes. Por isso: se `UPSTASH_REDIS_REST_URL`/`_TOKEN` existirem
 * (Vercel Marketplace → Upstash for Redis, gratuito, alguns cliques),
 * usamos um sliding window de verdade, com contagem certa entre todas as
 * instâncias. Sem essas env vars, cai pro limitador em memória abaixo —
 * pior caso possível é "só protege dentro da mesma instância", nunca
 * "sem proteção nenhuma" — e o login/cadastro continuam com o rate limit
 * próprio do Supabase Auth por baixo, que já é persistente de verdade.
 */

interface RateLimitResult {
  success: boolean;
  /** Segundos até a janela liberar de novo, só quando `success` é false. */
  retryAfterSeconds?: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, WindowEntry>();

// Limpa entradas vencidas de vez em quando pra não vazar memória ao longo
// da vida da instância (evict lazy, sem setInterval — nada roda "wall clock"
// à toa numa função serverless que pode nunca mais ser chamada).
function pruneMemoryStore(now: number) {
  if (memoryStore.size < 500) return;
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

function checkMemoryWindow(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  pruneMemoryStore(now);

  const entry = memoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { success: true };
}

// Import dinâmico: os pacotes @upstash/* só entram no bundle se as env vars
// existirem; sem elas, nem tentamos carregar/instanciar cliente nenhum.
let upstashLimiterCache: Promise<unknown> | null = null;

async function getUpstashLimiter(limit: number, windowSeconds: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const cacheKey = `${limit}:${windowSeconds}`;
  if (!upstashLimiterCache) {
    upstashLimiterCache = (async () => {
      const [{ Ratelimit }, { Redis }] = await Promise.all([
        import("@upstash/ratelimit"),
        import("@upstash/redis"),
      ]);
      const redis = new Redis({ url, token });
      const limiters = new Map<string, InstanceType<typeof Ratelimit>>();
      return { Ratelimit, redis, limiters };
    })();
  }

  const { Ratelimit, redis, limiters } = (await upstashLimiterCache) as {
    Ratelimit: typeof import("@upstash/ratelimit").Ratelimit;
    redis: import("@upstash/redis").Redis;
    limiters: Map<string, InstanceType<typeof import("@upstash/ratelimit").Ratelimit>>;
  };

  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: "cardapio-ratelimit",
    });
    limiters.set(cacheKey, limiter);
  }

  return limiter;
}

/**
 * `key` identifica QUEM está sendo limitado (ex.: `login:ip:<ip>` ou
 * `promo:user:<userId>`) — sempre prefixado por contexto pra uma mesma
 * pessoa não compartilhar contador entre ações diferentes.
 */
export async function checkRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number },
): Promise<RateLimitResult> {
  const upstash = await getUpstashLimiter(limit, windowSeconds);

  if (upstash) {
    const result = await (upstash as InstanceType<typeof import("@upstash/ratelimit").Ratelimit>).limit(key);
    return {
      success: result.success,
      retryAfterSeconds: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
    };
  }

  return checkMemoryWindow(key, limit, windowSeconds * 1000);
}

/** IP de quem fez a requisição atual — `x-forwarded-for` é o cabeçalho que
 * a Vercel preenche de verdade; fallback pra `unknown` em dev local onde
 * nenhum proxy define isso (nunca falha a ação por não achar IP). */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Mensagem padrão pra devolver no estado de erro de qualquer form action
 * quando `checkRateLimit` bloqueia. */
export function rateLimitMessage(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds || retryAfterSeconds < 60) {
    return "Muitas tentativas em pouco tempo. Espere um minuto e tente de novo.";
  }
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Muitas tentativas em pouco tempo. Espere ${minutes} min e tente de novo.`;
}
