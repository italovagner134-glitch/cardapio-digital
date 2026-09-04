"use client";

import { useEffect, useRef } from "react";

/**
 * Devolve um ref pra colocar no <header>. Atualiza a CSS custom property
 * --header-p (0 a 1) direto no DOM via requestAnimationFrame, sem passar
 * pelo ciclo de render do React — é assim que uma transição de scroll de
 * 60fps não recalcula a árvore de componentes a cada pixel rolado.
 */
export function useHeaderProgress(thresholdPx = 96) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let rafId = 0;

    function apply() {
      const progress = Math.min(1, Math.max(0, window.scrollY / thresholdPx));
      element?.style.setProperty("--header-p", String(progress));
      rafId = 0;
    }

    function onScroll() {
      if (rafId) return;
      rafId = requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [thresholdPx]);

  return ref;
}
