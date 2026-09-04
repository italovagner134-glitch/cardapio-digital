import { ICON_BASE_PROPS, type IconProps } from "./types";

export function ComboIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} className={className} {...ICON_BASE_PROPS}>
      {/* Embalagem */}
      <path d="M8 10h5l-.6 8.5a1 1 0 0 1-1 .5H9.6a1 1 0 0 1-1-.5L8 10Z" />
      <path d="M7.3 10h6.4L13 7.5H8l-.7 2.5Z" />
      {/* Copo */}
      <path d="M15.5 9h4l-.7 9a1 1 0 0 1-1 .9h-.6a1 1 0 0 1-1-.9L15.5 9Z" />
      <line x1="15.2" y1="9" x2="19.8" y2="9" />
    </svg>
  );
}
