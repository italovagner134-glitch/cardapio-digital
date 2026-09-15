"use client";

import { Share2 } from "lucide-react";
import { shareUrl } from "@/lib/share";

interface ShareButtonProps {
  /** Caminho relativo (ex.: routes.product(slug, productSlug)) — vira URL
   * absoluta em cima de window.location.origin no momento do clique, nunca
   * pré-computada (evita depender de NEXT_PUBLIC_SITE_URL só pra isto). */
  path: string;
  title: string;
  text?: string;
  className?: string;
}

export function ShareButton({ path, title, text, className }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => shareUrl(path, title, text)}
      aria-label="Compartilhar"
      className={className}
    >
      <Share2 size={20} aria-hidden="true" />
    </button>
  );
}
