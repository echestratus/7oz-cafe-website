import type { Metadata } from 'next';
import Image from 'next/image';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Atmosphere and craft from 7Oz Espresso Cafe.',
  alternates: { canonical: '/gallery' },
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function listGalleryImages() {
  const directory = path.join(process.cwd(), 'public', 'assets', 'gallery');
  try {
    const entries = await readdir(directory);
    return entries
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((entry) => `/assets/gallery/${entry}`);
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const [footer, images] = await Promise.all([
    getPublishedCmsPage('footer'),
    listGalleryImages(),
  ]);

  return (
    <SiteShell footer={footer}>
      <main className="bg-background pt-28 pb-24 md:pt-36">
        <Container>
          <Reveal className="mb-14 max-w-2xl space-y-4">
            <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Gallery</p>
            <h1 className="font-heading text-5xl text-text md:text-6xl">Atmosphere</h1>
            <p className="text-lg text-text-secondary">
              Quiet rooms, focused pours, and the daily rhythm of the cafe.
            </p>
          </Reveal>

          {images.length === 0 ? (
            <p className="text-text-secondary">Gallery imagery will appear after asset sync.</p>
          ) : (
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
              {images.map((src, index) => (
                <Reveal key={src} delay={(index % 6) * 0.04} className="mb-4 break-inside-avoid">
                  <div className="relative overflow-hidden rounded-[16px]">
                    <Image
                      src={src}
                      alt={`7Oz gallery image ${index + 1}`}
                      width={900}
                      height={1200}
                      className="h-auto w-full object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </main>
    </SiteShell>
  );
}
