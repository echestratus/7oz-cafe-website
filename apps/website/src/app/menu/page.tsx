import type { Metadata } from 'next';

import { PageMain } from '@/components/layout/page-main';
import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { MenuBookSection } from '@/features/menu/components/menu-book-section';
import { MenuCategorySections } from '@/features/menu/components/menu-category-sections';
import { NewMenuSection } from '@/features/menu/components/new-menu-section';
import { getMenuCatalog } from '@/features/menu/lib/menu-catalog';
import { pickNewMenuItems } from '@/features/menu/lib/new-menu';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Espresso, specialty drinks, and pastry selections from 7Oz Espresso Cafe.',
  alternates: { canonical: '/menu' },
};

export default async function MenuPage() {
  const [footer, catalog] = await Promise.all([getPublishedCmsPage('footer'), getMenuCatalog()]);
  const newMenuItems = pickNewMenuItems(catalog);

  return (
    <SiteShell footer={footer}>
      <PageMain>
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

        {newMenuItems.length > 0 ? (
          <div id="new-menu" className="mt-24 scroll-mt-28 md:mt-32">
            <NewMenuSection items={newMenuItems} showBrowseLink={false} />
          </div>
        ) : null}

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
      </PageMain>
    </SiteShell>
  );
}
