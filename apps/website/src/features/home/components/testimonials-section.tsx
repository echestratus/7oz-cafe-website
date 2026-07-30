import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { asString } from '@/services/cms';

interface TestimonialsSectionProps {
  data: Record<string, unknown>;
}

export function TestimonialsSection({ data }: TestimonialsSectionProps) {
  const heading = asString(data.heading, 'Guest Voices');
  const items = Array.isArray(data.items) ? data.items : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="section-pad border-y border-border bg-surface-secondary/60">
      <Container>
        <Reveal className="mb-16">
          <SectionIntro eyebrow="Guests" title={heading} align="center" />
        </Reveal>

        <div className="mx-auto grid max-w-4xl gap-14 md:grid-cols-2 md:gap-16">
          {items.map((item, index) => {
            if (typeof item !== 'object' || item === null) {
              return null;
            }
            const record = item as Record<string, unknown>;
            const name = asString(record.name, 'Guest');
            const review = asString(record.review);
            if (!review) {
              return null;
            }

            return (
              <Reveal key={`${name}-${index}`} delay={index * 0.08} className="space-y-6">
                <span className="block h-px w-10 bg-accent/50" aria-hidden="true" />
                <p className="text-quote text-text">&ldquo;{review}&rdquo;</p>
                <p className="text-eyebrow">{name}</p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
