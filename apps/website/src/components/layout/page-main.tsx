import type { ReactNode } from 'react';

/**
 * Top/bottom padding for pages under the sticky solid header (in-flow).
 * Overlay pages keep their own hero padding under the absolute header.
 */
export const SOLID_PAGE_PAD = 'pt-10 pb-24 md:pt-12 md:pb-32';

interface PageMainProps {
  children: ReactNode;
  className?: string;
}

export function PageMain({ children, className = '' }: PageMainProps) {
  return <main className={`${SOLID_PAGE_PAD} ${className}`.trim()}>{children}</main>;
}
