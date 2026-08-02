import type { CmsPageSnapshot } from '@7oz/shared-types';
import type { ReactNode } from 'react';

import { AboutPreviewSection } from '@/features/home/components/about-preview-section';
import { CtaBandSection } from '@/features/home/components/cta-band-section';
import { FeaturedMenuSection } from '@/features/home/components/featured-menu-section';
import { GalleryPreviewSection } from '@/features/home/components/gallery-preview-section';
import { HeroSection } from '@/features/home/components/hero-section';
import { LocationsSection } from '@/features/home/components/locations-section';
import { TestimonialsSection } from '@/features/home/components/testimonials-section';
import { BlogsPreviewSection } from '@/features/blogs/components/blogs-preview-section';
import { NewMenuSection } from '@/features/menu/components/new-menu-section';
import type { GalleryPreviewImage } from '@/features/home/lib/gallery-preview';
import type { MenuItem } from '@/features/menu/lib/menu-catalog';
import type { BlogPost } from '@/services/blog';

const fallbackHero = {
  title: 'Espresso Cafe',
  subtitle: 'Crafted espresso. Calm spaces. Timeless ritual.',
  ctaPrimary: { label: 'Reserve a Table', href: '/reservations' },
  ctaSecondary: { label: 'Explore Menu', href: '/menu' },
};

const fallbackFeaturedMenu = {
  heading: 'Signature Selections',
  description: 'Coffee, house drinks, and pastry — a taste of what we craft each day.',
};

const fallbackAbout = {
  heading: 'From Jakarta to Tashkent',
  description:
    "Jakarta's finest has arrived in the heart of Tashkent — bringing Indonesian coffee heritage to an international stage.",
  cta: { label: 'Our Story', href: '/about' },
};

const fallbackGallery = {
  heading: 'Gallery',
  description: 'Moments from City Park — and a door into every 7Oz room.',
  limit: 6,
};

const fallbackBlogs = {
  heading: 'News & Events',
  description: 'Stories from the cafe — openings, visits, and moments worth sharing.',
  limit: 3,
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
  blogPosts?: BlogPost[];
  galleryPreviewImages?: GalleryPreviewImage[];
  featuredMenu?: {
    coffee: MenuItem[];
    nonCoffee: MenuItem[];
    pastries: MenuItem[];
  };
  newMenuItems?: MenuItem[];
}

export function HomePageView({
  homepage,
  blogPosts = [],
  galleryPreviewImages = [],
  featuredMenu = { coffee: [], nonCoffee: [], pastries: [] },
  newMenuItems = [],
}: HomePageViewProps) {
  const sections = homepage?.sections.filter((section) => section.isEnabled) ?? [];

  function renderFeaturedMenu(data: Record<string, unknown>, key: string) {
    return (
      <FeaturedMenuSection
        key={key}
        data={data}
        coffee={featuredMenu.coffee}
        nonCoffee={featuredMenu.nonCoffee}
        pastries={featuredMenu.pastries}
      />
    );
  }

  function renderNewMenu(key: string) {
    if (newMenuItems.length === 0) {
      return null;
    }
    return <NewMenuSection key={key} items={newMenuItems} />;
  }

  if (sections.length === 0) {
    return (
      <main>
        <HeroSection data={fallbackHero} />
        {renderNewMenu('new-menu-fallback')}
        {renderFeaturedMenu(fallbackFeaturedMenu, 'featured-menu-fallback')}
        <AboutPreviewSection data={fallbackAbout} />
        <LocationsSection />
        <GalleryPreviewSection data={fallbackGallery} images={galleryPreviewImages} />
        <BlogsPreviewSection data={fallbackBlogs} posts={blogPosts} />
        <TestimonialsSection data={fallbackTestimonials} />
        <CtaBandSection data={fallbackMembership} tone="accent" />
        <CtaBandSection data={fallbackReservation} tone="primary" />
      </main>
    );
  }

  const hasLocationsSection = sections.some((section) => section.code === 'locations');
  const hasCmsNewMenu = sections.some((section) => section.code === 'new_menu');
  const rendered: ReactNode[] = [];
  let newMenuRendered = hasCmsNewMenu;

  for (const section of sections) {
    switch (section.code) {
      case 'hero':
        rendered.push(<HeroSection key={section.id} data={section.data} />);
        if (!newMenuRendered) {
          rendered.push(renderNewMenu(`new-menu-after-${section.id}`));
          newMenuRendered = true;
        }
        break;
      case 'new_menu':
        rendered.push(renderNewMenu(section.id));
        newMenuRendered = true;
        break;
      case 'featured_menu':
        if (!newMenuRendered) {
          rendered.push(renderNewMenu(`new-menu-before-${section.id}`));
          newMenuRendered = true;
        }
        rendered.push(renderFeaturedMenu(section.data, section.id));
        break;
      case 'about_preview':
        rendered.push(
          <div key={section.id}>
            <AboutPreviewSection data={section.data} />
            {!hasLocationsSection ? <LocationsSection /> : null}
          </div>,
        );
        break;
      case 'locations':
        rendered.push(<LocationsSection key={section.id} />);
        break;
      case 'gallery_preview':
        rendered.push(
          <GalleryPreviewSection
            key={section.id}
            data={section.data}
            images={galleryPreviewImages}
          />,
        );
        break;
      case 'blogs_preview':
        rendered.push(
          <BlogsPreviewSection key={section.id} data={section.data} posts={blogPosts} />,
        );
        break;
      case 'membership_promo':
        rendered.push(<CtaBandSection key={section.id} data={section.data} tone="accent" />);
        break;
      case 'reservation_cta':
        rendered.push(<CtaBandSection key={section.id} data={section.data} tone="primary" />);
        break;
      case 'testimonials':
        rendered.push(<TestimonialsSection key={section.id} data={section.data} />);
        break;
      default:
        break;
    }
  }

  if (!newMenuRendered) {
    rendered.push(renderNewMenu('new-menu-end'));
  }

  if (!hasLocationsSection && !sections.some((section) => section.code === 'about_preview')) {
    rendered.push(<LocationsSection key="locations-fallback" />);
  }

  return <main>{rendered}</main>;
}
