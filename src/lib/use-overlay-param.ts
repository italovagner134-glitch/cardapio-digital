"use client";

import { useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Sincroniza um overlay (InfoSheet, MenuDrawer) com `?chave=1` na URL — Parte
 * 1 do prompt: "o botão voltar do Android fecha o overlay em vez de sair da
 * loja". `open()` empilha uma entrada de histórico; `close()` usa
 * `router.back()` quando fomos nós que empilhamos (fecha exatamente como o
 * botão físico voltar faria) ou `router.replace()` quando o overlay chegou
 * aberto por link direto (não tem entrada nossa pra "voltar").
 */
export function useOverlayParam(key: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pushedRef = useRef(false);

  const isOpen = searchParams.get(key) === "1";

  const open = useCallback(() => {
    if (isOpen) return;
    pushedRef.current = true;
    const query = new URLSearchParams(searchParams.toString());
    query.set(key, "1");
    router.push(`${pathname}?${query.toString()}`, { scroll: false });
  }, [isOpen, key, pathname, router, searchParams]);

  const close = useCallback(() => {
    if (!isOpen) return;
    if (pushedRef.current) {
      pushedRef.current = false;
      router.back();
      return;
    }
    const query = new URLSearchParams(searchParams.toString());
    query.delete(key);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [isOpen, key, pathname, router, searchParams]);

  return { isOpen, open, close };
}
