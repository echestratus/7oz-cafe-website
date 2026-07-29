import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { asString } from '@/services/cms';

const previewImages = [
  '/assets/gallery/7oz-2.jpeg',
  '/assets/gallery/7oz-5.jpeg',
  '/assets/gallery/7oz-7.jpeg',
  '/assets/gallery/7oz-9.jpeg',
  '/assets/gallery/7oz-11.jpeg',
  '/assets/gallery/7oz-13.jpeg',
] as const;

interface GalleryPreviewSectionProps {
  data: Record<string, unknown>;
}

export function GalleryPreviewSection({ data }: GalleryPreviewSectionProps) {
  const heading = asString(data.heading, 'Gallery');
  const description = asString(data.description, 'Moments from the cafe floor.');
  const limit = typeof data.limit === 'number' ? Math.min(data.limit, previewImages.length) : 6;
  const images = previewImages.slice(0, limit);

  return (
    <section className="bg-background py-24 md:py-32">
      <Container>
        <Reveal className="mb-12 max-w-2xl space-y-4">
          <h2 className="font-heading text-4xl text-text md:text-5xl">{heading}</h2>
          <p className="text-lg text-text-secondary">{description}</p>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {images.map((src, index) => (
            <Reveal key={src} delay={index * 0.05}>
              <div className="relative aspect-square overflow-hidden rounded-[16px]">
                <Image
                  src={src}
                  alt={`7Oz cafe atmosphere ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <Link
            href="/gallery"
            className="text-sm tracking-[0.12em] text-primary uppercase transition-colors duration-200 hover:text-primary-hover"
          >
            Open gallery
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
