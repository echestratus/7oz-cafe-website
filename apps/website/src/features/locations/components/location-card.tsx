import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';

import type { CafeLocation } from '@/features/locations/lib/locations';
import { locationStatusLabel } from '@/features/locations/lib/locations';

interface LocationCardProps {
  location: CafeLocation;
  href: string;
  priority?: boolean;
  variant?: 'gallery' | 'compact';
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

export function LocationCard({
  location,
  href,
  priority = false,
  variant = 'gallery',
}: LocationCardProps) {
  const isOpen = location.status === 'open';
  const isCompact = variant === 'compact';

  return (
    <Link
      href={href}
      className={cx(
        'group relative block overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        isCompact ? 'aspect-[4/5]' : 'aspect-[4/5] sm:aspect-[3/4]',
      )}
    >
      <Image
        src={location.imageSrc}
        alt={location.imageAlt}
        fill
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        sizes={
          isCompact
            ? '(max-width: 768px) 80vw, 28vw'
            : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
        }
      />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />

      <span className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5 md:p-6">
        <span
          className={cx(
            'rounded-full px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em]',
            isOpen ? 'bg-white/95 text-primary' : 'bg-white/15 text-white backdrop-blur-sm',
          )}
        >
          {locationStatusLabel(location.status)}
        </span>
        <ArrowUpRight
          className="h-5 w-5 text-white/80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </span>

      <span className="absolute inset-x-0 bottom-0 space-y-2 p-5 md:p-6">
        <span className="block font-heading text-2xl leading-tight text-white md:text-[1.75rem]">
          {location.shortName}
        </span>
        <span className="flex items-start gap-2 text-sm leading-relaxed text-white/75">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {location.city}, {location.country}
          </span>
        </span>
      </span>
    </Link>
  );
}
