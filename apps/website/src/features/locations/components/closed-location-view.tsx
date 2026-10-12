import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import {
  getLocationBySlug,
  locationMapsUrl,
  type CafeLocation,
} from '@/features/locations/lib/locations';

interface ClosedLocationViewProps {
  location: CafeLocation;
}

export function ClosedLocationView({ location }: ClosedLocationViewProps) {
  const successor = getLocationBySlug('hadith-hotel');

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />

        <Container className="relative flex min-h-[88vh] flex-col justify-end pb-16 pt-32 md:pb-24 md:pt-40">
          <Reveal className="max-w-2xl space-y-8">
            <p className="text-eyebrow-dark">Closed</p>
            <h1 className="font-heading text-4xl leading-[1.05] text-white md:text-5xl lg:text-6xl">
              {location.name}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/75 md:text-xl">
              This room has closed. 7Oz Espresso is now open at Hadith Hotel in Samarkand.
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
              {successor ? (
                <Button href={`/gallery/${successor.slug}`} variant="inverse">
                  Visit Hadith Hotel
                </Button>
              ) : null}
              <Button href="/gallery" variant="onDark">
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
          <Link href="/gallery" className="text-link-quiet inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to gallery
          </Link>
        </Container>
      </section>
    </main>
  );
}
