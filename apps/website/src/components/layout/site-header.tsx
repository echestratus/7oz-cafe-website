import Link from 'next/link';

import { BrandLogo } from '@/components/brand/brand-logo';
import { Container } from '@/components/ui/container';

const navItems = [
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/about', label: 'About' },
  { href: '/membership', label: 'Membership' },
  { href: '/loyalty', label: 'Loyalty' },
  { href: '/contact', label: 'Contact' },
] as const;

interface SiteHeaderProps {
  tone?: 'overlay' | 'solid';
}

export function SiteHeader({ tone = 'solid' }: SiteHeaderProps) {
  const isOverlay = tone === 'overlay';

  return (
    <header
      className={
        isOverlay
          ? 'absolute inset-x-0 top-0 z-40'
          : 'sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md'
      }
    >
      <Container className="flex items-center justify-between py-4 md:py-5">
        <Link href="/" aria-label="7Oz Espresso Cafe home" className="inline-flex shrink-0">
          <BrandLogo size="header" onDark={isOverlay} priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-nav transition-colors duration-200 ${
                isOverlay
                  ? 'text-white/78 hover:text-white'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/reservations"
            className={`rounded-full border px-5 py-2.5 text-nav transition-colors duration-200 ${
              isOverlay
                ? 'border-white/45 text-white hover:bg-white/10'
                : 'border-divider text-text hover:bg-surface-secondary'
            }`}
          >
            Reserve
          </Link>
        </nav>

        <nav aria-label="Mobile" className="flex items-center gap-4 lg:hidden">
          <Link
            href="/menu"
            className={`text-nav ${isOverlay ? 'text-white/90' : 'text-text-secondary'}`}
          >
            Menu
          </Link>
          <Link
            href="/reservations"
            className={`rounded-full border px-4 py-2 text-nav ${
              isOverlay ? 'border-white/45 text-white' : 'border-divider text-text'
            }`}
          >
            Reserve
          </Link>
        </nav>
      </Container>
    </header>
  );
}
