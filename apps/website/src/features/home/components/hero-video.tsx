'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useRef, useState } from 'react';

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  async function toggleSound() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      try {
        await video.play();
      } catch {
        // Browsers may block unmuted playback; fall back to muted.
        setIsMuted(true);
      }
    }
  }

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        poster="/assets/gallery/7oz-1.jpeg"
        aria-hidden="true"
      >
        <source src="/assets/home/hero-page-video.mp4" type="video/mp4" />
      </video>

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
    </>
  );
}
