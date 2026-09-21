'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useState } from 'react';

import { Reveal } from '@/components/ui/reveal';
import { ReviewVideoDialog } from '@/features/home/components/review-video-dialog';

export interface TestimonialItem {
  name: string;
  review: string;
  role?: string;
  avatarSrc?: string;
  videoSrc?: string;
}

interface TestimonialCardProps {
  item: TestimonialItem;
  delay?: number;
  featured?: boolean;
}

function PlayPoster({
  item,
  featured,
  onPlay,
}: {
  item: TestimonialItem;
  featured: boolean;
  onPlay: () => void;
}) {
  const posterSrc = item.avatarSrc;
  if (!posterSrc) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play video review by ${item.name}`}
      className={
        featured
          ? 'group relative mx-auto block aspect-[9/16] w-full max-w-[18rem] overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:mx-0'
          : 'group relative block aspect-[9/16] w-full overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
      }
    >
      <Image
        src={posterSrc}
        alt=""
        fill
        className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
        sizes={featured ? '(max-width: 768px) 70vw, 288px' : '(max-width: 768px) 100vw, 33vw'}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-text/45 via-transparent to-transparent" aria-hidden="true" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/92 text-primary shadow-[var(--shadow-soft)] transition-transform duration-200 group-hover:scale-105">
          <Play className="size-5 fill-current" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

export function TestimonialCard({ item, delay = 0, featured = false }: TestimonialCardProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const hasVideo = Boolean(item.videoSrc);
  const hasPoster = Boolean(item.avatarSrc);

  return (
    <>
      <Reveal delay={delay} className={featured ? 'h-full' : undefined}>
        <article
          className={
            featured
              ? 'grid h-full items-center gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-12 lg:gap-16'
              : 'flex h-full flex-col gap-5'
          }
        >
          {hasPoster && hasVideo ? (
            <PlayPoster item={item} featured={featured} onPlay={() => setVideoOpen(true)} />
          ) : item.avatarSrc ? (
            <div
              className={
                featured
                  ? 'relative mx-auto aspect-[9/16] w-full max-w-[18rem] overflow-hidden rounded-media md:mx-0'
                  : 'relative mx-auto size-20 overflow-hidden rounded-full'
              }
            >
              <Image
                src={item.avatarSrc}
                alt={item.name}
                fill
                className="object-cover object-top"
                sizes={featured ? '(max-width: 768px) 70vw, 288px' : '80px'}
              />
            </div>
          ) : (
            <span className="block h-px w-10 bg-accent/50" aria-hidden="true" />
          )}

          <div className={featured ? 'space-y-6 md:max-w-xl' : 'flex flex-1 flex-col gap-4'}>
            <blockquote
              className={
                featured
                  ? 'text-quote text-text'
                  : 'text-quote-card line-clamp-5 text-text'
              }
            >
              &ldquo;{item.review}&rdquo;
            </blockquote>
            <div className={featured ? 'space-y-2' : 'mt-auto space-y-1'}>
              <p className="text-eyebrow text-accent">{item.name}</p>
              {item.role ? (
                <p className="max-w-md text-sm leading-relaxed text-text-secondary">{item.role}</p>
              ) : null}
            </div>
          </div>
        </article>
      </Reveal>

      {item.videoSrc ? (
        <ReviewVideoDialog
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          src={item.videoSrc}
          title={`Review by ${item.name}`}
          poster={item.avatarSrc}
          quote={item.review}
          attribution={item.role ? `${item.name}, ${item.role}` : item.name}
        />
      ) : null}
    </>
  );
}
