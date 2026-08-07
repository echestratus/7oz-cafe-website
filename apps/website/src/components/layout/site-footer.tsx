import Link from 'next/link';

import type { CmsPageSnapshot } from '@7oz/shared-types';

import { BrandLogo } from '@/components/brand/brand-logo';
import { Container } from '@/components/ui/container';
import { asString, getSection } from '@/services/cms';

interface SiteFooterProps {
  footer: CmsPageSnapshot | null;
}

const fallbackLinks = [
  { label: 'Menu', href: '/menu' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Blogs', href: '/blogs' },
  { label: 'About', href: '/about' },
  { label: 'Membership', href: '/membership' },
  { label: 'Loyalty', href: '/loyalty' },
  { label: 'Reservations', href: '/reservations' },
  { label: 'Contact', href: '/contact' },
] as const;

function parseLinks(items: unknown): Array<{ label: string; href: string }> {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.flatMap((item) => {
    if (typeof item !== 'object' || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    const label = asString(record.label);
    const href = asString(record.href);
    return label && href ? [{ label, href }] : [];
  });
}

export function SiteFooter({ footer }: SiteFooterProps) {
  const main = getSection(footer, 'footer_main');
  const social = getSection(footer, 'social_links');

  const tagline = asString(main?.data.tagline, 'Seven ounces of care.');
  const copyright = asString(main?.data.copyright, '© 7Oz Espresso Cafe');
  const cmsLinks = parseLinks(main?.data.links);
  const links = cmsLinks.length > 0 ? cmsLinks : [...fallbackLinks];
  const instagram = asString(social?.data.instagram);
  const facebook = asString(social?.data.facebook);

  return (
    <footer className="bg-ink text-white">
      <Container className="py-16 md:py-24">
        <div className="flex flex-col gap-14 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md space-y-7">
            <BrandLogo size="footer" onDark />
            <p className="text-quote text-white/85">{tagline}</p>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 sm:gap-x-12"
          >
            {links.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="text-nav text-white/60 transition-colors duration-200 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/12 pt-8 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>{copyright}</p>
          {instagram || facebook ? (
            <div className="flex gap-6">
              {instagram ? (
                <a
                  href={instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-200 hover:text-white"
                >
                  Instagram
                </a>
              ) : null}
              {facebook ? (
                <a
                  href={facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-200 hover:text-white"
                >
                  Facebook
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
