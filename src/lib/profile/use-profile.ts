"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRestaurantId } from "@/lib/store-context";
import { getProfileSnapshot, getServerProfileSnapshot, saveProfile, subscribeToProfile } from "./store";
import type { CustomerProfile } from "./types";

export function useProfile() {
  const restaurantId = useRestaurantId();

  const profile = useSyncExternalStore(
    useCallback((callback) => subscribeToProfile(restaurantId, callback), [restaurantId]),
    useCallback(() => getProfileSnapshot(restaurantId), [restaurantId]),
    getServerProfileSnapshot,
  );

  return {
    profile,
    save: (next: CustomerProfile) => saveProfile(restaurantId, next),
  };
}
