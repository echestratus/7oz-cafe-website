import type { ReactNode } from 'react';

import type { CmsPageSnapshot } from '@7oz/shared-types';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

interface SiteShellProps {
  children: ReactNode;
  footer: CmsPageSnapshot | null;
  headerTone?: 'overlay' | 'solid';
}

export function SiteShell({ children, footer, headerTone = 'solid' }: SiteShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader tone={headerTone} />
      <div className="flex-1">{children}</div>
      <SiteFooter footer={footer} />
    </div>
  );
}
