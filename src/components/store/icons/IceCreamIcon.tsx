import { ICON_BASE_PROPS, type IconProps } from "./types";

export function IceCreamIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Bola */}
      <path d="M8 10a4 4 0 0 1 8 0c0 1.5-1 2.5-2 3H10c-1 0-2-1-2-3Z" />
      {/* Casquinha */}
      <path d="M9.5 13h5L12.6 20.3a.7.7 0 0 1-1.2 0L9.5 13Z" />
    </svg>
  );
}
