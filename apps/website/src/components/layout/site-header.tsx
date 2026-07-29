import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/ui/container';

const navItems = [
  { href: '/menu', label: 'Menu' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/membership', label: 'Membership' },
  { href: '/reservations', label: 'Reserve' },
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
          : 'sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md'
      }
    >
      <Container className="flex items-center justify-between py-5 md:py-6">
        <Link
          href="/"
          className={`flex items-center gap-3 ${isOverlay ? 'text-white' : 'text-text'}`}
          aria-label="7Oz Espresso Cafe home"
        >
          <Image
            src="/assets/logo/logo-7-oz-espresso-scaled.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="font-heading text-2xl tracking-tight">7Oz</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm tracking-[0.08em] uppercase transition-colors duration-200 ${
                isOverlay
                  ? 'text-white/80 hover:text-white'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/reservations"
            className={`rounded-[12px] border px-4 py-2 text-sm transition-colors duration-200 ${
              isOverlay
                ? 'border-white/50 text-white hover:bg-white/10'
                : 'border-border text-text hover:bg-surface-secondary'
            }`}
          >
            Reserve
          </Link>
        </nav>

        <nav aria-label="Mobile" className="flex items-center gap-4 md:hidden">
          <Link
            href="/menu"
            className={`text-sm ${isOverlay ? 'text-white/90' : 'text-text-secondary'}`}
          >
            Menu
          </Link>
          <Link
            href="/reservations"
            className={`rounded-[12px] border px-3 py-2 text-sm ${
              isOverlay ? 'border-white/50 text-white' : 'border-border text-text'
            }`}
          >
            Reserve
          </Link>
        </nav>
      </Container>
    </header>
  );
}
