import { EMPTY_PROFILE, type CustomerProfile } from "./types";

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, CustomerProfile>();

function storageKey(restaurantId: string): string {
  return `cardapio:profile:${restaurantId}`;
}

function readFromStorage(restaurantId: string): CustomerProfile {
  if (typeof window === "undefined") return EMPTY_PROFILE;
  try {
    const raw = window.localStorage.getItem(storageKey(restaurantId));
    if (!raw) return EMPTY_PROFILE;
    const parsed = JSON.parse(raw) as Partial<CustomerProfile>;
    return { ...EMPTY_PROFILE, ...parsed };
  } catch {
    return EMPTY_PROFILE;
  }
}

function notify(restaurantId: string): void {
  listeners.get(restaurantId)?.forEach((callback) => callback());
}

function writeToStorage(restaurantId: string, profile: CustomerProfile): void {
  cache.set(restaurantId, profile);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(storageKey(restaurantId), JSON.stringify(profile));
    } catch {
      // Ver cart/store.ts.
    }
  }
  notify(restaurantId);
}

export function getProfileSnapshot(restaurantId: string): CustomerProfile {
  if (!cache.has(restaurantId)) cache.set(restaurantId, readFromStorage(restaurantId));
  return cache.get(restaurantId)!;
}

export function getServerProfileSnapshot(): CustomerProfile {
  return EMPTY_PROFILE;
}

export function subscribeToProfile(restaurantId: string, callback: () => void): () => void {
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

export function saveProfile(restaurantId: string, profile: CustomerProfile): void {
  writeToStorage(restaurantId, profile);
}
