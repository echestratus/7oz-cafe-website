import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { LoyaltyPageCta } from '@/features/loyalty/components/loyalty-page-cta';
import { getPublishedCmsPage } from '@/services/cms';
import { getPublicLoyaltyRewards } from '@/services/loyalty';

export const metadata: Metadata = {
  title: 'Loyalty',
  description: 'Earn points for completed visits and redeem them for 7Oz rewards.',
  alternates: { canonical: '/loyalty' },
  openGraph: {
    title: 'Loyalty | 7Oz Espresso Cafe',
    description: 'Earn points for completed visits and redeem them for 7Oz rewards.',
    url: '/loyalty',
  },
};

export default async function LoyaltyPage() {
  const [footer, rewards] = await Promise.all([
    getPublishedCmsPage('footer'),
    getPublicLoyaltyRewards().catch(() => []),
  ]);

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container className="space-y-16">
          <Reveal>
            <SectionIntro
              eyebrow="Loyalty"
              title="Points for every return"
              description="Completed reservations earn loyalty points. Membership tiers can multiply what you collect, and rewards are ready when you are."
              titleAs="h1"
              className="max-w-3xl"
            />
            <div className="mt-8">
              <LoyaltyPageCta />
            </div>
          </Reveal>

          <section className="space-y-10" aria-labelledby="rewards-heading">
            <Reveal>
              <h2 id="rewards-heading" className="text-section-title text-text">
                Rewards
              </h2>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3">
              {rewards.map((reward, index) => (
                <Reveal key={reward.id} delay={index * 0.05} className="space-y-3 border-t border-border pt-6">
                  <h3 className="text-card-title text-text">{reward.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{reward.description}</p>
                  <p className="text-sm text-text">{reward.pointsCost} points</p>
                </Reveal>
              ))}
              {rewards.length === 0 ? (
                <p className="text-sm text-text-secondary">Rewards will appear soon.</p>
              ) : null}
            </div>
          </section>
        </Container>
      </main>
    </SiteShell>
  );
}
