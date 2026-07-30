import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { asCta, asString } from '@/services/cms';

interface CtaBandSectionProps {
  data: Record<string, unknown>;
  tone?: 'primary' | 'accent';
}

export function CtaBandSection({ data, tone = 'primary' }: CtaBandSectionProps) {
  const heading = asString(data.heading, 'Join us');
  const description = asString(data.description, '');
  const cta = asCta(data.cta) ?? { label: 'Learn more', href: '/' };
  const isPrimary = tone === 'primary';

  return (
    <section
      className={
        isPrimary
          ? 'section-pad bg-primary'
          : 'section-pad border-y border-border bg-surface-secondary'
      }
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl space-y-8 text-center">
          <SectionIntro
            title={heading}
            description={description || undefined}
            align="center"
            tone={isPrimary ? 'dark' : 'light'}
          />
          <Button href={cta.href} variant={isPrimary ? 'inverse' : 'primary'}>
            {cta.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
