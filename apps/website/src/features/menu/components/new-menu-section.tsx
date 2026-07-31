import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import type { MenuItem } from '@/features/menu/lib/menu-catalog';
import { getNewMenuWindow } from '@/features/menu/lib/new-menu';

interface NewMenuSectionProps {
  items: MenuItem[];
  /** Use page-level title sizing on /menu. */
  titleAs?: 'h1' | 'h2';
  /** When true, omit the outer page-style link (already on menu). */
  showBrowseLink?: boolean;
  className?: string;
}

function formatCampaignWindow(): string {
  const { start, end } = getNewMenuWindow();
  const formatter = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(' ');
}

export function NewMenuSection({
  items,
  titleAs = 'h2',
  showBrowseLink = true,
  className,
}: NewMenuSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className={cx('section-pad bg-ink text-white', className)}>
      <Container>
        <Reveal className="mb-12 md:mb-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              eyebrow="Just arrived"
              title="New Menu"
              description="A seasonal wave of cups from the bar — featured for three months while they settle into the book."
              titleAs={titleAs}
              tone="dark"
            />
            <p className="shrink-0 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-white/45">
              Featured {formatCampaignWindow()}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <Reveal key={item.id} delay={(index % 4) * 0.05}>
              <article className="group space-y-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-media">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
                    New
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-white/15 pt-3">
                  <h3 className="font-heading text-lg text-white md:text-xl">{item.caption}</h3>
                  <span className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/40">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {showBrowseLink ? (
          <Reveal className="mt-12 md:mt-14">
            <Link
              href="/menu#new-menu"
              className="inline-flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white/75 transition-colors hover:text-white"
            >
              See them on the menu
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Reveal>
        ) : null}
      </Container>
    </section>
  );
}
