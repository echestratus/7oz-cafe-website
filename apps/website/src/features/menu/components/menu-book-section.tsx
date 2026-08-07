'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';

const MENU_BOOK_PAGES: LightboxImage[] = [1, 2, 3, 4, 5, 6, 7].map((page) => ({
  src: `/assets/menu/menu-book-7oz/${page}.webp`,
  alt: `7Oz Cafe menu book, page ${page}`,
  caption: `Menu book · page ${page}`,
}));

export function MenuBookSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    setCanScrollLeft(track.scrollLeft > 8);
    setCanScrollRight(track.scrollLeft + track.clientWidth < track.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      track.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  function scrollByPage(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const page = track.querySelector('figure');
    const step = page ? page.clientWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="scrollbar-none -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-4 md:-mx-8 md:px-8"
        role="region"
        aria-label="Menu book pages"
      >
        {MENU_BOOK_PAGES.map((page, index) => (
          <figure
            key={page.src}
            className="w-[78%] shrink-0 snap-center overflow-hidden rounded-media bg-surface shadow-[var(--shadow-soft)] sm:w-[46%] lg:w-[31%] lg:snap-start"
          >
            <button
              type="button"
              onClick={() => setPreviewIndex(index)}
              className="group relative block w-full cursor-zoom-in text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`Preview ${page.caption}`}
            >
              <Image
                src={page.src}
                alt={page.alt}
                width={729}
                height={1024}
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 31vw"
                priority={index === 0}
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                View page
              </span>
            </button>
          </figure>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-sm text-text-muted">
          Tap a page to preview · swipe or use arrows to browse.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollLeft}
            aria-label="Previous menu page"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors duration-200 hover:bg-surface-secondary disabled:cursor-default disabled:opacity-35"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollRight}
            aria-label="Next menu page"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors duration-200 hover:bg-surface-secondary disabled:cursor-default disabled:opacity-35"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ImageLightbox
        images={MENU_BOOK_PAGES}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />
    </div>
  );
}
