'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import { Reveal } from '@/components/ui/reveal';
import type { MenuCategory, MenuItem } from '@/features/menu/lib/menu-catalog';
import { isNewMenuItem } from '@/features/menu/lib/new-menu';

interface MenuCategorySectionsProps {
  categories: MenuCategory[];
}

export function MenuCategorySections({ categories }: MenuCategorySectionsProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const flatImages: LightboxImage[] = useMemo(
    () =>
      categories.flatMap((category) =>
        category.items.map((item) => ({
          src: item.src,
          alt: item.alt,
          caption: item.caption,
        })),
      ),
    [categories],
  );

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    let index = 0;
    for (const category of categories) {
      for (const item of category.items) {
        map.set(item.id, index);
        index += 1;
      }
    }
    return map;
  }, [categories]);

  if (categories.every((category) => category.items.length === 0)) {
    return (
      <p className="text-sm text-text-secondary">Menu photos will appear here once assets are synced.</p>
    );
  }

  return (
    <>
      <nav aria-label="Menu categories" className="mb-12 flex flex-wrap gap-3">
        {categories
          .filter((category) => category.items.length > 0)
          .map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="rounded-full border border-border bg-surface px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:border-primary hover:text-primary"
            >
              {category.label}
              <span className="ml-2 text-text-muted">{category.items.length}</span>
            </a>
          ))}
      </nav>

      <div className="space-y-20 md:space-y-28">
        {categories.map((category) => {
          if (category.items.length === 0) {
            return null;
          }

          return (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-28 space-y-10"
              aria-labelledby={`${category.id}-heading`}
            >
              <Reveal>
                <div className="max-w-2xl space-y-3 border-t border-border pt-8">
                  <p className="text-eyebrow">
                    {category.group === 'beverages' ? 'Beverages' : 'Pastries'}
                  </p>
                  <h2 id={`${category.id}-heading`} className="text-section-title text-text">
                    {category.label}
                  </h2>
                  <p className="text-sm leading-relaxed text-text-secondary">{category.description}</p>
                </div>
              </Reveal>

              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {category.items.map((item, index) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    isNew={isNewMenuItem(item)}
                    delay={(index % 6) * 0.04}
                    onOpen={() => setPreviewIndex(indexById.get(item.id) ?? 0)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ImageLightbox
        images={flatImages}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />
    </>
  );
}

function MenuItemCard({
  item,
  isNew,
  delay,
  onOpen,
}: {
  item: MenuItem;
  isNew: boolean;
  delay: number;
  onOpen: () => void;
}) {
  return (
    <Reveal delay={delay}>
      <article className="group space-y-5">
        <button
          type="button"
          onClick={onOpen}
          className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-media text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={`Preview ${item.caption}`}
        >
          <Image
            src={item.src}
            alt={item.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {isNew ? (
            <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
              New
            </span>
          ) : null}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            View photo
          </span>
        </button>
        <h3 className="text-card-title text-text">{item.caption}</h3>
      </article>
    </Reveal>
  );
}
