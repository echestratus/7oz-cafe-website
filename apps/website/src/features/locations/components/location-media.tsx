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
    <>
      <Image
        src={location.image.src}
        alt={location.image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`object-cover ${mediaClassName}`.trim()}
      />
      {location.logo ? (
        <span className="absolute inset-0 flex items-center justify-center pb-12">
          <span className="relative h-2/5 max-h-56 w-1/2 max-w-56 rounded-xl bg-white/95 p-3 shadow-soft">
            <Image
              src={location.logo.src}
              alt={location.logo.alt}
              fill
              sizes="(max-width: 640px) 40vw, 224px"
              className="object-contain p-3"
            />
          </span>
        </span>
      ) : null}
    </>
  );
}
