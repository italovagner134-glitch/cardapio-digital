"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

/** Boundary de erro genérico (G5) — sem isso, qualquer exceção de runtime
 * não tratada (falha de rede numa Server Action, erro de renderização)
 * mostrava a tela crua e sem marca do Next, sem jeito de tentar de novo. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-content">
      <p className="text-sm font-semibold text-content">Algo deu errado</p>
      <p className="max-w-xs text-sm text-muted">
        Tivemos um problema para carregar esta página. Tente de novo em alguns segundos.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-1 flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-onprimary transition-transform duration-150 active:scale-[0.98]"
      >
        <RotateCcw size={16} aria-hidden="true" />
        Tentar de novo
      </button>
    </div>
  );
}
