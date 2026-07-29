import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
    <section className="bg-background py-24 md:py-32">
      <Container>
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="font-heading text-4xl text-text md:text-5xl">{heading}</h2>
        </Reveal>

        <div className="grid gap-10 md:grid-cols-2">
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
              <Reveal key={`${name}-${index}`} delay={index * 0.08} className="space-y-4">
                <p className="font-heading text-2xl leading-relaxed text-text">&ldquo;{review}&rdquo;</p>
                <p className="text-sm tracking-[0.08em] text-text-secondary uppercase">{name}</p>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
