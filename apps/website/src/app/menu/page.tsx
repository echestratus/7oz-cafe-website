import type { Metadata } from 'next';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { MenuBookSection } from '@/features/menu/components/menu-book-section';
import { MenuHighlightsGrid } from '@/features/menu/components/menu-highlights-grid';
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
        alt: toLabel(entry),
        caption: toLabel(entry),
      }));
  } catch {
    return [];
  }
}

export default async function MenuPage() {
  const [footer, items] = await Promise.all([getPublishedCmsPage('footer'), listMenuItems()]);

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container>
          <Reveal className="mb-14">
            <SectionIntro
              eyebrow="Menu"
              title="The Menu Book"
              description="Browse our full menu — signature espresso, tea creations, and pastry, with prices as served in the cafe."
              titleAs="h1"
            />
          </Reveal>

          <Reveal>
            <MenuBookSection />
          </Reveal>
        </Container>

        {items.length > 0 ? (
          <Container className="mt-24 md:mt-32">
            <Reveal className="mb-14">
              <SectionIntro
                eyebrow="Highlights"
                title="From the Bar"
                description="A closer look at the drinks and pastry we craft daily."
              />
            </Reveal>

            <MenuHighlightsGrid items={items} />
          </Container>
        ) : null}
      </main>
    </SiteShell>
  );
}
