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
  description: 'Players, ministers, and visiting friends — in their own words.',
  items: [
    {
      name: 'Dr. Zulkifli Hasan',
      role: 'Minister in the Prime Minister’s Department (Religious Affairs), Malaysia',
      review:
        "I'm a coffee enthusiast, and I rarely return to the same café two days in a row. After trying the coffee yesterday, I came back again today—it really is that good.",
      avatarSrc: '/assets/reviews/dr-zulkifli-hasan.webp',
      videoSrc: '/assets/reviews/dr-zulkifli-hasan.mp4',
    },
    {
      name: 'Shady Al-Suleiman',
      review:
        "Alhamdulillah, I've tried this coffee, and it's a really good coffee. Very enjoyable—Alhamdulillah.",
      avatarSrc: '/assets/reviews/shady-al-suleiman.webp',
      videoSrc: '/assets/reviews/shady-al-suleiman.mp4',
    },
    {
      name: 'Evgenij Miroshnichenko',
      role: 'Grandmaster, Ukraine',
      review:
        "I'm not really a coffee expert — more of a chess expert from Ukraine. I go by Miro. I discovered this place, and the coffee is fantastic. I've bought packages to take home. Everything is perfect. I love the guys, and I love the place. I hope we'll have more coffee shops like this.",
      avatarSrc: '/assets/reviews/evgenij-miroshnichenko.webp',
      videoSrc: '/assets/reviews/evgenij-miroshnichenko.mp4',
    },
    {
      name: 'Aleksa Strikovic',
      role: 'Grandmaster',
      review:
        "Good afternoon. We're here at this wonderful place. Very good coffee, very tasty coffee, and a very nice guy serving us. Everything is fine. I recommend this place.",
      avatarSrc: '/assets/reviews/aleksa-strikovic.webp',
      videoSrc: '/assets/reviews/aleksa-strikovic.mp4',
    },
    {
      name: 'Sherkia Andrew',
      review:
        "Hi, I'm Sherkia Andrew. We're here at 7Oz Cafe, and they really have good quality beverages. I have to recommend it — the team checking in on us, asking what we want, asking if we need anything more. I really admire the effort. Honestly, a 10 out of 10 experience.",
      avatarSrc: '/assets/reviews/sherkia-andrew.webp',
      videoSrc: '/assets/reviews/sherkia-andrew.mp4',
    },
    {
      name: 'Diajeng Theresa Singgih',
      role: "Indonesian Women's Chess Olympiad",
      review:
        "I'm Diajeng Theresa Singgih, from Indonesia's women's Olympiad chess team. I just ordered matcha — sometimes coffee, sometimes matcha — ahead of competing for Indonesia. 7Oz Espresso Cafe is very cozy. I really love the matcha, and the coffee wakes me up in a good way. I come here every day while I'm in Uzbekistan. You have to try it.",
      avatarSrc: '/assets/reviews/diajeng-theresa-singgih.webp',
      videoSrc: '/assets/reviews/diajeng-theresa-singgih.mp4',
    },
    {
      name: 'Omar Phelps',
      role: 'International Master',
      review:
        "I'm at 7Oz. Someone told me to try this coffee — and when I did, I swear it's the best coffee of all time. The best coffee on the planet. Come try it. Come to 7Oz. You won't regret it. Santé — health and happiness.",
      avatarSrc: '/assets/reviews/omar-phelps.webp',
      videoSrc: '/assets/reviews/omar-phelps.mp4',
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
