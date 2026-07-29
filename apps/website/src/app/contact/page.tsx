import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
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
      <main className="bg-background pt-28 pb-24 md:pt-36">
        <Container className="grid gap-16 md:grid-cols-[1.1fr_0.9fr]">
          <Reveal className="space-y-6">
            <p className="text-sm tracking-[0.18em] text-text-secondary uppercase">Contact</p>
            <h1 className="font-heading text-5xl text-text md:text-6xl">Visit 7Oz</h1>
            <p className="max-w-xl text-lg text-text-secondary">
              Reach out for reservations, private gatherings, or a quiet table for the afternoon.
            </p>

            <dl className="space-y-5 pt-4 text-base">
              {address ? (
                <div>
                  <dt className="text-sm tracking-[0.08em] text-text-muted uppercase">Address</dt>
                  <dd className="mt-1 text-text">{address}</dd>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <dt className="text-sm tracking-[0.08em] text-text-muted uppercase">Phone</dt>
                  <dd className="mt-1 text-text">{phone}</dd>
                </div>
              ) : null}
              {whatsapp ? (
                <div>
                  <dt className="text-sm tracking-[0.08em] text-text-muted uppercase">WhatsApp</dt>
                  <dd className="mt-1 text-text">{whatsapp}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-sm tracking-[0.08em] text-text-muted uppercase">Email</dt>
                <dd className="mt-1">
                  <a className="text-primary hover:text-primary-hover" href={`mailto:${email}`}>
                    {email}
                  </a>
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.08} className="rounded-[24px] bg-surface-secondary p-8 md:p-10">
            <h2 className="font-heading text-3xl text-text">Hours</h2>
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
                  <li key={day} className="flex items-center justify-between gap-4 text-sm">
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
          </Reveal>
        </Container>
      </main>
    </SiteShell>
  );
}
