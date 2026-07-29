import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { asCta, asString } from '@/services/cms';

interface CtaBandSectionProps {
  data: Record<string, unknown>;
  tone?: 'primary' | 'accent';
}

export function CtaBandSection({ data, tone = 'primary' }: CtaBandSectionProps) {
  const heading = asString(data.heading, 'Join us');
  const description = asString(data.description, '');
  const cta = asCta(data.cta) ?? { label: 'Learn more', href: '/' };
  const surface = tone === 'primary' ? 'bg-primary text-white' : 'bg-accent text-white';

  return (
    <section className={`${surface} py-24 md:py-28`}>
      <Container>
        <Reveal className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="font-heading text-4xl md:text-5xl">{heading}</h2>
          {description ? <p className="text-lg text-white/80">{description}</p> : null}
          <Button href={cta.href} variant="secondary">
            {cta.label}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
