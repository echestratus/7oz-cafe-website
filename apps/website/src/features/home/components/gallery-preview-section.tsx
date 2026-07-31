import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { getPrimaryLocation } from '@/features/locations/lib/locations';
import { asString } from '@/services/cms';

const previewImages = [
  '/assets/gallery/7oz-5.webp',
  '/assets/gallery/7oz-9.webp',
  '/assets/gallery/7oz-2.webp',
  '/assets/gallery/7oz-7.webp',
  '/assets/gallery/7oz-6.webp',
  '/assets/gallery/7oz-13.webp',
] as const;

interface GalleryPreviewSectionProps {
  data: Record<string, unknown>;
}

export function GalleryPreviewSection({ data }: GalleryPreviewSectionProps) {
  const primary = getPrimaryLocation();
  const heading = asString(data.heading, 'Gallery');
  const description = asString(
    data.description,
    `Moments from ${primary.shortName} — and a door into every 7Oz room.`,
  );
  const limit = typeof data.limit === 'number' ? Math.min(data.limit, previewImages.length) : 6;
  const images = previewImages.slice(0, limit);

  return (
    <section className="section-pad bg-transparent">
      <Container>
        <Reveal className="mb-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro eyebrow="Atmosphere" title={heading} description={description} />
            <div className="shrink-0 space-y-2 lg:max-w-xs lg:text-right">
              <p className="text-eyebrow">Now showing</p>
              <p className="font-heading text-xl text-text">{primary.shortName}</p>
              <p className="text-sm text-text-secondary">
                {primary.city}, {primary.country}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="columns-2 gap-4 md:columns-3 md:gap-6">
          {images.map((src, index) => (
            <Reveal key={src} delay={index * 0.05} className="mb-4 break-inside-avoid md:mb-6">
              <Link
                href={`/gallery/${primary.slug}`}
                className={`group relative block overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'
                }`}
              >
                <Image
                  src={src}
                  alt={`${primary.shortName} atmosphere ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 flex flex-wrap gap-x-8 gap-y-4">
          <Link
            href={`/gallery/${primary.slug}`}
            className="text-link-quiet inline-flex items-center gap-2"
          >
            Open {primary.shortName} gallery
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/gallery" className="text-link-quiet inline-flex items-center gap-2">
            All locations
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
