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

const fallbackFeaturedMenu = {
  heading: 'Signature Selections',
  description: 'A curated taste of our espresso and pastry craft.',
};

const fallbackAbout = {
  heading: 'Our Craft',
  description: 'We roast and pull with intention—seven ounces of focus in every cup.',
  cta: { label: 'Our Story', href: '/about' },
};

const fallbackGallery = {
  heading: 'Gallery',
  description: 'Moments from the cafe floor.',
  limit: 6,
};

const fallbackTestimonials = {
  heading: 'Guest Voices',
  items: [
    {
      name: 'Maya',
      review: 'Quiet, precise, and worth the pause. The espresso tastes intentional.',
    },
    {
      name: 'Arif',
      review: 'A calm room with cups that feel crafted. I keep coming back for the latte.',
    },
  ],
};

const fallbackMembership = {
  heading: 'Membership',
  description: 'Join for priority reservations and member rewards.',
  cta: { label: 'Become a Member', href: '/membership' },
};

const fallbackReservation = {
  heading: 'Reserve Your Spot',
  description: 'Book a table for coffee, conversation, and quiet hours.',
  cta: { label: 'Book Now', href: '/reservations' },
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
        <FeaturedMenuSection data={fallbackFeaturedMenu} />
        <AboutPreviewSection data={fallbackAbout} />
        <GalleryPreviewSection data={fallbackGallery} />
        <TestimonialsSection data={fallbackTestimonials} />
        <CtaBandSection data={fallbackMembership} tone="accent" />
        <CtaBandSection data={fallbackReservation} tone="primary" />
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
