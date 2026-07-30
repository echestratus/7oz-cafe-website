import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { asString } from '@/services/cms';

const featuredItems = [
  { src: '/assets/menu/espresso.jpeg', name: 'Espresso' },
  { src: '/assets/menu/hazelnut-latte.jpeg', name: 'Hazelnut Latte' },
  { src: '/assets/menu/rafaello-croissant.jpeg', name: 'Rafaello Croissant' },
] as const;

interface FeaturedMenuSectionProps {
  data: Record<string, unknown>;
}

export function FeaturedMenuSection({ data }: FeaturedMenuSectionProps) {
  const heading = asString(data.heading, 'Signature Selections');
  const description = asString(
    data.description,
    'A curated taste of our espresso and pastry craft.',
  );

  return (
    <section className="section-pad bg-transparent">
      <Container>
        <Reveal className="mb-14">
          <SectionIntro eyebrow="Menu" title={heading} description={description} />
        </Reveal>

        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {featuredItems.map((item, index) => (
            <Reveal key={item.src} delay={index * 0.08}>
              <article className="group space-y-5">
                <div className="relative aspect-[4/5] overflow-hidden rounded-media">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex items-baseline justify-between border-t border-border pt-4">
                  <h3 className="text-card-title text-text">{item.name}</h3>
                  <span className="text-eyebrow" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <Link href="/menu" className="text-link-quiet inline-flex items-center gap-2">
            View full menu
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
