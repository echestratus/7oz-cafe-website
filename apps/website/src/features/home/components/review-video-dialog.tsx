'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ReviewVideoDialogProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  poster?: string;
}

export function ReviewVideoDialog({ open, onClose, src, title, poster }: ReviewVideoDialogProps) {
  const titleId = useId();
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const video = videoRef.current;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      video?.pause();
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="review-video"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-[100] flex max-h-[100dvh] items-center justify-center overflow-y-auto p-4 md:p-8"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close video"
            className="absolute inset-0 bg-text/70"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 flex max-h-[min(100dvh-2rem,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-media bg-surface shadow-[var(--shadow-soft)]"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4">
              <h2 id={titleId} className="min-w-0 truncate text-sm font-medium text-text">
                {title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-text transition-colors hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="Close video dialog"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto bg-text">
              <video
                ref={videoRef}
                className="aspect-video max-h-[min(70dvh,720px)] w-full object-contain"
                src={src}
                poster={poster}
                controls
                playsInline
                preload="metadata"
              >
                Your browser does not support embedded video.
              </video>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
