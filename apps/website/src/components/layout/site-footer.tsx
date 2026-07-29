import Link from 'next/link';

import type { CmsPageSnapshot } from '@7oz/shared-types';

import { Container } from '@/components/ui/container';
import { asString, getSection } from '@/services/cms';

interface SiteFooterProps {
  footer: CmsPageSnapshot | null;
}

export function SiteFooter({ footer }: SiteFooterProps) {
  const main = getSection(footer, 'footer_main');
  const social = getSection(footer, 'social_links');

  const tagline = asString(main?.data.tagline, 'Seven ounces of care.');
  const copyright = asString(main?.data.copyright, '© 7Oz Espresso Cafe');
  const links = Array.isArray(main?.data.links) ? main.data.links : [];

  return (
    <footer className="border-t border-border bg-surface-secondary">
      <Container className="flex flex-col gap-10 py-16 md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-4">
          <p className="font-heading text-3xl text-text">7Oz</p>
          <p className="text-base text-text-secondary">{tagline}</p>
        </div>

        <div className="flex flex-col gap-6">
          <nav aria-label="Footer" className="flex flex-wrap gap-6">
            {links.map((item) => {
              if (typeof item !== 'object' || item === null) {
                return null;
              }
              const record = item as Record<string, unknown>;
              const label = asString(record.label);
              const href = asString(record.href);
              if (!label || !href) {
                return null;
              }
              return (
                <Link
                  key={`${href}-${label}`}
                  href={href}
                  className="text-sm text-text-secondary transition-colors duration-200 hover:text-text"
                >
                  {label}
                </Link>
              );
            })}
            <Link href="/menu" className="text-sm text-text-secondary hover:text-text">
              Menu
            </Link>
            <Link href="/gallery" className="text-sm text-text-secondary hover:text-text">
              Gallery
            </Link>
          </nav>

          <div className="flex flex-wrap gap-4 text-sm text-text-muted">
            {asString(social?.data.instagram) ? <span>Instagram</span> : null}
            {asString(social?.data.facebook) ? <span>Facebook</span> : null}
            <span>{copyright}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
