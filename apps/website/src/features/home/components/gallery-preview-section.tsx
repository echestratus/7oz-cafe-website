import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
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
    <section className="section-pad bg-transparent">
      <Container>
        <Reveal className="mb-14">
          <SectionIntro eyebrow="Atmosphere" title={heading} description={description} />
        </Reveal>

        <div className="columns-2 gap-4 md:columns-3 md:gap-6">
          {images.map((src, index) => (
            <Reveal key={src} delay={index * 0.05} className="mb-4 break-inside-avoid md:mb-6">
              <div
                className={`relative overflow-hidden rounded-media ${
                  index % 3 === 0 ? 'aspect-[3/4]' : index % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'
                }`}
              >
                <Image
                  src={src}
                  alt={`7Oz cafe atmosphere ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <Link href="/gallery" className="text-link-quiet">
            Open gallery
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
