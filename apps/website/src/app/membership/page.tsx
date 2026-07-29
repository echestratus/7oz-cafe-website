import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { getPublishedCmsPage } from '@/services/cms';
import { getPublicMembershipBenefits, getPublicMembershipLevels } from '@/services/membership';

export const metadata: Metadata = {
  title: 'Membership',
  description: 'Explore 7Oz membership tiers, benefits, and how progression works.',
  alternates: { canonical: '/membership' },
  openGraph: {
    title: 'Membership | 7Oz Espresso Cafe',
    description: 'Explore 7Oz membership tiers and benefits.',
    url: '/membership',
  },
};

export default async function MembershipPage() {
  const [footer, levels, benefits] = await Promise.all([
    getPublishedCmsPage('footer'),
    getPublicMembershipLevels().catch(() => []),
    getPublicMembershipBenefits().catch(() => []),
  ]);

  return (
    <SiteShell footer={footer}>
      <main className="bg-background pt-28 pb-24 md:pt-36">
        <Container className="space-y-20">
          <Reveal className="max-w-3xl space-y-6">
            <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Membership</p>
            <h1 className="font-heading text-5xl text-text md:text-6xl">Earn your place at the table</h1>
            <p className="text-lg text-text-secondary">
              Membership progresses automatically as you visit. There is nothing to purchase —
              complete reservations unlock higher recognition over time.
            </p>
          </Reveal>

          <section className="space-y-8" aria-labelledby="levels-heading">
            <Reveal>
              <h2 id="levels-heading" className="font-heading text-3xl text-text md:text-4xl">
                Levels
              </h2>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {levels.map((level, index) => (
                <Reveal key={level.id} delay={index * 0.05} className="space-y-3 border-t border-border pt-6">
                  <p className="text-sm tracking-[0.12em] text-text-muted uppercase">{level.code}</p>
                  <h3 className="font-heading text-3xl text-text">{level.name}</h3>
                  <p className="text-sm text-text-secondary">{level.description}</p>
                  <p className="text-sm text-text">
                    From {level.qualificationRules.minCompletedReservations} completed visits
                  </p>
                </Reveal>
              ))}
              {levels.length === 0 ? (
                <p className="text-sm text-text-secondary">Membership levels will appear soon.</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-8" aria-labelledby="benefits-heading">
            <Reveal>
              <h2 id="benefits-heading" className="font-heading text-3xl text-text md:text-4xl">
                Benefits
              </h2>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <Reveal key={benefit.id} delay={index * 0.04} className="space-y-2">
                  <h3 className="font-heading text-2xl text-text">{benefit.title}</h3>
                  <p className="text-sm text-text-secondary">{benefit.description}</p>
                </Reveal>
              ))}
              {benefits.length === 0 ? (
                <p className="text-sm text-text-secondary">Benefits will be published soon.</p>
              ) : null}
            </div>
          </section>
        </Container>
      </main>
    </SiteShell>
  );
}
