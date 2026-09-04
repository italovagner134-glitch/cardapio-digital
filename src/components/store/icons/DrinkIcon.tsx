import { ICON_BASE_PROPS, type IconProps } from "./types";

export function DrinkIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Tampa */}
      <path d="M8 6h8l-.5 2h-7L8 6Z" />
      {/* Canudo */}
      <line x1="13" y1="3" x2="11.5" y2="8" />
      {/* Copo */}
      <path d="M7.8 8h8.4l-1 11a1 1 0 0 1-1 .9H9.8a1 1 0 0 1-1-.9L7.8 8Z" />
    </svg>
  );
}
