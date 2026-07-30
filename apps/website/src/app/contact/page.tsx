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
      <main>
        <section className="pt-28 pb-16 md:pt-36 md:pb-24">
          <Container>
            <Reveal className="max-w-3xl">
              <SectionIntro
                eyebrow="Contact"
                title="Visit 7Oz"
                description="Find every address, check open hours at City Park, or write to us for reservations and private gatherings."
                titleAs="h1"
              />
            </Reveal>
          </Container>
        </section>

        <section
          aria-labelledby="contact-locations-heading"
          className="border-y border-border/60 bg-surface-secondary/40 py-16 md:py-24"
        >
          <Container className="space-y-12 md:space-y-16">
            <Reveal>
              <div className="max-w-2xl space-y-4">
                <p className="text-eyebrow">Our cafes</p>
                <h2 id="contact-locations-heading" className="text-section-title text-text">
                  Locations
                </h2>
                <p className="text-lede">
                  One room open today — several more taking shape across Uzbekistan and Indonesia.
                </p>
              </div>
            </Reveal>

            <ContactLocations
              primaryEmail={email}
              primaryPhone={phone}
              primaryWhatsapp={whatsapp}
            />
          </Container>
        </section>

        <section
          aria-labelledby="contact-write-heading"
          className="py-16 md:py-24 lg:py-28"
        >
          <Container>
            <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20 xl:gap-24">
              <Reveal className="space-y-10 lg:sticky lg:top-28 lg:self-start">
                <div className="space-y-4">
                  <p className="text-eyebrow">{primary.shortName}</p>
                  <h2 className="text-section-title text-text">Hours</h2>
                  <p className="text-sm leading-relaxed text-text-secondary">
                    Times for our open cafe. Coming locations will publish hours closer to opening.
                  </p>
                </div>

                <ul className="space-y-0 overflow-hidden rounded-media border border-border/70 bg-surface">
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
                        className="flex items-center justify-between gap-4 border-b border-border/70 px-6 py-4 text-sm last:border-b-0 md:px-8"
                      >
                        <span className="capitalize text-text">{day}</span>
                        <span className="tabular-nums text-text-secondary">
                          {open} – {close}
                        </span>
                      </li>
                    );
                  })}
                  {weekly.length === 0 ? (
                    <li className="px-6 py-8 text-sm text-text-secondary md:px-8">
                      Hours will be published soon.
                    </li>
                  ) : null}
                </ul>
              </Reveal>

              <Reveal delay={0.08} className="space-y-8">
                <div className="max-w-xl space-y-4">
                  <p className="text-eyebrow">Write to us</p>
                  <h2 id="contact-write-heading" className="text-section-title text-text">
                    Send a message
                  </h2>
                  <p className="text-lede">
                    Questions about a visit, catering, or a coming location — we read every note.
                  </p>
                </div>
                <ContactForm />
              </Reveal>
            </div>
          </Container>
        </section>
      </main>
    </SiteShell>
  );
}
