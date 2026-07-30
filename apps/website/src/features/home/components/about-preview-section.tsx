import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { asCta, asString } from '@/services/cms';

interface AboutPreviewSectionProps {
  data: Record<string, unknown>;
}

export function AboutPreviewSection({ data }: AboutPreviewSectionProps) {
  const heading = asString(data.heading, 'Our Craft');
  const description = asString(
    data.description,
    'We roast and pull with intention—seven ounces of focus in every cup.',
  );
  const cta = asCta(data.cta) ?? { label: 'Our Story', href: '/about' };

  return (
    <section className="section-pad bg-surface-secondary/70">
      <Container className="grid items-center gap-12 md:grid-cols-2 md:gap-20">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-media">
            <Image
              src="/assets/gallery/7oz-4.jpeg"
              alt="Barista preparing espresso at 7Oz"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="space-y-8">
          <SectionIntro eyebrow="About" title={heading} description={description} />
          <Button href={cta.href} variant="outline">
            {cta.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
