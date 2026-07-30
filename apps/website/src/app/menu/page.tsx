import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { MenuBookSection } from '@/features/menu/components/menu-book-section';
import { MenuCategorySections } from '@/features/menu/components/menu-category-sections';
import { getMenuCatalog } from '@/features/menu/lib/menu-catalog';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Espresso, specialty drinks, and pastry selections from 7Oz Espresso Cafe.',
  alternates: { canonical: '/menu' },
};

export default async function MenuPage() {
  const [footer, catalog] = await Promise.all([getPublishedCmsPage('footer'), getMenuCatalog()]);

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

        <Container className="mt-24 md:mt-32">
          <Reveal className="mb-10">
            <SectionIntro
              eyebrow="Highlights"
              title="By Category"
              description="Explore coffee, non-coffee drinks, and pastry — photographed as served at 7Oz."
            />
          </Reveal>

          <MenuCategorySections categories={catalog.categories} />
        </Container>
      </main>
    </SiteShell>
  );
}
