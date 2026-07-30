import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ExternalLink, MapPin } from 'lucide-react';

import { Reveal } from '@/components/ui/reveal';
import {
  getAllLocations,
  locationStatusLabel,
  mapsSearchUrl,
  type CafeLocation,
} from '@/features/locations/lib/locations';

interface ContactLocationsProps {
  primaryPhone?: string;
  primaryEmail?: string;
  primaryWhatsapp?: string;
}

function LocationRow({
  location,
  phone,
  email,
  whatsapp,
}: {
  location: CafeLocation;
  phone?: string;
  email?: string;
  whatsapp?: string;
}) {
  const isOpen = location.status === 'open';

  return (
    <article className="grid gap-6 border-b border-border/80 py-8 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-10">
      <Link
        href={`/gallery/${location.slug}`}
        className="group relative aspect-[4/3] overflow-hidden rounded-media focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:aspect-[5/4]"
      >
        <Image
          src={location.imageSrc}
          alt={location.imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-primary">
          {locationStatusLabel(location.status)}
        </span>
      </Link>

      <div className="flex flex-col justify-center space-y-5">
        <div className="space-y-2">
          <p className="text-eyebrow">
            {location.city} · {location.country}
          </p>
          <h3 className="font-heading text-2xl text-text md:text-3xl">{location.name}</h3>
        </div>

        <p className="flex items-start gap-2 text-sm leading-relaxed text-text-secondary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
          <span>{location.address}</span>
        </p>

        {isOpen ? (
          <dl className="space-y-3 text-sm">
            {phone ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <dt className="text-text-muted">Phone</dt>
                <dd>
                  <a className="text-text transition-colors hover:text-primary" href={`tel:${phone.replace(/\s/g, '')}`}>
                    {phone}
                  </a>
                </dd>
              </div>
            ) : null}
            {whatsapp ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <dt className="text-text-muted">WhatsApp</dt>
                <dd className="text-text">{whatsapp}</dd>
              </div>
            ) : null}
            {email ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <dt className="text-text-muted">Email</dt>
                <dd>
                  <a className="text-primary transition-colors hover:text-primary-hover" href={`mailto:${email}`}>
                    {email}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm leading-relaxed text-text-secondary">
            This room is still preparing. Follow the gallery for opening news.
          </p>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
          <a
            href={mapsSearchUrl(location.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link-quiet inline-flex items-center gap-2"
          >
            Open in Maps
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <Link
            href={`/gallery/${location.slug}`}
            className="text-link-quiet inline-flex items-center gap-2"
          >
            {isOpen ? 'View gallery' : 'Coming soon'}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ContactLocations({
  primaryPhone,
  primaryEmail,
  primaryWhatsapp,
}: ContactLocationsProps) {
  const locations = getAllLocations();

  return (
    <div className="space-y-2">
      {locations.map((location, index) => (
        <Reveal key={location.id} delay={index * 0.04}>
          <LocationRow
            location={location}
            phone={location.status === 'open' ? primaryPhone : undefined}
            email={location.status === 'open' ? primaryEmail : undefined}
            whatsapp={location.status === 'open' ? primaryWhatsapp : undefined}
          />
        </Reveal>
      ))}
    </div>
  );
}
