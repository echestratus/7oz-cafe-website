'use client';

import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Full-bleed hero loop: poster first, then muted video after idle/in-view.
 * Keeps LCP on the poster instead of waiting for a multi-MB MP4.
 */
export function HeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
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

    let cancelled = false;

    async function startMuted(player: HTMLVideoElement) {
      player.muted = true;
      try {
        await player.play();
        if (!cancelled) {
          setIsMuted(true);
        }
      } catch {
        // Ignore if muted playback is blocked until interaction.
      }
    }

    void startMuted(video);

    return () => {
      cancelled = true;
    };
  }, [shouldLoadVideo]);

  async function toggleSound() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      try {
        await video.play();
      } catch {
        video.muted = true;
        setIsMuted(true);
      }
    }
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      {shouldLoadVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="none"
          poster="/assets/gallery/city-park/7oz-1.webp"
          aria-hidden="true"
        >
          <source
            src="/assets/home/hero-page-video-mobile.mp4"
            type="video/mp4"
            media="(max-width: 768px)"
          />
          <source src="/assets/home/hero-page-video.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/assets/gallery/city-park/7oz-1.webp"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      )}

      {shouldLoadVideo ? (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute bottom-8 right-4 z-20 inline-flex h-11 min-h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/35 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bottom-10 md:right-8"
          aria-label={isMuted ? 'Unmute hero video' : 'Mute hero video'}
          aria-pressed={!isMuted}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
}
