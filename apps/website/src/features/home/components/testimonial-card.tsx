'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
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

export function TestimonialCard({ item, delay = 0, featured = false }: TestimonialCardProps) {
  const [videoOpen, setVideoOpen] = useState(false);
  const hasVideo = Boolean(item.videoSrc);
  const hasAvatar = Boolean(item.avatarSrc);

  return (
    <>
      <Reveal
        delay={delay}
        className={
          featured
            ? 'grid items-center gap-10 md:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)] md:gap-16'
            : 'space-y-6'
        }
      >
        {hasAvatar ? (
          <div
            className={
              featured
                ? 'relative mx-auto aspect-[4/5] w-full max-w-[17.5rem] overflow-hidden rounded-media md:mx-0'
                : 'relative mx-auto size-20 overflow-hidden rounded-full'
            }
          >
            <Image
              src={item.avatarSrc!}
              alt={item.name}
              fill
              className="object-cover object-top"
              sizes={featured ? '(max-width: 768px) 70vw, 280px' : '80px'}
            />
          </div>
        ) : null}

        <div className="space-y-6">
          {!hasAvatar ? <span className="block h-px w-10 bg-accent/50" aria-hidden="true" /> : null}
          <p className="text-quote text-text">&ldquo;{item.review}&rdquo;</p>
          <div className="space-y-2">
            <p className="text-eyebrow text-accent">{item.name}</p>
            {item.role ? <p className="max-w-md text-sm leading-relaxed text-text-secondary">{item.role}</p> : null}
          </div>
          {hasVideo ? (
            <Button type="button" variant="outline" onClick={() => setVideoOpen(true)} className="gap-3">
              <Play className="size-4 fill-current" aria-hidden="true" />
              Watch video
            </Button>
          ) : null}
        </div>
      </Reveal>

      {item.videoSrc ? (
        <ReviewVideoDialog
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          src={item.videoSrc}
          title={`Review by ${item.name}`}
          poster={item.avatarSrc}
        />
      ) : null}
    </>
  );
}
