/**
 * Mesmo desenho de public/brand/logo-placeholder.svg, mas inline: um
 * <Image src="...svg"> carrega o arquivo como documento isolado — o
 * `currentColor` dele não herdaria a cor do tema da loja. Inline, sim.
 */
import type { CSSProperties } from "react";

export function LogoPlaceholder({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width="120"
      height="40"
      viewBox="0 0 120 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Logo placeholder"
      className={className}
      style={style}
    >
      <g fill="currentColor">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M11 16.5C11 15.67 11.67 15 12.5 15H27.5C28.33 15 29 15.67 29 16.5C29 17.33 28.33 18 27.5 18H12.5C11.67 18 11 17.33 11 16.5Z" />
        <path d="M12 20H28C27.6 23.5 24.2 26 20 26C15.8 26 12.4 23.5 12 20Z" />
        <path d="M11.5 27.5C11.5 26.67 12.17 26 13 26H27C27.83 26 28.5 26.67 28.5 27.5C28.5 28.33 27.83 29 27 29H13C12.17 29 11.5 28.33 11.5 27.5Z" />
      </g>
      <text x="44" y="24" fontFamily="Inter, sans-serif" fontSize="11" fontWeight="700" letterSpacing="0.5" fill="currentColor">
        SUA MARCA
      </text>
    </svg>
  );
}
