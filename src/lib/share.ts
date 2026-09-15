import { toast } from "sonner";

/**
 * Compartilhar produto ou loja (Fase 3 — não existia em nenhuma tela).
 * `navigator.share` (sheet nativo do aparelho, com WhatsApp/Instagram já
 * instalados) quando existe; senão cai pra copiar o link — mesmo padrão já
 * usado em InfoSheet ("Copiar endereço"). Compartilhado entre ShareButton
 * (Detalhe do produto) e MenuDrawer ("Compartilhar cardápio").
 */
export async function shareUrl(path: string, title: string, text?: string): Promise<void> {
  const url = `${window.location.origin}${path}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // AbortError quando a pessoa fecha a sheet nativa sem escolher nada —
      // não é erro, não mostra toast.
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  } catch {
    toast.error("Não foi possível copiar o link");
  }
}
