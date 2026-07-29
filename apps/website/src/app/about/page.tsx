import type { Metadata } from 'next';
import Image from 'next/image';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
          <div className="absolute inset-0 -z-10 bg-surface-secondary" aria-hidden="true" />
          <Container className="grid items-center gap-12 md:grid-cols-2">
            <Reveal className="space-y-6">
              <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">About</p>
              <h1 className="font-heading text-5xl text-text md:text-6xl">{heading}</h1>
              <p className="text-lg leading-relaxed text-text-secondary">{body}</p>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
                <Image
                  src="/assets/gallery/7oz-8.jpeg"
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

        <section className="bg-background py-24">
          <Container>
            <Reveal className="mb-12 max-w-2xl">
              <h2 className="font-heading text-4xl text-text md:text-5xl">{valuesHeading}</h2>
            </Reveal>
            <div className="grid gap-10 md:grid-cols-3">
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
                  <Reveal key={title} delay={index * 0.08} className="space-y-3">
                    <h3 className="font-heading text-2xl text-text">{title}</h3>
                    <p className="text-text-secondary">{text}</p>
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
