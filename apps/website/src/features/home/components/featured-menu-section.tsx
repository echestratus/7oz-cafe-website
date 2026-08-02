import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import type { MenuItem } from '@/features/menu/lib/menu-catalog';
import { asString } from '@/services/cms';

interface FeaturedMenuSectionProps {
  data: Record<string, unknown>;
  coffee?: MenuItem[];
  nonCoffee?: MenuItem[];
  pastries?: MenuItem[];
}

type FeatureLane = {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  items: MenuItem[];
};

export function FeaturedMenuSection({
  data,
  coffee = [],
  nonCoffee = [],
  pastries = [],
}: FeaturedMenuSectionProps) {
  const heading = asString(data.heading, 'Signature Selections');
  const description = asString(
    data.description,
    'Coffee, house drinks, and pastry — a taste of what we craft each day.',
  );

  const lanes: FeatureLane[] = [
    {
      id: 'coffee',
      eyebrow: 'Beverages',
      title: 'Coffee',
      href: '/menu#coffee',
      items: coffee,
    },
    {
      id: 'non-coffee',
      eyebrow: 'Beverages',
      title: 'Non-coffee',
      href: '/menu#non-coffee',
      items: nonCoffee,
    },
    {
      id: 'pastries',
      eyebrow: 'From the case',
      title: 'Pastries',
      href: '/menu#pastries',
      items: pastries,
    },
  ].filter((lane) => lane.items.length > 0);

  if (lanes.length === 0) {
    return null;
  }

  return (
    <section className="section-pad bg-surface-secondary/40">
      <Container>
        <Reveal className="mb-14">
          <SectionIntro eyebrow="Menu" title={heading} description={description} />
        </Reveal>

        <div className="space-y-16 md:space-y-20">
          {lanes.map((lane, laneIndex) => (
            <Reveal key={lane.id} delay={laneIndex * 0.06}>
              <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12">
                <div className="space-y-5">
                  <p className="text-eyebrow">{lane.eyebrow}</p>
                  <h3 className="text-section-title text-text">{lane.title}</h3>
                  <Link
                    href={lane.href}
                    className="text-link-quiet inline-flex items-center gap-2"
                  >
                    Browse {lane.title.toLowerCase()}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <div
                  className={`grid gap-4 ${
                    lane.items.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
                  }`}
                >
                  {lane.items.map((item, index) => (
                    <article key={item.id} className="group space-y-3">
                      <div
                        className={`relative overflow-hidden rounded-media ${
                          index === 0 && lane.items.length >= 3
                            ? 'aspect-[4/5] sm:col-span-1'
                            : 'aspect-[4/5]'
                        }`}
                      >
                        <Image
                          src={item.src}
                          alt={item.alt}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 22vw"
                        />
                      </div>
                      <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
                        <h4 className="text-sm font-medium text-text">{item.caption}</h4>
                        <span className="text-eyebrow shrink-0" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16">
          <Link href="/menu" className="text-link-quiet inline-flex items-center gap-2">
            View full menu
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
