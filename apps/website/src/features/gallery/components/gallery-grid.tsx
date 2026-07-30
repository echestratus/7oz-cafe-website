'use client';

import Image from 'next/image';
import { useState } from 'react';

import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import { Reveal } from '@/components/ui/reveal';

interface GalleryGridProps {
  images: LightboxImage[];
}

export function GalleryGrid({ images }: GalleryGridProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (images.length === 0) {
    return <p className="text-lede">Gallery imagery will appear after asset sync.</p>;
  }

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <Reveal key={image.src} delay={(index % 6) * 0.04} className="mb-5 break-inside-avoid">
            <button
              type="button"
              onClick={() => setPreviewIndex(index)}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-media text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`Preview ${image.caption ?? image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={900}
                height={1200}
                className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                View photo
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <ImageLightbox
        images={images}
        index={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onChange={setPreviewIndex}
      />
    </>
  );
}
