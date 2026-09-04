"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

/**
 * Um único relógio pra aplicação inteira — um `setInterval` de 1s, não um
 * por componente (critério de aceite do painel de urgência: "existe um
 * único setInterval de 1s na aplicação inteira"). Cronômetros que dependem
 * do "agora" (anel de urgência, contagem de último pedido) leem daqui via
 * `useTicker()` em vez de abrir o próprio timer — evita dessincronia entre
 * eles (o anel andando meio segundo antes do número) e economiza bateria.
 *
 * `nowMs` muda a cada tick, então todo componente que chama `useTicker()`
 * re-renderiza a cada segundo — é o comportamento desejado (é um relógio).
 * Quem NÃO consome o context (a árvore inteira de `children` do provider)
 * não é afetado: `children` chega como prop estável, React não re-renderiza
 * o que não lê o valor do context.
 */
const TickerContext = createContext<number | null>(null);

// `getSnapshot` PRECISA devolver o mesmo valor até a próxima notificação —
// é o contrato do useSyncExternalStore, pra ele conseguir detectar "mudou
// de verdade" sem reexecutar a store. `Date.now()` direto aqui (a 1ª
// tentativa) quebra isso: cada chamada devolve um milissegundo diferente,
// então toda checagem de consistência do React "encontra uma mudança" e
// força outra renderização — que chama getSnapshot() de novo, encontra
// outra mudança, de novo... Com só este componente lendo a store, o
// trabalho entre duas chamadas é rápido o bastante pra ficar dentro do
// mesmo milissegundo e o problema não aparece; basta outro
// useSyncExternalStore no mesmo componente (ex.: o carrinho) somar
// trabalho suficiente pra cruzar a fronteira do milissegundo, e vira um
// loop que derruba a página com "Maximum update depth exceeded". Por
// isso o valor só muda dentro de `subscribe` (uma vez por tick real) e
// `getSnapshot` só lê essa variável, nunca chama Date.now() sozinho.
let cachedNowMs = Date.now();

function subscribe(callback: () => void): () => void {
  function tick() {
    cachedNowMs = Date.now();
    callback();
  }

  const interval = setInterval(tick, 1000);

  // Timers de aba em segundo plano são congelados pelo navegador — ao
  // voltar, resincroniza chamando tick() de novo em vez de confiar que o
  // setInterval "recuperou o atraso" sozinho (mesmo padrão de
  // StoreStatusCountdown.subscribeToClock).
  function onVisibilityChange() {
    if (!document.hidden) tick();
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

function getSnapshot(): number {
  return cachedNowMs;
}

// Sentinela fixo pro SSR/1ª pintura — nunca `Date.now()` real (divergiria
// do valor do cliente e quebraria a hidratação, como aconteceu com o
// relógio do PromotionCountdown). `0` é um primitivo, então é sempre
// referencialmente estável — sem o aviso de "getServerSnapshot deveria ser
// cacheado" que um objeto novo a cada chamada geraria.
function getServerSnapshot(): number {
  return 0;
}

export function TickerProvider({ children }: { children: ReactNode }) {
  const nowMs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return <TickerContext.Provider value={nowMs}>{children}</TickerContext.Provider>;
}

/** `nowMs` do relógio compartilhado. `0` até a 1ª sincronização no cliente
 * (mesmo instante em que `getCartSnapshot` troca do vazio de SSR pro
 * carrinho real) — quem usa deve tratar esse instante como "ainda não
 * sincronizado", nunca como um timestamp real de 1970. */
export function useTicker(): number {
  const value = useContext(TickerContext);
  if (value === null) {
    throw new Error("useTicker() precisa estar dentro de <TickerProvider> (ver AppShell).");
  }
  return value;
}
