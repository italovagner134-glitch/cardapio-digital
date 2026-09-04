interface FlameIconProps {
  size?: number;
  className?: string;
}

/**
 * Chama animada (não emoji estático) — três camadas fora de fase: glow,
 * chama externa e chama interna, cada uma com seu próprio timing (ver
 * `.flame-outer/.flame-inner/.flame-glow` em globals.css). Isso é o que dá a
 * sensação de fogo vivo em vez de um ícone piscando em sincronia.
 * Respeitando prefers-reduced-motion, as animações somem e o ícone fica na
 * pose neutra (globals.css cuida disso via media query).
 */
export function FlameIcon({ size = 20, className }: FlameIconProps) {
  const height = size * 1.2;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="flame-outer-gradient" x1="10" y1="24" x2="10" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF3D00" />
          <stop offset="1" stopColor="#FF9500" />
        </linearGradient>
        <linearGradient id="flame-inner-gradient" x1="10" y1="20" x2="10" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFD54F" />
          <stop offset="1" stopColor="#FFF59D" />
        </linearGradient>
      </defs>

      <ellipse
        className="flame-glow"
        cx="10"
        cy="16"
        rx="8"
        ry="7"
        fill="var(--primary, #FF7A00)"
        opacity="0.35"
        style={{ filter: "blur(6px)" }}
      />

      <path
        className="flame-outer"
        d="M10 1C10 1 4 8 4 14.5C4 18.6 6.7 22 10 22C13.3 22 16 18.6 16 14.5C16 11.5 14.3 9.3 13.2 7.8C13 9.2 12.3 10.2 11.5 10.2C10.6 10.2 10 9.3 10 8.2C10 5.8 11 3.8 10 1Z"
        fill="url(#flame-outer-gradient)"
      />

      <path
        className="flame-inner"
        d="M10 9C10 9 7.5 12.5 7.5 15.5C7.5 17.7 8.6 19.5 10 19.5C11.4 19.5 12.5 17.7 12.5 15.5C12.5 13.8 11.6 12.6 11 11.8C10.9 12.5 10.5 13 10.1 13C9.6 13 9.3 12.4 9.4 11.7C9.5 10.6 10 9.9 10 9Z"
        fill="url(#flame-inner-gradient)"
        opacity="0.9"
      />
    </svg>
  );
}
