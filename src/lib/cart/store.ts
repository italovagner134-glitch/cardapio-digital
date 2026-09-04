import type { CartItem, CartState } from "./types";

/**
 * Motor do carrinho — sem React, só localStorage + pub/sub. `useCart()` (em
 * use-cart.ts) expõe isso via useSyncExternalStore. Fica em módulo separado
 * pra dar pra testar a lógica de merge/quantidade isolada, sem montar
 * componente nenhum (mesmo espírito dos testes de business-hours.ts).
 */

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, CartState>();

function storageKey(restaurantId: string): string {
  return `cardapio:cart:${restaurantId}`;
}

function readFromStorage(restaurantId: string): CartState {
  if (typeof window === "undefined") return { restaurantId, items: [] };
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantId));
    if (!raw) return { restaurantId, items: [] };
    const parsed = JSON.parse(raw) as Partial<CartState>;
    return { restaurantId, items: Array.isArray(parsed.items) ? parsed.items : [] };
  } catch {
    return { restaurantId, items: [] };
  }
}

function notify(restaurantId: string): void {
  listeners.get(restaurantId)?.forEach((callback) => callback());
}

function writeToStorage(restaurantId: string, state: CartState): void {
  cache.set(restaurantId, state);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(restaurantId), JSON.stringify(state));
    } catch {
      // localStorage indisponível (aba anônima cheia, storage desligado...)
      // — o carrinho segue funcionando só na aba atual, em memória.
    }
  }
  notify(restaurantId);
}

export function getCartSnapshot(restaurantId: string): CartState {
  if (!cache.has(restaurantId)) cache.set(restaurantId, readFromStorage(restaurantId));
  return cache.get(restaurantId)!;
}

const emptySnapshotCache = new Map<string, CartState>();

/** Snapshot do servidor (SSR/1ª pintura do cliente) — sempre vazio, pra
 * nunca divergir entre servidor e cliente (mesmo motivo do StoreCover). O
 * carrinho real aparece um instante depois de montar, quando o
 * useSyncExternalStore troca pro snapshot de verdade.
 *
 * Precisa devolver a MESMA referência a cada chamada pro mesmo
 * restaurantId — devolver um objeto novo toda vez (como era antes) faz o
 * React achar que "o snapshot do servidor mudou entre uma checagem e
 * outra" sempre que mais de um componente chama useCart() na mesma
 * página (StickyCartBar, BottomNav, UrgencyPanelLive...), o que gera o
 * aviso "getServerSnapshot should be cached" e, com consumidores demais,
 * pode virar de fato um loop de re-render. */
export function getServerCartSnapshot(restaurantId: string): CartState {
  if (!emptySnapshotCache.has(restaurantId)) {
    emptySnapshotCache.set(restaurantId, { restaurantId, items: [] });
  }
  return emptySnapshotCache.get(restaurantId)!;
}

export function subscribeToCart(restaurantId: string, callback: () => void): () => void {
  if (!listeners.has(restaurantId)) listeners.set(restaurantId, new Set());
  listeners.get(restaurantId)!.add(callback);

  // Sincroniza entre abas do mesmo navegador (o evento `storage` só dispara
  // nas OUTRAS abas, nunca na que escreveu — por isso writeToStorage chama
  // notify() direto, sem depender deste listener, pra atualizar a própria aba).
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey(restaurantId)) {
      cache.delete(restaurantId);
      callback();
    }
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.get(restaurantId)?.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function lineIdOf(productId: string, selections: CartItem["selections"], note: string): string {
  const signature = [...selections]
    .map((s) => s.optionId)
    .sort()
    .join(",");
  return `${productId}::${signature}::${note.trim()}`;
}

export function addToCart(restaurantId: string, input: Omit<CartItem, "lineId" | "quantity"> & { quantity: number }): void {
  const state = getCartSnapshot(restaurantId);
  const lineId = lineIdOf(input.productId, input.selections, input.note);
  const existing = state.items.find((item) => item.lineId === lineId);

  const items = existing
    ? state.items.map((item) =>
        item.lineId === lineId ? { ...item, quantity: item.quantity + input.quantity } : item,
      )
    : [...state.items, { ...input, lineId }];

  writeToStorage(restaurantId, { restaurantId, items });
}

export function updateCartQuantity(restaurantId: string, lineId: string, quantity: number): void {
  const state = getCartSnapshot(restaurantId);
  const items =
    quantity <= 0
      ? state.items.filter((item) => item.lineId !== lineId)
      : state.items.map((item) => (item.lineId === lineId ? { ...item, quantity } : item));
  writeToStorage(restaurantId, { restaurantId, items });
}

export function removeCartItem(restaurantId: string, lineId: string): void {
  updateCartQuantity(restaurantId, lineId, 0);
}

/** Reinsere uma linha removida — usado pelo "Desfazer" do toast de remoção.
 * Não empilha em cima de uma linha igual que já tenha voltado a existir. */
export function restoreCartItem(restaurantId: string, item: CartItem): void {
  const state = getCartSnapshot(restaurantId);
  if (state.items.some((i) => i.lineId === item.lineId)) return;
  writeToStorage(restaurantId, { restaurantId, items: [...state.items, item] });
}

export function replaceCartItems(restaurantId: string, items: CartItem[]): void {
  writeToStorage(restaurantId, { restaurantId, items });
}

export function clearCart(restaurantId: string): void {
  writeToStorage(restaurantId, { restaurantId, items: [] });
}
