import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
      <main className="bg-background pt-28 pb-24 md:pt-36">
        <Container className="space-y-16">
          <Reveal className="max-w-3xl space-y-6">
            <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Loyalty</p>
            <h1 className="font-heading text-5xl text-text md:text-6xl">Points for every return</h1>
            <p className="text-lg text-text-secondary">
              Completed reservations earn loyalty points. Membership tiers can multiply what you
              collect, and rewards are ready when you are.
            </p>
          </Reveal>

          <section className="space-y-8" aria-labelledby="rewards-heading">
            <Reveal>
              <h2 id="rewards-heading" className="font-heading text-3xl text-text md:text-4xl">
                Rewards
              </h2>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-3">
              {rewards.map((reward, index) => (
                <Reveal key={reward.id} delay={index * 0.05} className="space-y-3 border-t border-border pt-6">
                  <h3 className="font-heading text-2xl text-text">{reward.title}</h3>
                  <p className="text-sm text-text-secondary">{reward.description}</p>
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
