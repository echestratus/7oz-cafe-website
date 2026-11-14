import Image from 'next/image';

/** The single 7Oz mark. Intrinsic size matches the exported asset so the ratio never drifts. */
export const BRAND_LOGO = {
  src: '/assets/logo/7oz-espresso-logo.webp',
  width: 1010,
  height: 1200,
} as const;

const sizeMap = {
  header: { height: 80, className: 'h-12 w-auto md:h-20' },
  footer: { height: 96, className: 'h-20 w-auto md:h-24' },
  hero: { height: 192, className: 'h-32 w-auto md:h-40 lg:h-48' },
} as const;

type BrandLogoSize = keyof typeof sizeMap;

interface BrandLogoProps {
  size?: BrandLogoSize;
  /** Renders the mark in white for video, photography, and ink surfaces. */
  onDark?: boolean;
  className?: string;
  priority?: boolean;
}

/** Turns the single-colour artwork white without a second asset. */
const inverseTone = 'brightness-0 invert';

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Usage:
 *   <BrandLogo size="header" />          // brand blue on light surfaces
 *   <BrandLogo size="hero" onDark />     // white on video or ink
 */
export function BrandLogo({
  size = 'header',
  onDark = false,
  className,
  priority = false,
}: BrandLogoProps) {
  const { height, className: sizeClassName } = sizeMap[size];
  const width = Math.round((height * BRAND_LOGO.width) / BRAND_LOGO.height);

  return (
    <Image
      src={BRAND_LOGO.src}
      alt="7Oz Espresso Cafe"
      width={width}
      height={height}
      priority={priority}
      className={cx(sizeClassName, onDark && inverseTone, className)}
    />
  );
}
