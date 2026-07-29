import { Button } from '@/components/ui/button';
import { asCta, asString } from '@/services/cms';

interface HeroSectionProps {
  data: Record<string, unknown>;
}

export function HeroSection({ data }: HeroSectionProps) {
  const brand = '7Oz';
  const title = asString(data.title, 'Espresso Cafe');
  const subtitle = asString(
    data.subtitle,
    'Crafted espresso. Calm spaces. Timeless ritual.',
  );
  const primary = asCta(data.ctaPrimary) ?? { label: 'Reserve a Table', href: '/contact' };
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

      <div className="absolute inset-0 bg-primary/40" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/25"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:px-8 md:pb-24">
        <div className="max-w-3xl space-y-6">
          <p className="font-heading text-5xl tracking-tight md:text-7xl lg:text-8xl">{brand}</p>
          <h1 className="max-w-2xl font-heading text-3xl leading-tight text-white/95 md:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-base text-white/80 md:text-lg">{subtitle}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button href={primary.href} variant="primary">
              {primary.label}
            </Button>
            <Button href={secondary.href} variant="secondary">
              {secondary.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
