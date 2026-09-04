import type { Order } from "./types";

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, Order[]>();

function storageKey(restaurantId: string): string {
  return `cardapio:orders:${restaurantId}`;
}

function readFromStorage(restaurantId: string): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notify(restaurantId: string): void {
  listeners.get(restaurantId)?.forEach((callback) => callback());
}

function writeToStorage(restaurantId: string, orders: Order[]): void {
  cache.set(restaurantId, orders);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(restaurantId), JSON.stringify(orders));
    } catch {
      // Ver cart/store.ts — mesmo raciocínio pra localStorage indisponível.
    }
  }
  notify(restaurantId);
}

export function getOrdersSnapshot(restaurantId: string): Order[] {
  if (!cache.has(restaurantId)) cache.set(restaurantId, readFromStorage(restaurantId));
  return cache.get(restaurantId)!;
}

export function getServerOrdersSnapshot(): Order[] {
  return [];
}

export function subscribeToOrders(restaurantId: string, callback: () => void): () => void {
  if (!listeners.has(restaurantId)) listeners.set(restaurantId, new Set());
  listeners.get(restaurantId)!.add(callback);

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

export function saveOrder(restaurantId: string, order: Order): void {
  const orders = getOrdersSnapshot(restaurantId);
  writeToStorage(restaurantId, [order, ...orders]);
}
