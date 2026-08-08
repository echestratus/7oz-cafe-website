'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { LocationCard } from '@/features/locations/components/location-card';
import {
  getAllLocations,
  type CafeLocation,
} from '@/features/locations/lib/locations';

interface LocationsSectionProps {
  locations?: CafeLocation[];
}

function galleryHref(location: CafeLocation): string {
  return `/gallery/${location.slug}`;
}

export function LocationsSection({ locations = getAllLocations() }: LocationsSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const primary = locations.find((location) => location.status === 'open') ?? locations[0];
  const others = locations.filter((location) => location.id !== primary?.id);
  const otherOpenCount = others.filter((location) => location.status === 'open').length;
  const comingSoonCount = others.filter((location) => location.status === 'coming_soon').length;

  function scrollByCard(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }
    const amount = Math.min(scroller.clientWidth * 0.72, 360);
    scroller.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  if (!primary) {
    return null;
  }

  let othersSummary: string;
  if (otherOpenCount > 0 && comingSoonCount > 0) {
    othersSummary = `${otherOpenCount} more open ${otherOpenCount === 1 ? 'room' : 'rooms'}, and ${comingSoonCount} on the way.`;
  } else if (comingSoonCount > 0) {
    othersSummary = `${comingSoonCount} more ${comingSoonCount === 1 ? 'location' : 'locations'} on the way — explore each gallery for updates.`;
  } else {
    othersSummary = 'Explore each open room in the gallery.';
  }

  return (
    <section className="section-pad bg-surface-secondary/50">
      <Container>
        <Reveal className="mb-12 md:mb-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              eyebrow="Locations"
              title="Find 7Oz"
              description="From Tashkent to Jakarta — visit our open cafes, or follow the next rooms as they open."
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Scroll locations left"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Scroll locations right"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
          <Reveal>
            <Link
              href={galleryHref(primary)}
              className="group relative block min-h-[22rem] overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-[32rem]"
            >
              <Image
                src={primary.imageSrc}
                alt={primary.imageAlt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 48vw"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 space-y-4 p-7 md:p-10">
                <span className="inline-flex rounded-full bg-white/95 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
                  Open now
                </span>
                <span className="block font-heading text-3xl text-white md:text-4xl">
                  {primary.name}
                </span>
                <span className="block max-w-md text-sm leading-relaxed text-white/75">
                  {primary.address}
                </span>
                <span className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-white">
                  View gallery
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <div
              ref={scrollerRef}
              className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory md:gap-5 [&::-webkit-scrollbar]:hidden"
            >
              {others.map((location) => (
                <div
                  key={location.id}
                  className="w-[min(78vw,17.5rem)] shrink-0 snap-start sm:w-[18.5rem]"
                >
                  <LocationCard
                    location={location}
                    href={galleryHref(location)}
                    variant="compact"
                  />
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-text-secondary">{othersSummary}</p>
          </Reveal>
        </div>

        <Reveal className="mt-12">
          <Link href="/gallery" className="text-link-quiet inline-flex items-center gap-2">
            Browse all locations
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
