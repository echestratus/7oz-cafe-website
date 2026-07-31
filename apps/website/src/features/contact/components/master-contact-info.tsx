import { Mail, MessageCircle, Phone } from 'lucide-react';

import { Reveal } from '@/components/ui/reveal';

interface MasterContactInfoProps {
  phone?: string;
  email?: string;
  whatsapp?: string;
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

function whatsappHref(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '#';
}

export function MasterContactInfo({ phone, email, whatsapp }: MasterContactInfoProps) {
  const items = [
    phone
      ? {
          id: 'phone',
          label: 'Phone',
          value: phone,
          href: telHref(phone),
          icon: Phone,
          external: false,
        }
      : null,
    whatsapp
      ? {
          id: 'whatsapp',
          label: 'WhatsApp',
          value: whatsapp,
          href: whatsappHref(whatsapp),
          icon: MessageCircle,
          external: true,
        }
      : null,
    email
      ? {
          id: 'email',
          label: 'Email',
          value: email,
          href: `mailto:${email}`,
          icon: Mail,
          external: false,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (items.length === 0) {
    return null;
  }

  return (
    <Reveal>
      <aside
        aria-labelledby="master-contact-heading"
        className="overflow-hidden rounded-media border border-border/70 bg-surface shadow-soft"
      >
        <div className="grid gap-8 p-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:gap-12 md:p-10 lg:p-12">
          <div className="space-y-4">
            <p className="text-eyebrow">All locations</p>
            <h2 id="master-contact-heading" className="text-section-title text-text">
              Reach 7Oz
            </h2>
            <p className="text-lede max-w-md">
              One shared contact for every 7Oz room — City Park today, and the cafes still on the
              way.
            </p>
          </div>

          <ul className="space-y-0 divide-y divide-border/80">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-accent">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-eyebrow">{item.label}</p>
                    <a
                      href={item.href}
                      className="block truncate text-base text-text transition-colors hover:text-primary md:text-lg"
                      {...(item.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                    >
                      {item.value}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </Reveal>
  );
}
