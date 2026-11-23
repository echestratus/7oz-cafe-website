'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed hero loop: poster first, then audio-free video after idle/in-view.
 * Keeps LCP on the poster instead of waiting for a multi-MB MP4.
 */
export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let cancelled = false;

    const armLoad = () => {
      if (cancelled) {
        return;
      }
      setShouldLoadVideo(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        observer.disconnect();
        // Prefer idle scheduling; typeof avoids `in` narrowing window to never.
        if (typeof window.requestIdleCallback === 'function') {
          idleId = window.requestIdleCallback(armLoad, { timeout: 1200 });
        } else {
          timeoutId = window.setTimeout(armLoad, 200);
        }
      },
      { rootMargin: '0px', threshold: 0.15 },
    );

    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    // Keep the decorative video silent even when playback starts programmatically.
    video.muted = true;
    void video.play().catch(() => {
      // The poster remains visible if autoplay is blocked.
    });
  }, [shouldLoadVideo]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoadVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/assets/home/hadith-hotel-hero-poster.webp"
          aria-hidden="true"
        >
          <source
            src="/assets/home/hadith-hotel-hero-mobile-silent.mp4"
            type="video/mp4"
            media="(max-width: 768px)"
          />
          <source src="/assets/home/hadith-hotel-hero-silent.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/assets/home/hadith-hotel-hero-poster.webp"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}
    </div>
  );
}
