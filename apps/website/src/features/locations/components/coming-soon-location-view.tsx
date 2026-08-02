import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import type { CafeLocation } from '@/features/locations/lib/locations';
import { getAllLocations, locationMapsUrl } from '@/features/locations/lib/locations';

interface ComingSoonLocationViewProps {
  location: CafeLocation;
}

export function ComingSoonLocationView({ location }: ComingSoonLocationViewProps) {
  const siblings = getAllLocations().filter((item) => item.id !== location.id).slice(0, 3);

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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba_0%,rgba(11,14,52,0.35)_45%,rgba(11,14,52,0.78)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />

        <Container className="relative flex min-h-[88vh] flex-col justify-end pb-16 pt-32 md:pb-24 md:pt-40">
          <Reveal className="max-w-2xl space-y-8">
            <p className="text-eyebrow-dark">Coming soon</p>
            <h1 className="font-heading text-4xl leading-[1.05] text-white md:text-5xl lg:text-6xl">
              {location.name}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              A new 7Oz room is taking shape — the same quiet craft, a new neighborhood. We&apos;ll
              share the opening when the cups are ready.
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
              <Button href="/gallery" variant="inverse">
                All locations
              </Button>
              <Button
                href={locationMapsUrl(location)}
                variant="onDark"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on maps
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="section-pad bg-background">
        <Container>
          <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <p className="text-eyebrow">Meanwhile</p>
              <h2 className="text-section-title text-text">Explore other rooms</h2>
            </div>
            <Link
              href="/gallery"
              className="text-link-quiet inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to gallery
            </Link>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-3">
            {siblings.map((item, index) => (
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
                    <p className="text-eyebrow">
                      {item.status === 'open' ? 'Open now' : 'Coming soon'}
                    </p>
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
    </main>
  );
}
