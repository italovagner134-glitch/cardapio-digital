"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRestaurantId } from "@/lib/store-context";
import { getOrdersSnapshot, getServerOrdersSnapshot, saveOrder, subscribeToOrders } from "./store";
import type { Order } from "./types";

export function useOrders() {
  const restaurantId = useRestaurantId();

  const orders = useSyncExternalStore(
    useCallback((callback) => subscribeToOrders(restaurantId, callback), [restaurantId]),
    useCallback(() => getOrdersSnapshot(restaurantId), [restaurantId]),
    getServerOrdersSnapshot,
  );

  return {
    orders,
    save: (order: Omit<Order, "id" | "restaurantId" | "createdAt" | "status">) =>
      saveOrder(restaurantId, {
        ...order,
        id: crypto.randomUUID(),
        restaurantId,
        createdAt: new Date().toISOString(),
        status: "enviado",
      }),
  };
}
