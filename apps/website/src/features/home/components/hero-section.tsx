import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { asCta, asString } from '@/services/cms';

interface HeroSectionProps {
  data: Record<string, unknown>;
}

export function HeroSection({ data }: HeroSectionProps) {
  const subtitle = asString(
    data.subtitle,
    'Crafted espresso. Calm spaces. Timeless ritual.',
  );
  const primary = asCta(data.ctaPrimary) ?? { label: 'Reserve a Table', href: '/reservations' };
  const secondary = asCta(data.ctaSecondary) ?? { label: 'Explore Menu', href: '/menu' };

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/gallery/7oz-1.jpeg"
        aria-hidden="true"
      >
        <source src="/assets/home/hero-page-video.mp4" type="video/mp4" />
      </video>

      {/* Bottom-weighted veil: keeps video open at the top, readable CTA zone at the bottom. */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/55 to-transparent"
        aria-hidden="true"
      />

      <Container className="relative z-10 flex min-h-[100svh] flex-col justify-end pb-24 pt-32 md:pb-32">
        <div className="max-w-2xl space-y-9">
          {/* Soft local light behind the dark logo — invisible plate, just atmosphere. */}
          <div className="relative inline-block max-w-full">
            <span
              className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.28),transparent_68%)] blur-2xl"
              aria-hidden="true"
            />
            <BrandLogo size="hero" onDark priority />
          </div>
          <p className="max-w-xl text-quote text-white/90">{subtitle}</p>
          <div className="flex flex-wrap gap-4 pt-1">
            <Button href={primary.href} variant="inverse">
              {primary.label}
            </Button>
            <Button href={secondary.href} variant="onDark">
              {secondary.label}
            </Button>
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
          aria-hidden="true"
        >
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.24em] text-white/50">
            Scroll
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </div>
      </Container>
    </section>
  );
}
