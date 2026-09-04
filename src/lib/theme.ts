import type { CSSProperties } from "react";
import type { StoreTheme } from "@/types/store";

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Mistura duas cores hex. `amount` é a fração de `to` aplicada (0–1). */
export function mix(from: string, to: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  );
}

/** Cor hex + opacidade, em `rgba()` — pra usar em bordas/overlays sutis. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const [rl, gl, bl] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Luminância relativa (WCAG) → devolve preto ou branco, o que der mais
 * contraste sobre `hex`. Usado pro texto dentro de botões na cor primária
 * do tema e sempre que uma cor de fundo é escolhida pelo dono da loja.
 *
 * Importante: não é só "luminância > 0.5 → preto, senão branco". Por causa
 * do +0.05 na fórmula de contraste do WCAG, fundos de luminância média-baixa
 * (ex.: laranja #FF7A00, luminância 0.35) dão contraste MELHOR com preto
 * (8:1) do que com branco (2.6:1), mesmo sendo "mais escuro que 0.5" — por
 * isso comparamos as duas razões de contraste de verdade, não um atalho.
 */
export function getContrastColor(hex: string): "#0B0B0C" | "#FFFFFF" {
  const luminance = relativeLuminance(hex);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;
  return contrastWithBlack >= contrastWithWhite ? "#0B0B0C" : "#FFFFFF";
}

/**
 * Monta as CSS custom properties do tema da loja, pra aplicar via
 * `style={buildThemeVars(store)}` no elemento raiz da página pública.
 * Tudo daqui pra baixo na árvore passa a ler essas variáveis — nenhuma cor
 * fica hardcoded nos componentes de `components/store`.
 */
export function buildThemeVars(store: StoreTheme): CSSProperties {
  const onBg = getContrastColor(store.theme_bg);
  const surface2 = mix(store.theme_surface, onBg === "#FFFFFF" ? "#FFFFFF" : "#000000", 0.06);

  return {
    "--bg": store.theme_bg,
    "--surface": store.theme_surface,
    "--surface-2": surface2,
    "--primary": store.theme_primary,
    "--primary-soft": store.theme_primary_soft,
    "--text": store.theme_text,
    "--muted": store.theme_muted,
    "--success": store.theme_success,
    "--border": withAlpha(store.theme_text, 0.1),
    "--on-primary": getContrastColor(store.theme_primary),
    "--on-bg": onBg,
  } as CSSProperties;
}
