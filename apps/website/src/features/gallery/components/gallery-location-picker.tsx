import { Container } from '@/components/ui/container';
import { Reveal } from '@/components/ui/reveal';
import { SectionIntro } from '@/components/ui/section-intro';
import { LocationCard } from '@/features/locations/components/location-card';
import { getAllLocations } from '@/features/locations/lib/locations';

export function GalleryLocationPicker() {
  const locations = getAllLocations();
  const openCount = locations.filter((location) => location.status === 'open').length;

  return (
    <main className="pt-28 pb-24 md:pt-36 md:pb-32">
      <Container>
        <Reveal className="mb-14 md:mb-16">
          <SectionIntro
            eyebrow="Gallery"
            title="Choose a location"
            description={`Moments from each 7Oz room. ${openCount} open now — the rest are on the way.`}
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
    </main>
  );
}
