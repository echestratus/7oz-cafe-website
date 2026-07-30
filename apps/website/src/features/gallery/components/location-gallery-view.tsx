import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { GalleryGrid } from '@/features/gallery/components/gallery-grid';
import type { LightboxImage } from '@/components/ui/image-lightbox';
import type { CafeLocation } from '@/features/locations/lib/locations';

interface LocationGalleryViewProps {
  location: CafeLocation;
  images: LightboxImage[];
}

export function LocationGalleryView({ location, images }: LocationGalleryViewProps) {
  return (
    <main className="pt-28 pb-24 md:pt-36 md:pb-32">
      <Container>
        <Reveal className="mb-10">
          <Link href="/gallery" className="text-link-quiet inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All locations
          </Link>
        </Reveal>

        <Reveal className="mb-16">
          <SectionIntro
            eyebrow="Gallery"
            title={location.shortName}
            description={`${location.address} — quiet rooms, focused pours, and the daily rhythm of the cafe.`}
            titleAs="h1"
          />
        </Reveal>

        <GalleryGrid images={images} />
      </Container>
    </main>
  );
}
