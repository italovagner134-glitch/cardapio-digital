"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/use-cart";
import { useStoreRef } from "@/lib/store-context";
import { routes } from "@/lib/routes";

/** Id estável do CTA "Continuar meu pedido" dentro do painel de urgência —
 * StickyCartBar observa esse elemento pelo id em vez de receber uma ref por
 * prop (os dois moram em componentes irmãos, sem um pai comum próximo o
 * bastante pra passar ref sem contexto extra). */
export const URGENCY_CTA_ID = "urgency-panel-cta";

// "/checkout" não existe como rota própria ainda (o fechamento de pedido
// hoje é dentro de /carrinho, via WhatsApp — ver CartPageContent) — fica
// aqui só pra já cobrir o dia em que existir, sem precisar lembrar de
// voltar aqui.
const HIDDEN_ROUTES_SUFFIXES = ["/carrinho", "/checkout"];

/**
 * Única fonte de verdade de "a barra fixa do carrinho deve aparecer" —
 * usada tanto pelo StickyCartBar (pra se renderizar) quanto pelo AppShell
 * (pra abrir espaço extra no fim da página, senão o último item do
 * cardápio fica escondido atrás da barra). Calcular nos dois lugares em
 * vez de um só criaria duas fontes de verdade que podem dessincronizar.
 *
 * `useSyncExternalStore`, não `useEffect` + `useState`: "o CTA do painel
 * está na tela" é um valor de fora do React (IntersectionObserver do DOM),
 * exatamente o caso que o hook resolve sem precisar chamar setState dentro
 * de um efeito (mesma convenção de useCart/StoreCover neste projeto).
 */
export function useStickyCartBarVisible(): boolean {
  const pathname = usePathname();
  const { slug } = useStoreRef();
  const cart = useCart();
  const intersectingRef = useRef(true);

  const excluded = HIDDEN_ROUTES_SUFFIXES.some((suffix) => pathname === `/${slug}${suffix}`);
  const hasItems = cart.count > 0;
  const shouldWatch = !excluded && hasItems;

  // O CTA só existe no DOM na home (é lá que UrgencyPanel/UrgencyPanelLive
  // montam) — checar a rota aqui evita procurar um elemento que a gente já
  // sabe que não existe, e é o que faz este hook reconectar ao navegar de
  // volta pra home (o nó antigo, de antes de sair da home, já se foi).
  const isHome = pathname === routes.home(slug);

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!shouldWatch || !isHome) return () => {};

      const target = document.getElementById(URGENCY_CTA_ID);
      if (!target) {
        // Na home, mas o painel não montou CTA nesta variante (ex.: loja
        // fechada, variante 5 não tem CTA) — nada pra observar, a barra
        // pode aparecer livremente.
        intersectingRef.current = false;
        return () => {};
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          intersectingRef.current = entry.isIntersecting;
          callback();
        },
        { threshold: 0 },
      );
      observer.observe(target);
      return () => observer.disconnect();
    },
    // Reconecta quando a rota muda ou quando o carrinho passa de vazio pra
    // "com item" (o CTA do painel só existe no DOM quando há carrinho).
    [shouldWatch, isHome],
  );

  const getSnapshot = useCallback(() => intersectingRef.current, []);
  const getServerSnapshot = useCallback(() => true, []);

  const ctaIntersecting = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (excluded || !hasItems) return false;
  return !ctaIntersecting;
}
