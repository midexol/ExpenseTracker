import type { SVGProps } from "react";

// Bespoke flat-color icon set for the Quest Log theme — deliberately not a generic
// icon-pack look (no Lucide/Feather outlines). Each icon is a simple filled shape.

export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1 1 2 2.5 2 4.5A6.5 6.5 0 0 1 5 13.5C5 8 12 6 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <circle cx="12" cy="12" r="9" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
      <path
        d="M12 7v10M9.5 9.2c0-1 1-1.7 2.5-1.7s2.5.6 2.5 1.5c0 2.2-5 1.2-5 3.4 0 .9 1 1.6 2.5 1.6s2.5-.7 2.5-1.7"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrophyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M7 4h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V4Z"
        fill="currentColor"
      />
      <path
        d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="10.5" y="13" width="3" height="4" fill="currentColor" />
      <rect x="7" y="18" width="10" height="2.4" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function SwordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M20 3 10.5 12.5l1.5 1.5L22 4.5V3h-2Z"
        fill="currentColor"
      />
      <rect
        x="9.2"
        y="12.6"
        width="2.2"
        height="2.2"
        transform="rotate(45 10.3 13.7)"
        fill="currentColor"
      />
      <path
        d="m9 14-5 5 1.5 1.5L10 15.5M4 19l1 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 2.5 14.8 9l7 .6-5.3 4.6 1.6 6.8L12 17.6 5.9 21l1.6-6.8L2.2 9.6l7-.6L12 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChestIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="10" width="18" height="10" rx="1" fill="currentColor" />
      <path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5" fill="currentColor" opacity="0.6" />
      <rect x="10.5" y="10" width="3" height="4" rx="0.5" fill="rgba(0,0,0,0.35)" />
    </svg>
  );
}

export const ACHIEVEMENT_ICONS = {
  flame: FlameIcon,
  coin: CoinIcon,
  trophy: TrophyIcon,
  sword: SwordIcon,
  star: StarIcon,
  chest: ChestIcon,
} as const;

export type AchievementIconKey = keyof typeof ACHIEVEMENT_ICONS;
