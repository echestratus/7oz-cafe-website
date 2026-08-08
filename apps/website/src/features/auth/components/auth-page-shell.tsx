import type { ReactNode } from 'react';

import { PageMain } from '@/components/layout/page-main';
import { Container } from '@/components/ui/container';
import { SectionIntro } from '@/components/ui/section-intro';

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthPageShell({ eyebrow, title, description, children }: AuthPageShellProps) {
  return (
    <PageMain>
      <Container className="max-w-lg space-y-10">
        <SectionIntro
          eyebrow={eyebrow}
          title={title}
          description={description}
          titleAs="h1"
          className="max-w-lg"
        />
        {children}
      </Container>
    </PageMain>
  );
}
