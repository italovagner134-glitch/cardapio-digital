"use client";

import { useEffect, useRef } from "react";
import { useBodyScrollLock } from "./use-body-scroll-lock";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Plumbing comum de overlay em tela cheia (InfoSheet, MenuDrawer, o
 * mini-sheet de apps de mapa): trava o scroll do body, fecha com Esc, foca o
 * painel ao abrir, devolve o foco pro elemento que abriu ao fechar/desmontar,
 * e prende o Tab dentro do painel enquanto aberto (M6 — sem isso, navegando
 * só por teclado dava pra sair do overlay e cair em conteúdo coberto atrás
 * dele) (Parte 4: "role=dialog aria-modal=true" + devolução de foco). */
export function useOverlayBehavior(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!panel.contains(active)) {
        // Foco escapou do painel por algum outro caminho (ex.: autofocus de
        // terceiro em outro lugar) — traz de volta pro início.
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, [open, onClose]);

  return { panelRef };
}
