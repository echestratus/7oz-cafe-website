import Image from 'next/image';

const logoSrc = {
  mark: '/assets/logo/logo-7oz.png',
  full: '/assets/logo/logo-7-oz-espresso-scaled.png',
} as const;

const sizeMap = {
  header: {
    variant: 'mark',
    width: 88,
    height: 88,
    className: 'h-16 w-16 md:h-20 md:w-20',
  },
  footer: {
    variant: 'mark',
    width: 112,
    height: 112,
    className: 'h-20 w-20 md:h-24 md:w-24',
  },
  hero: {
    variant: 'full',
    width: 640,
    height: 280,
    className: 'h-28 w-auto md:h-36 lg:h-44',
  },
} as const;

type BrandLogoSize = keyof typeof sizeMap;

interface BrandLogoProps {
  size?: BrandLogoSize;
  /**
   * Soft luminous halo for dark media. Does not invent a white plate —
   * keeps the original artwork intact while lifting contrast.
   */
  onDark?: boolean;
  className?: string;
  priority?: boolean;
}

/** White multi-layer glow so dark navy/brown artwork stays readable on video. */
const onDarkGlow =
  '[filter:drop-shadow(0_0_1px_rgba(255,255,255,0.95))_drop-shadow(0_0_18px_rgba(255,255,255,0.55))_drop-shadow(0_0_42px_rgba(255,255,255,0.28))]';

export function BrandLogo({
  size = 'header',
  onDark = false,
  className = '',
  priority = false,
}: BrandLogoProps) {
  const dimensions = sizeMap[size];

  return (
    <Image
      src={logoSrc[dimensions.variant]}
      alt="7Oz Espresso Cafe"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={`object-contain ${dimensions.className} ${onDark ? onDarkGlow : ''} ${className}`.trim()}
    />
  );
}
