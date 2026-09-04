import { ICON_BASE_PROPS, type IconProps } from "./types";

export function GiftIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      <rect x="4" y="9" width="16" height="4" rx="1" />
      <rect x="5" y="13" width="14" height="8" rx="1" />
      <line x1="12" y1="9" x2="12" y2="21" />
      <path d="M12 9C10.5 6.5 8 6 7 7.2 6.2 8.2 7 9 8.5 9" />
      <path d="M12 9c1.5-2.5 4-3 5-1.8.8 1 0 1.8-1.5 1.8" />
    </svg>
  );
}
