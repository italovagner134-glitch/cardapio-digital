import { ICON_BASE_PROPS, type IconProps } from "./types";

export function UtensilsIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Garfo */}
      <path d="M7 3v6a1.5 1.5 0 0 0 3 0V3M8.5 3v6M6 5v4M10 5v4" />
      <line x1="8.5" y1="9" x2="8.5" y2="21" />
      {/* Faca */}
      <path d="M16 3c1.5 1 2 3 2 5.5S17.5 13 16 14v7" />
    </svg>
  );
}
