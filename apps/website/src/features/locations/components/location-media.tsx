import Image from 'next/image';

import { BrandBackdrop } from '@/components/brand/brand-backdrop';
import type { CafeLocation } from '@/features/locations/lib/locations';

interface LocationMediaProps {
  location: CafeLocation;
  sizes: string;
  priority?: boolean;
  /** Extra classes for the cover, such as a hover zoom. */
  mediaClassName?: string;
}

/**
 * Cover media for a location: its photo, or the brand backdrop until the cafe
 * has photography. Fills its parent, which must be positioned and clip overflow.
 *
 * Usage:
 *   <div className="relative aspect-[4/5] overflow-hidden rounded-media">
 *     <LocationMedia location={location} sizes="(max-width: 640px) 100vw, 33vw" />
 *   </div>
 */
export function LocationMedia({
  location,
  sizes,
  priority = false,
  mediaClassName = '',
}: LocationMediaProps) {
  if (!location.image) {
    return <BrandBackdrop sizes={sizes} markClassName={mediaClassName} />;
  }

  return (
    <Image
      src={location.image.src}
      alt={location.image.alt}
      fill
      priority={priority}
      sizes={sizes}
      className={`object-cover ${mediaClassName}`.trim()}
    />
  );
}
