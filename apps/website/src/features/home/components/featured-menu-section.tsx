import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
    <section className="bg-background py-24 md:py-32">
      <Container>
        <Reveal className="mb-12 max-w-2xl space-y-4">
          <h2 className="font-heading text-4xl text-text md:text-5xl">{heading}</h2>
          <p className="text-lg text-text-secondary">{description}</p>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-3">
          {featuredItems.map((item, index) => (
            <Reveal key={item.src} delay={index * 0.08}>
              <article className="space-y-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[20px]">
                  <Image
                    src={item.src}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <h3 className="font-heading text-2xl text-text">{item.name}</h3>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 text-sm tracking-[0.12em] text-primary uppercase transition-colors duration-200 hover:text-primary-hover"
          >
            View full menu
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
