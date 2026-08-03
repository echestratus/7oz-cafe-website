import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import {
  TestimonialCard,
  type TestimonialItem,
} from '@/features/home/components/testimonial-card';
import { asString } from '@/services/cms';

interface TestimonialsSectionProps {
  data: Record<string, unknown>;
}

function parseTestimonialItem(value: unknown): TestimonialItem | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = asString(record.name, 'Guest');
  const review = asString(record.review);
  if (!review) {
    return null;
  }

  const role = asString(record.role) || asString(record.position) || undefined;
  const avatarSrc = asString(record.avatarSrc) || asString(record.avatar) || undefined;
  const videoSrc = asString(record.videoSrc) || asString(record.video) || undefined;

  return {
    name,
    review,
    role: role || undefined,
    avatarSrc: avatarSrc || undefined,
    videoSrc: videoSrc || undefined,
  };
}

export function TestimonialsSection({ data }: TestimonialsSectionProps) {
  const heading = asString(data.heading, 'Guest Voices');
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items = rawItems
    .map(parseTestimonialItem)
    .filter((item): item is TestimonialItem => item !== null);

  if (items.length === 0) {
    return null;
  }

  const [featuredItem, ...otherItems] = items;
  if (!featuredItem) {
    return null;
  }

  const isFeaturedLayout = otherItems.length === 0;

  return (
    <section className="section-pad border-y border-border bg-surface-secondary/60">
      <Container>
        <Reveal className="mb-16">
          <SectionIntro eyebrow="Guests" title={heading} align="center" />
        </Reveal>

        {isFeaturedLayout ? (
          <div className="mx-auto max-w-4xl">
            <TestimonialCard item={featuredItem} featured />
          </div>
        ) : (
          <div className="mx-auto grid max-w-4xl gap-14 md:grid-cols-2 md:gap-16">
            {[featuredItem, ...otherItems].map((item, index) => (
              <TestimonialCard key={`${item.name}-${index}`} item={item} delay={index * 0.08} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
