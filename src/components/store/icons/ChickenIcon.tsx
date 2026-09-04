import { ICON_BASE_PROPS, type IconProps } from "./types";

export function ChickenIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      <path d="M14 4c2.5 0 4.5 2 4.5 4.5 0 2-1.2 3.3-2.7 4.4l-4.3 7.6a1.5 1.5 0 0 1-2.6-1.5l1.9-3.4c-1.9-.2-3.3-1.8-3.3-3.7C7.5 9.6 8.9 8 11 8c.3-2.3 1.5-4 3-4Z" />
    </svg>
  );
}
