import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
    <section className="bg-surface-secondary py-24 md:py-32">
      <Container className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px]">
            <Image
              src="/assets/gallery/7oz-4.jpeg"
              alt="Barista preparing espresso at 7Oz"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="space-y-6">
          <h2 className="font-heading text-4xl text-text md:text-5xl">{heading}</h2>
          <p className="text-lg leading-relaxed text-text-secondary">{description}</p>
          <Button href={cta.href} variant="ghost">
            {cta.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
