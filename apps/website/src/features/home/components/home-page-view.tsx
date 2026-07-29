import type { CmsPageSnapshot } from '@7oz/shared-types';

import { AboutPreviewSection } from '@/features/home/components/about-preview-section';
import { CtaBandSection } from '@/features/home/components/cta-band-section';
import { FeaturedMenuSection } from '@/features/home/components/featured-menu-section';
import { GalleryPreviewSection } from '@/features/home/components/gallery-preview-section';
import { HeroSection } from '@/features/home/components/hero-section';
import { TestimonialsSection } from '@/features/home/components/testimonials-section';

const fallbackHero = {
  title: 'Espresso Cafe',
  subtitle: 'Crafted espresso. Calm spaces. Timeless ritual.',
  ctaPrimary: { label: 'Reserve a Table', href: '/reservations' },
  ctaSecondary: { label: 'Explore Menu', href: '/menu' },
};

interface HomePageViewProps {
  homepage: CmsPageSnapshot | null;
}

export function HomePageView({ homepage }: HomePageViewProps) {
  const sections = homepage?.sections.filter((section) => section.isEnabled) ?? [];

  if (sections.length === 0) {
    return (
      <main>
        <HeroSection data={fallbackHero} />
      </main>
    );
  }

  return (
    <main>
      {sections.map((section) => {
        switch (section.code) {
          case 'hero':
            return <HeroSection key={section.id} data={section.data} />;
          case 'featured_menu':
            return <FeaturedMenuSection key={section.id} data={section.data} />;
          case 'about_preview':
            return <AboutPreviewSection key={section.id} data={section.data} />;
          case 'gallery_preview':
            return <GalleryPreviewSection key={section.id} data={section.data} />;
          case 'membership_promo':
            return <CtaBandSection key={section.id} data={section.data} tone="accent" />;
          case 'reservation_cta':
            return <CtaBandSection key={section.id} data={section.data} tone="primary" />;
          case 'testimonials':
            return <TestimonialsSection key={section.id} data={section.data} />;
          default:
            return null;
        }
      })}
    </main>
  );
}
