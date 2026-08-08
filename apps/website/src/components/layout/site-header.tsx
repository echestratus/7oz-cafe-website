import Link from 'next/link';

import { BrandLogo } from '@/components/brand/brand-logo';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SITE_NAV_ITEMS } from '@/components/layout/site-nav-items';
import { Container } from '@/components/ui/container';
import { AccountNav } from '@/features/auth/components/account-nav';

interface SiteHeaderProps {
  tone?: 'overlay' | 'solid';
}

export function SiteHeader({ tone = 'solid' }: SiteHeaderProps) {
  const isOverlay = tone === 'overlay';

  return (
    <header
      className={
        isOverlay
          ? 'absolute inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]'
          : 'sticky top-0 z-40 border-b border-border/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md'
      }
    >
      <Container className="flex items-center justify-between py-3 md:py-5">
        <Link href="/" aria-label="7Oz Espresso Cafe home" className="inline-flex shrink-0">
          <BrandLogo size="header" onDark={isOverlay} priority />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
          {SITE_NAV_ITEMS.map((item) => (
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
          <AccountNav tone={tone} />
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

        <div className="flex items-center gap-3 lg:hidden">
          <MobileNav tone={tone} />
        </div>
      </Container>
    </header>
  );
}
