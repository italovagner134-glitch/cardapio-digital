import { ICON_BASE_PROPS, type IconProps } from "./types";

export function FriesIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Palitos */}
      <line x1="9" y1="10" x2="9" y2="4" />
      <line x1="12" y1="9" x2="12" y2="3" />
      <line x1="15" y1="10" x2="15" y2="4" />
      {/* Embalagem */}
      <path d="M7 10h10l-1.3 9a1 1 0 0 1-1 .9H9.3a1 1 0 0 1-1-.9L7 10Z" />
    </svg>
  );
}
