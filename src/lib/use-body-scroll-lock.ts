"use client";

import { useEffect } from "react";

/** Trava o scroll do body enquanto um overlay em tela cheia estiver aberto
 * (InfoSheet, MenuDrawer) — só mexe no DOM, não em state, então não esbarra
 * na regra de "não chamar setState em efeito". */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
}
