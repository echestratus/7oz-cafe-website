import type { Metadata } from 'next';
import Image from 'next/image';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Espresso, specialty drinks, and pastry selections from 7Oz Espresso Cafe.',
  alternates: { canonical: '/menu' },
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function toLabel(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function listMenuItems() {
  const directory = path.join(process.cwd(), 'public', 'assets', 'menu');
  try {
    const entries = await readdir(directory);
    return entries
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((entry) => ({
        src: `/assets/menu/${entry}`,
        name: toLabel(entry),
      }));
  } catch {
    return [];
  }
}

export default async function MenuPage() {
  const [footer, items] = await Promise.all([getPublishedCmsPage('footer'), listMenuItems()]);

  return (
    <SiteShell footer={footer}>
      <main className="bg-background pt-28 pb-24 md:pt-36">
        <Container>
          <Reveal className="mb-14 max-w-2xl space-y-4">
            <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Menu</p>
            <h1 className="font-heading text-5xl text-text md:text-6xl">Selections</h1>
            <p className="text-lg text-text-secondary">
              A living catalog of espresso, drinks, and pastry. Full CMS-backed menu management arrives
              with the menu domain.
            </p>
          </Reveal>

          {items.length === 0 ? (
            <p className="text-text-secondary">Menu imagery will appear after asset sync.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <Reveal key={item.src} delay={(index % 6) * 0.04}>
                  <article className="space-y-4">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]">
                      <Image
                        src={item.src}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <h2 className="font-heading text-2xl text-text">{item.name}</h2>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </main>
    </SiteShell>
  );
}
