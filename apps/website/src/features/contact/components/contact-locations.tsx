import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink, MapPin } from 'lucide-react';

import { Reveal } from '@/components/ui/reveal';
import {
  getAllLocations,
  locationMapsUrl,
  locationStatusLabel,
  type CafeLocation,
} from '@/features/locations/lib/locations';

function ContactLinks({
  location,
  isOpen,
}: {
  location: CafeLocation;
  isOpen: boolean;
}) {
  const galleryLabel = !isOpen
    ? 'Coming soon'
    : location.hasGallery
      ? 'View gallery'
      : 'Visit page';

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      <a
        href={locationMapsUrl(location)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-link-quiet inline-flex items-center gap-2"
      >
        Open in Maps
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <Link
        href={`/gallery/${location.slug}`}
        className="text-link-quiet inline-flex items-center gap-2"
      >
        {galleryLabel}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

function FeaturedLocation({ location }: { location: CafeLocation }) {
  return (
    <article className="overflow-hidden rounded-media border border-border/70 bg-surface shadow-soft">
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Link
          href={`/gallery/${location.slug}`}
          className="group relative min-h-[18rem] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-[22rem] lg:min-h-[28rem]"
        >
          <Image
            src={location.imageSrc}
            alt={location.imageAlt}
            fill
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary md:left-6 md:top-6">
            {locationStatusLabel(location.status)}
          </span>
        </Link>

        <div className="flex flex-col justify-center gap-8 p-8 md:p-10 lg:p-12">
          <div className="space-y-4">
            <p className="text-eyebrow">
              {location.city} · {location.country}
            </p>
            <h3 className="font-heading text-3xl leading-tight text-text md:text-4xl">
              {location.name}
            </h3>
            <p className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary md:text-base">
              <MapPin className="mt-1 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{location.address}</span>
            </p>
          </div>

          <ContactLinks location={location} isOpen />
        </div>
      </div>
    </article>
  );
}

function ComingSoonCard({ location }: { location: CafeLocation }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-media border border-border/60 bg-surface">
      <Link
        href={`/gallery/${location.slug}`}
        className="relative aspect-[5/4] overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Image
          src={location.imageSrc}
          alt={location.imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
          {locationStatusLabel(location.status)}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-5 p-6 md:p-8">
        <div className="space-y-3">
          <p className="text-eyebrow">
            {location.city} · {location.country}
          </p>
          <h3 className="font-heading text-xl leading-snug text-text md:text-2xl">
            {location.shortName}
          </h3>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            <span>{location.address}</span>
          </p>
        </div>

        <p className="text-sm leading-relaxed text-text-secondary">
          A new 7Oz room is on the way. We&apos;ll share the opening when the cups are ready.
        </p>

        <div className="mt-auto pt-2">
          <ContactLinks location={location} isOpen={false} />
        </div>
      </div>
    </article>
  );
}

export function ContactLocations() {
  const locations = getAllLocations();
  const open = locations.filter((location) => location.status === 'open');
  const comingSoon = locations.filter((location) => location.status === 'coming_soon');

  return (
    <div className="space-y-16 md:space-y-20">
      {open.map((location, index) => (
        <Reveal key={location.id} delay={index * 0.04}>
          <FeaturedLocation location={location} />
        </Reveal>
      ))}

      {comingSoon.length > 0 ? (
        <div className="space-y-10 md:space-y-12">
          <Reveal>
            <div className="max-w-xl space-y-4">
              <p className="text-eyebrow">Next rooms</p>
              <h3 className="font-heading text-2xl text-text md:text-3xl">Coming soon</h3>
              <p className="text-lede">
                From Tashkent to Jakarta — each address below is preparing its own quiet corner of
                7Oz.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-10">
            {comingSoon.map((location, index) => (
              <Reveal key={location.id} delay={(index % 3) * 0.05}>
                <ComingSoonCard location={location} />
              </Reveal>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
