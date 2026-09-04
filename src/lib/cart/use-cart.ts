"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useRestaurantId } from "@/lib/store-context";
import {
  addToCart,
  clearCart,
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  restoreCartItem,
  subscribeToCart,
  updateCartQuantity,
} from "./store";
import type { CartItem } from "./types";

export function useCart() {
  const restaurantId = useRestaurantId();

  const state = useSyncExternalStore(
    useCallback((callback) => subscribeToCart(restaurantId, callback), [restaurantId]),
    useCallback(() => getCartSnapshot(restaurantId), [restaurantId]),
    useCallback(() => getServerCartSnapshot(restaurantId), [restaurantId]),
  );

  const count = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = state.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

  return {
    items: state.items,
    count,
    subtotalCents,
    addItem: (input: Omit<CartItem, "lineId" | "quantity"> & { quantity: number }) => addToCart(restaurantId, input),
    updateQuantity: (lineId: string, quantity: number) => updateCartQuantity(restaurantId, lineId, quantity),
    removeItem: (lineId: string) => removeCartItem(restaurantId, lineId),
    restoreItem: (item: CartItem) => restoreCartItem(restaurantId, item),
    clear: () => clearCart(restaurantId),
  };
}
