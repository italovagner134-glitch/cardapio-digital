"use client";

import { useRef } from "react";

const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE_PX = 10;

/**
 * Distingue toque rápido de toque longo num mesmo elemento (Parte 2.2:
 * "toque longo no chip" abre a página da categoria, toque curto rola até a
 * seção). Cancela se o dedo mover mais que MOVE_TOLERANCE_PX (é um scroll,
 * não um long-press) ou se soltar antes do tempo (vira onPress normal).
 */
export function useLongPress(onPress: () => void, onLongPress: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedLongPressRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  }

  function handleStart(x: number, y: number) {
    firedLongPressRef.current = false;
    startRef.current = { x, y };
    timerRef.current = setTimeout(() => {
      firedLongPressRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function handleMove(x: number, y: number) {
    if (!startRef.current) return;
    const dx = Math.abs(x - startRef.current.x);
    const dy = Math.abs(y - startRef.current.y);
    if (dx > MOVE_TOLERANCE_PX || dy > MOVE_TOLERANCE_PX) clear();
  }

  function handleEnd() {
    const wasLongPress = firedLongPressRef.current;
    clear();
    if (!wasLongPress) onPress();
  }

  return {
    onPointerDown: (event: React.PointerEvent) => handleStart(event.clientX, event.clientY),
    onPointerMove: (event: React.PointerEvent) => handleMove(event.clientX, event.clientY),
    onPointerUp: handleEnd,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
}
