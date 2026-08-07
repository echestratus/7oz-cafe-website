import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';

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

  const [leadItem, secondaryItem, ...collectionItems] = items;

  return (
    <section
      className={cx(
        'section-pad relative isolate overflow-hidden bg-surface-highlight text-text',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative">
        <Reveal className="mb-12 md:mb-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <SectionIntro
              eyebrow="The seasonal edit"
              title="Meet the new menu"
              description="Fresh signatures, bright fruit, and familiar coffee reimagined — spotlighted here for three months before they settle into the regular menu."
              titleAs={titleAs}
            />

            <div className="flex items-center gap-4 border-l border-border pl-5 lg:max-w-xs">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="space-y-1">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
                  Featured window
                </p>
                <p className="text-sm text-text-secondary">{formatCampaignWindow()}</p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
          {leadItem ? (
            <Reveal className="lg:col-span-7">
              <FeaturedNewMenuCard item={leadItem} index={0} size="large" />
            </Reveal>
          ) : null}

          {secondaryItem ? (
            <Reveal delay={0.05} className="lg:col-span-5">
              <FeaturedNewMenuCard item={secondaryItem} index={1} size="small" />
            </Reveal>
          ) : null}
        </div>

        <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-x-6">
          {collectionItems.map((item, index) => (
            <Reveal key={item.id} delay={(index % 3) * 0.05}>
              <NewMenuCard item={item} index={index + 2} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between md:mt-16">
          <p className="max-w-lg text-sm leading-relaxed text-text-secondary">
            Spotlighted for three months — after that, these drinks remain on the regular menu.
          </p>
          {showBrowseLink ? (
            <Link
              href="/menu#new-menu"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-7 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-inverse transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Explore new menu
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <a
              href="#coffee"
              className="inline-flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text-secondary transition-colors hover:text-text"
            >
              Continue to all drinks
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </Reveal>
      </Container>
    </section>
  );
}

function FeaturedNewMenuCard({
  item,
  index,
  size,
}: {
  item: MenuItem;
  index: number;
  size: 'large' | 'small';
}) {
  return (
    <article
      className={cx(
        'group relative overflow-hidden rounded-media',
        size === 'large' ? 'min-h-[24rem] md:min-h-[38rem]' : 'min-h-[22rem] md:min-h-[38rem]',
      )}
    >
      <Image
        src={item.src}
        alt={item.alt}
        fill
        priority={index === 0}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes={size === 'large' ? '(max-width: 1024px) 100vw, 58vw' : '(max-width: 1024px) 100vw, 42vw'}
      />
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5"
        aria-hidden="true"
      />
      <span className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary md:left-7 md:top-7">
        New arrival
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-8">
        <div className="space-y-2">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-white/55">
            {item.category === 'coffee' ? 'Coffee creation' : 'House refreshment'}
          </p>
          <h3
            className={cx(
              'font-heading leading-tight text-white',
              size === 'large' ? 'text-3xl md:text-5xl' : 'text-3xl md:text-4xl',
            )}
          >
            {item.caption}
          </h3>
        </div>
        <span className="shrink-0 text-[0.6875rem] font-semibold tracking-[0.16em] text-white/45">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </article>
  );
}

function NewMenuCard({ item, index }: { item: MenuItem; index: number }) {
  return (
    <article className="group space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-media">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
          New
        </span>
      </div>
      <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
        <div className="space-y-1">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-text-muted">
            {item.category === 'coffee' ? 'Coffee' : 'Non-coffee'}
          </p>
          <h3 className="font-heading text-xl text-text md:text-2xl">{item.caption}</h3>
        </div>
        <span className="pt-1 text-[0.625rem] font-semibold tracking-[0.16em] text-text-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
    </article>
  );
}
