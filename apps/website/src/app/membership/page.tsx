import type { Metadata } from 'next';

import { PageMain } from '@/components/layout/page-main';
import { SiteShell } from '@/components/layout/site-shell';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
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
      <PageMain>
        <Container className="space-y-20">
          <Reveal>
            <SectionIntro
              eyebrow="Membership"
              title="Earn your place at the table"
              description="Membership progresses automatically as you visit. There is nothing to purchase — complete reservations unlock higher recognition over time."
              titleAs="h1"
              className="max-w-3xl"
            />
          </Reveal>

          <section className="space-y-10" aria-labelledby="levels-heading">
            <Reveal>
              <h2 id="levels-heading" className="text-section-title text-text">
                Levels
              </h2>
            </Reveal>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
              {levels.map((level, index) => (
                <Reveal key={level.id} delay={index * 0.05} className="space-y-3 border-t border-border pt-6">
                  <p className="text-eyebrow">{level.code}</p>
                  <h3 className="text-card-title text-text">{level.name}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{level.description}</p>
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

          <section className="space-y-10" aria-labelledby="benefits-heading">
            <Reveal>
              <h2 id="benefits-heading" className="text-section-title text-text">
                Benefits
              </h2>
            </Reveal>
            <div className="grid gap-10 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <Reveal key={benefit.id} delay={index * 0.04} className="space-y-3">
                  <h3 className="text-card-title text-text">{benefit.title}</h3>
                  <p className="text-sm leading-relaxed text-text-secondary">{benefit.description}</p>
                </Reveal>
              ))}
              {benefits.length === 0 ? (
                <p className="text-sm text-text-secondary">Benefits will be published soon.</p>
              ) : null}
            </div>
          </section>

          <section className="space-y-6 border-t border-border pt-12" aria-labelledby="join-heading">
            <Reveal>
              <h2 id="join-heading" className="text-section-title text-text">
                Start your membership
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">
                Create a free account to track your tier, benefits, and visit progress.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/register">Create account</Button>
                <Button href="/account" variant="outline">
                  View my account
                </Button>
              </div>
            </Reveal>
          </section>
        </Container>
      </PageMain>
    </SiteShell>
  );
}
