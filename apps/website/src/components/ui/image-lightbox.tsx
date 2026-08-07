'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
}

export function ImageLightbox({ images, index, onClose, onChange }: ImageLightboxProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const isOpen = index !== null && images.length > 0;
  const active = isOpen ? images[index] : null;
  const hasMultiple = images.length > 1;

  const go = useCallback(
    (direction: -1 | 1) => {
      if (index === null || images.length === 0) {
        return;
      }
      const next = (index + direction + images.length) % images.length;
      onChange(next);
    },
    [images.length, index, onChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft') {
        go(-1);
      } else if (event.key === 'ArrowRight') {
        go(1);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [go, isOpen, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && active ? (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex max-h-[100dvh] items-center justify-center overflow-y-auto p-4 md:p-8"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-ink/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 flex max-h-[min(100dvh-2rem,960px)] w-full max-w-5xl flex-col items-center overflow-y-auto"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-4 flex w-full items-center justify-between gap-4 text-white">
              <p
                id={titleId}
                className="min-w-0 truncate text-sm font-medium tracking-wide text-white/80"
              >
                {active.caption ?? active.alt}
                {hasMultiple ? (
                  <span className="ml-3 text-white/45">
                    {index! + 1} / {images.length}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex min-h-0 w-full items-center justify-center">
              {hasMultiple ? (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="absolute left-0 z-20 hidden h-12 w-12 -translate-x-2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 md:inline-flex lg:-translate-x-16"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : null}

              <AnimatePresence mode="wait">
                <motion.figure
                  key={active.src}
                  className="relative max-h-[min(58dvh,720px)] w-full overflow-hidden rounded-media bg-black/20 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:max-h-[min(72dvh,900px)]"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 1.01 }}
                  transition={{ duration: 0.22 }}
                >
                  <Image
                    src={active.src}
                    alt={active.alt}
                    width={1200}
                    height={1600}
                    className="mx-auto max-h-[min(58dvh,720px)] w-auto object-contain md:max-h-[min(72dvh,900px)]"
                    sizes="(max-width: 1024px) 92vw, 960px"
                    priority
                  />
                </motion.figure>
              </AnimatePresence>

              {hasMultiple ? (
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="absolute right-0 z-20 hidden h-12 w-12 translate-x-2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 md:inline-flex lg:translate-x-16"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {hasMultiple ? (
              <div className="mt-4 flex shrink-0 gap-3 md:hidden">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next image"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
