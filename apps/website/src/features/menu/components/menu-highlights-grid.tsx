'use client';

import Image from 'next/image';
import { useState } from 'react';

import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import { Reveal } from '@/components/ui/reveal';

interface MenuHighlightsGridProps {
  items: LightboxImage[];
}

export function MenuHighlightsGrid({ items }: MenuHighlightsGridProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {items.map((item, index) => (
          <Reveal key={item.src} delay={(index % 6) * 0.04}>
            <article className="group space-y-5">
              <button
                type="button"
                onClick={() => setPreviewIndex(index)}
                className="relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-media text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label={`Preview ${item.caption ?? item.alt}`}
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  View photo
                </span>
              </button>
              <h2 className="text-card-title text-text">{item.caption ?? item.alt}</h2>
            </article>
          </Reveal>
        ))}
      </div>

      <ImageLightbox
        images={items}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />
    </>
  );
}
