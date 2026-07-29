import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { ReservationBookingForm } from '@/features/reservations/components/reservation-booking-form';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Reservations',
  description: 'Reserve a table at 7Oz Espresso Cafe.',
  alternates: { canonical: '/reservations' },
  openGraph: {
    title: 'Reservations | 7Oz Espresso Cafe',
    description: 'Reserve a table at 7Oz Espresso Cafe.',
    url: '/reservations',
  },
};

export default async function ReservationsPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <main className="bg-background pt-28 pb-24 md:pt-36">
        <Container className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr]">
          <Reveal className="space-y-6">
            <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Reservations</p>
            <h1 className="font-heading text-5xl text-text md:text-6xl">Book your visit</h1>
            <p className="max-w-xl text-lg text-text-secondary">
              Tell us when you&apos;d like to join us. We&apos;ll hold the request and confirm as
              soon as a host reviews it.
            </p>
            <ul className="space-y-3 pt-2 text-sm text-text-secondary">
              <li>Same-day requests need at least 30 minutes notice.</li>
              <li>Parties up to 12 guests can book online.</li>
              <li>Larger gatherings — message us from Contact.</li>
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <ReservationBookingForm />
          </Reveal>
        </Container>
      </main>
    </SiteShell>
  );
}
