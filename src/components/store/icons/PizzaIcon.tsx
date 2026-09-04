import { ICON_BASE_PROPS, type IconProps } from "./types";

export function PizzaIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      <path d="M12 3.5 21 20a20 20 0 0 1-18 0L12 3.5Z" />
      <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
