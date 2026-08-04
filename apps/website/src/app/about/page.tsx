import type { Metadata } from 'next';
import Image from 'next/image';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { metadataFromSeo } from '@/lib/seo';
import { asString, getPublishedCmsPage, getSection } from '@/services/cms';

export async function generateMetadata(): Promise<Metadata> {
  const about = await getPublishedCmsPage('about');
  return metadataFromSeo(about?.page.seo, {
    title: 'About 7Oz',
    description: 'Our story, craft, and cafe philosophy.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const [about, footer] = await Promise.all([
    getPublishedCmsPage('about'),
    getPublishedCmsPage('footer'),
  ]);

  const story = getSection(about, 'story');
  const values = getSection(about, 'values');
  const heading = asString(story?.data.heading, 'Our Story');
  const body = asString(
    story?.data.body,
    '7Oz began with a simple idea: every espresso deserves calm attention.',
  );
  const valuesHeading = asString(values?.data.heading, 'Values');
  const valueItems = Array.isArray(values?.data.items) ? values.data.items : [];

  return (
    <SiteShell footer={footer}>
      <main>
        <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
          <div className="absolute inset-0 -z-10 bg-surface-secondary/80" aria-hidden="true" />
          <Container className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
            <Reveal>
              <SectionIntro eyebrow="About" title={heading} description={body} titleAs="h1" />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-media">
                <Image
                  src="/assets/gallery/city-park/7oz-8.webp"
                  alt="Interior of 7Oz Espresso Cafe"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </Reveal>
          </Container>
        </section>

        <section className="section-pad bg-transparent">
          <Container>
            <Reveal className="mb-14">
              <SectionIntro title={valuesHeading} />
            </Reveal>
            <div className="grid gap-12 md:grid-cols-3 md:gap-10">
              {valueItems.map((item, index) => {
                if (typeof item !== 'object' || item === null) {
                  return null;
                }
                const record = item as Record<string, unknown>;
                const title = asString(record.title);
                const text = asString(record.body);
                if (!title) {
                  return null;
                }
                return (
                  <Reveal key={title} delay={index * 0.08} className="space-y-4 border-t border-border pt-6">
                    <h3 className="text-card-title text-text">{title}</h3>
                    <p className="text-lede text-base">{text}</p>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </section>
      </main>
    </SiteShell>
  );
}
