"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useStoreRef } from "@/lib/store-context";
import { routes } from "@/lib/routes";

/** Boundary de erro da loja (G5) — renderiza dentro de [slug]/layout.tsx,
 * então o header/bottom nav e o tema da loja (CSS vars aplicadas no layout)
 * continuam de pé; só o conteúdo da página que falhou é trocado por isto. */
export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const { slug } = useStoreRef();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center text-content">
      <p className="text-sm font-semibold text-content">Algo deu errado</p>
      <p className="max-w-xs text-sm text-muted">
        Tivemos um problema para carregar esta página. Tente de novo em alguns segundos.
      </p>
      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-onprimary transition-transform duration-150 active:scale-[0.98]"
        >
          <RotateCcw size={16} aria-hidden="true" />
          Tentar de novo
        </button>
        <button
          type="button"
          onClick={() => router.push(routes.home(slug))}
          className="flex h-11 items-center rounded-full border border-line px-5 text-sm font-medium text-content transition-transform duration-150 active:scale-95"
        >
          Ver cardápio
        </button>
      </div>
    </div>
  );
}
