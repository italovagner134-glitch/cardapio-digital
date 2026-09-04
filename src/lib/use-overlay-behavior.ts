"use client";

import { useEffect, useRef } from "react";
import { useBodyScrollLock } from "./use-body-scroll-lock";

/** Plumbing comum de overlay em tela cheia (InfoSheet, MenuDrawer, o
 * mini-sheet de apps de mapa): trava o scroll do body, fecha com Esc, foca o
 * painel ao abrir e devolve o foco pro elemento que abriu ao fechar/
 * desmontar (Parte 4: "role=dialog aria-modal=true" + devolução de foco). */
export function useOverlayBehavior(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  return { panelRef };
}
