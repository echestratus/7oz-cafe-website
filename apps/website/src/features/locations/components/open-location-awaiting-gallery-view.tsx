import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import type { CafeLocation } from '@/features/locations/lib/locations';
import {
  getAllLocations,
  locationMapsUrl,
} from '@/features/locations/lib/locations';

interface OpenLocationAwaitingGalleryViewProps {
  location: CafeLocation;
}

/**
 * For cafes that are open but do not yet have a photo gallery.
 * Sets clear expectations and routes guests to locations with images.
 */
export function OpenLocationAwaitingGalleryView({
  location,
}: OpenLocationAwaitingGalleryViewProps) {
  const galleriesReady = getAllLocations()
    .filter(
      (item) =>
        item.id !== location.id && item.status === 'open' && item.hasGallery,
    )
    .slice(0, 3);

  return (
    <main>
      <section className="relative min-h-[88vh] overflow-hidden">
        <Image
          src={location.imageSrc}
          alt={location.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(11,14,52,0.35)_45%,rgba(11,14,52,0.78)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />

        <Container className="relative flex min-h-[88vh] flex-col justify-end pb-16 pt-32 md:pb-24 md:pt-40">
          <Reveal className="max-w-2xl space-y-8">
            <p className="text-eyebrow-dark">Open now</p>
            <h1 className="font-heading text-4xl leading-[1.05] text-white md:text-5xl lg:text-6xl">
              {location.name}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              The cafe is open. We&apos;re still preparing the photo gallery for this room —
              visit us in person, or browse another 7Oz gallery meanwhile.
            </p>
            <div className="flex items-start gap-3 text-sm leading-relaxed text-white/65">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p>
                  {location.city}, {location.country}
                </p>
                <p>{location.address}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                href={locationMapsUrl(location)}
                variant="inverse"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
              </Button>
              <Button href="/gallery" variant="onDark">
                All locations
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      {galleriesReady.length > 0 ? (
        <section className="section-pad bg-background">
          <Container>
            <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-3">
                <p className="text-eyebrow">Meanwhile</p>
                <h2 className="text-section-title text-text">Browse open galleries</h2>
                <p className="max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
                  Atmosphere from rooms where photos are ready — same craft, different neighborhood.
                </p>
              </div>
              <Link href="/gallery" className="text-link-quiet inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to gallery
              </Link>
            </Reveal>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {galleriesReady.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.05}>
                  <Link
                    href={`/gallery/${item.slug}`}
                    className="group block space-y-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-media">
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    </div>
                    <div className="space-y-1 border-t border-border pt-3">
                      <p className="text-eyebrow">Open now</p>
                      <h3 className="font-heading text-xl text-text">{item.shortName}</h3>
                      <p className="text-sm text-text-secondary">
                        {item.city}, {item.country}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </main>
  );
}
