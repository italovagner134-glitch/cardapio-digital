import { ICON_BASE_PROPS, type IconProps } from "./types";

export function BurgerIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Pão de cima */}
      <path d="M4 10c0-3.3 3.6-6 8-6s8 2.7 8 6" />
      {/* Recheio */}
      <line x1="3.5" y1="12.5" x2="20.5" y2="12.5" />
      {/* Pão de baixo */}
      <path d="M3.5 15.5h17a1.5 1.5 0 0 1 0 3h-17a1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}
