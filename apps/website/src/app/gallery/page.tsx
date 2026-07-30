import type { Metadata } from 'next';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { GalleryGrid } from '@/features/gallery/components/gallery-grid';
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
      .map((entry, index) => ({
        src: `/assets/gallery/${entry}`,
        alt: `7Oz cafe atmosphere ${index + 1}`,
        caption: `Gallery ${index + 1}`,
      }));
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
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container>
          <Reveal className="mb-16">
            <SectionIntro
              eyebrow="Gallery"
              title="Atmosphere"
              description="Quiet rooms, focused pours, and the daily rhythm of the cafe."
              titleAs="h1"
            />
          </Reveal>

          <GalleryGrid images={images} />
        </Container>
      </main>
    </SiteShell>
  );
}
