import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { ContactForm } from '@/features/contact/components/contact-form';
import { ContactLocations } from '@/features/contact/components/contact-locations';
import { getPrimaryLocation } from '@/features/locations/lib/locations';
import { metadataFromSeo } from '@/lib/seo';
import { asString, getPublishedCmsPage, getSection } from '@/services/cms';

export async function generateMetadata(): Promise<Metadata> {
  const contact = await getPublishedCmsPage('contact');
  return metadataFromSeo(contact?.page.seo, {
    title: 'Contact 7Oz',
    description: 'Visit, call, or message 7Oz Espresso Cafe across our locations.',
    path: '/contact',
  });
}

export default async function ContactPage() {
  const [contact, footer] = await Promise.all([
    getPublishedCmsPage('contact'),
    getPublishedCmsPage('footer'),
  ]);

  const info = getSection(contact, 'contact_info');
  const hours = getSection(contact, 'business_hours');
  const email = asString(info?.data.email, 'hello@7oz.local');
  const phone = asString(info?.data.phone);
  const whatsapp = asString(info?.data.whatsapp);
  const weekly = Array.isArray(hours?.data.weekly) ? hours.data.weekly : [];
  const primary = getPrimaryLocation();

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container>
          <Reveal className="mb-14 max-w-3xl md:mb-20">
            <SectionIntro
              eyebrow="Contact"
              title="Visit 7Oz"
              description="Reach out for reservations, private gatherings, or a quiet table — and find every 7Oz address below."
              titleAs="h1"
            />
          </Reveal>

          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-20">
            <div className="space-y-14">
              <section aria-labelledby="contact-locations-heading" className="space-y-8">
                <Reveal>
                  <div className="space-y-3">
                    <p className="text-eyebrow">Our cafes</p>
                    <h2 id="contact-locations-heading" className="text-section-title text-text">
                      Locations
                    </h2>
                  </div>
                </Reveal>
                <ContactLocations
                  primaryEmail={email}
                  primaryPhone={phone}
                  primaryWhatsapp={whatsapp}
                />
              </section>

              <Reveal>
                <section
                  aria-labelledby="contact-hours-heading"
                  className="rounded-media bg-surface-secondary/70 p-8 md:p-10"
                >
                  <p className="text-eyebrow">{primary.shortName}</p>
                  <h2 id="contact-hours-heading" className="mt-3 text-section-title text-text">
                    Hours
                  </h2>
                  <ul className="mt-8 space-y-4">
                    {weekly.map((item) => {
                      if (typeof item !== 'object' || item === null) {
                        return null;
                      }
                      const record = item as Record<string, unknown>;
                      const day = asString(record.day);
                      const open = asString(record.open);
                      const close = asString(record.close);
                      if (!day) {
                        return null;
                      }
                      return (
                        <li
                          key={day}
                          className="flex items-center justify-between gap-4 border-b border-border/70 pb-3 text-sm"
                        >
                          <span className="capitalize text-text">{day}</span>
                          <span className="text-text-secondary">
                            {open} – {close}
                          </span>
                        </li>
                      );
                    })}
                    {weekly.length === 0 ? (
                      <li className="text-text-secondary">Hours will be published soon.</li>
                    ) : null}
                  </ul>
                </section>
              </Reveal>
            </div>

            <Reveal delay={0.08} className="lg:sticky lg:top-28 lg:self-start">
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-eyebrow">Write to us</p>
                  <h2 className="text-section-title text-text">Send a message</h2>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Questions about a visit, catering, or a coming location — we read every note.
                  </p>
                </div>
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </Container>
      </main>
    </SiteShell>
  );
}
