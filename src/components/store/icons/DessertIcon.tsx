import { ICON_BASE_PROPS, type IconProps } from "./types";

export function DessertIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Cobertura */}
      <path d="M8 11c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none" />
      {/* Forminha */}
      <path d="M7 11h10l-1.2 8.2a1 1 0 0 1-1 .8h-5.6a1 1 0 0 1-1-.8L7 11Z" />
      <line x1="7.6" y1="14.5" x2="16.4" y2="14.5" />
    </svg>
  );
}
