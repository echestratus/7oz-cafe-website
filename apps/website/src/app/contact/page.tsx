import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { ContactForm } from '@/features/contact/components/contact-form';
import { metadataFromSeo } from '@/lib/seo';
import { asString, getPublishedCmsPage, getSection } from '@/services/cms';

export async function generateMetadata(): Promise<Metadata> {
  const contact = await getPublishedCmsPage('contact');
  return metadataFromSeo(contact?.page.seo, {
    title: 'Contact 7Oz',
    description: 'Visit, call, or message 7Oz Espresso Cafe.',
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
  const address = asString(info?.data.address);
  const whatsapp = asString(info?.data.whatsapp);
  const weekly = Array.isArray(hours?.data.weekly) ? hours.data.weekly : [];

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          <Reveal className="space-y-10">
            <SectionIntro
              eyebrow="Contact"
              title="Visit 7Oz"
              description="Reach out for reservations, private gatherings, or a quiet table for the afternoon."
              titleAs="h1"
            />

            <dl className="space-y-6 text-base">
              {address ? (
                <div>
                  <dt className="text-eyebrow">Address</dt>
                  <dd className="mt-2 text-text">{address}</dd>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <dt className="text-eyebrow">Phone</dt>
                  <dd className="mt-2 text-text">{phone}</dd>
                </div>
              ) : null}
              {whatsapp ? (
                <div>
                  <dt className="text-eyebrow">WhatsApp</dt>
                  <dd className="mt-2 text-text">{whatsapp}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-eyebrow">Email</dt>
                <dd className="mt-2">
                  <a className="text-primary transition-colors hover:text-primary-hover" href={`mailto:${email}`}>
                    {email}
                  </a>
                </dd>
              </div>
            </dl>

            <div>
              <h2 className="text-section-title text-text">Hours</h2>
              <ul className="mt-6 space-y-4">
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
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <ContactForm />
          </Reveal>
        </Container>
      </main>
    </SiteShell>
  );
}
