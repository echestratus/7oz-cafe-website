import { PageMain } from '@/components/layout/page-main';
import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { LocationCard } from '@/features/locations/components/location-card';
import { getAllLocations } from '@/features/locations/lib/locations';

export function GalleryLocationPicker() {
  const locations = getAllLocations();
  const openCount = locations.filter((location) => location.status === 'open').length;
  const comingSoonCount = locations.filter((location) => location.status === 'coming_soon').length;
  const closedCount = locations.filter((location) => location.status === 'closed').length;
  const description = [
    `Moments from each 7Oz room. ${openCount} open now`,
    comingSoonCount > 0 ? `${comingSoonCount} on the way` : null,
    closedCount > 0 ? 'Tashkent City has closed' : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' — ')
    .concat('.');

  return (
    <PageMain>
      <Container>
        <Reveal className="mb-14 md:mb-16">
          <SectionIntro
            eyebrow="Gallery"
            title="Choose a location"
            description={description}
            titleAs="h1"
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {locations.map((location, index) => (
            <Reveal key={location.id} delay={(index % 3) * 0.05}>
              <LocationCard
                location={location}
                href={`/gallery/${location.slug}`}
                priority={index < 2}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </PageMain>
  );
}
