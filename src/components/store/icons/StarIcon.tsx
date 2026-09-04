import { ICON_BASE_PROPS, type IconProps } from "./types";

export function StarIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L12 3Z" />
    </svg>
  );
}
