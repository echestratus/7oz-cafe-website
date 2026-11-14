import Image from 'next/image';

import { BRAND_LOGO } from '@/components/brand/brand-logo';

interface BrandBackdropProps {
  /** The `sizes` hint a cover photo in this slot would use. */
  sizes: string;
  /** Extra classes for the watermark, such as a hover zoom. */
  markClassName?: string;
}

/**
 * Brand surface for a media slot that has no photography yet: deep blue with
 * the mark as a quiet watermark. Decorative — the caller supplies the heading.
 * The parent must be positioned and clip its overflow.
 *
 * Usage:
 *   <div className="relative aspect-[4/5] overflow-hidden rounded-media">
 *     <BrandBackdrop sizes="(max-width: 640px) 100vw, 33vw" />
 *   </div>
 */
export function BrandBackdrop({ sizes, markClassName = '' }: BrandBackdropProps) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary-hover via-primary to-ink"
    >
      {/* Inset box keeps the whole mark visible at any aspect ratio. */}
      <span
        className={`absolute inset-y-[8%] left-[8%] right-[4%] opacity-15 ${markClassName}`.trim()}
      >
        <Image
          src={BRAND_LOGO.src}
          alt=""
          fill
          sizes={sizes}
          className="object-contain object-right brightness-0 invert"
        />
      </span>
    </span>
  );
}
