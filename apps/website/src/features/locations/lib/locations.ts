export type LocationStatus = 'open' | 'coming_soon';

export interface CafeLocation {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  address: string;
  status: LocationStatus;
  imageSrc: string;
  imageAlt: string;
  /** Public gallery folder for open locations; coming soon branches have none yet. */
  hasGallery: boolean;
  /** Canonical Google Maps short link when available. */
  mapsUrl?: string;
}

export const CAFE_LOCATIONS: readonly CafeLocation[] = [
  {
    id: 'city-park',
    slug: 'city-park',
    name: '7Oz City Park',
    shortName: 'City Park',
    city: 'Tashkent',
    country: 'Uzbekistan',
    address: "City Park, Ukchi ko'chasi 3A, 100011, Tashkent, Uzbekistan",
    status: 'open',
    imageSrc: '/assets/locations/7Oz-current.jpeg',
    imageAlt: '7Oz Espresso Cafe at City Park, Tashkent',
    hasGallery: true,
    mapsUrl: 'https://maps.app.goo.gl/QJqbNtSMLS2YTwtB6',
  },
  {
    id: 'mecca-hotel',
    slug: 'mecca-hotel',
    name: '7Oz Mecca Hotel',
    shortName: 'Mecca Hotel',
    city: 'Tashkent',
    country: 'Uzbekistan',
    address: "Qorasaroy turizm ko'chasi, Qorasaroy St 3, 100069, Toshkent, Uzbekistan",
    status: 'coming_soon',
    imageSrc: '/assets/locations/7Oz-mecca.jpeg',
    imageAlt: 'Upcoming 7Oz location at Mecca Hotel, Tashkent',
    hasGallery: false,
  },
  {
    id: 'kampoeng-indonesia',
    slug: 'kampoeng-indonesia',
    name: '7Oz Hotel Kampoeng Indonesia',
    shortName: 'Kampoeng Indonesia',
    city: "Xoʻja Ismoil",
    country: 'Uzbekistan',
    address: "RW6X+G73 Payariq Region, Xoʻja Ismoil, Samarqand viloyati, Uzbekistan",
    status: 'coming_soon',
    imageSrc: '/assets/locations/7Oz-kampoeng-indonesia.jpeg',
    imageAlt: 'Upcoming 7Oz location at Hotel Kampoeng Indonesia',
    hasGallery: false,
  },
  {
    id: 'hadith-hotel',
    slug: 'hadith-hotel',
    name: '7Oz Hadith Hotel',
    shortName: 'Hadith Hotel',
    city: "Xoʻja Ismoil",
    country: 'Uzbekistan',
    address: "RW5X+9P, Xoʻja Ismoil, Samarqand viloyati, Uzbekistan",
    status: 'coming_soon',
    imageSrc: '/assets/locations/7Oz-hadith.png',
    imageAlt: 'Upcoming 7Oz location at Hadith Hotel',
    hasGallery: false,
  },
  {
    id: 'humble-8',
    slug: 'humble-8',
    name: '7Oz Humble 8',
    shortName: 'Humble 8',
    city: 'Jakarta',
    country: 'Indonesia',
    address:
      'Jl. Kemang I No.5, RT.10/RW.5, Bangka, Kec. Mampang Prpt., Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12730',
    status: 'coming_soon',
    imageSrc: '/assets/locations/7Oz-humble-8.jpg',
    imageAlt: 'Upcoming 7Oz location at Humble 8, Jakarta',
    hasGallery: false,
  },
  {
    id: 'dharmawangsa',
    slug: 'dharmawangsa',
    name: '7Oz Dharmawangsa',
    shortName: 'Dharmawangsa',
    city: 'Jakarta',
    country: 'Indonesia',
    address:
      'Jl. Darmawangsa Raya No.16, RT.6/RW.1, Pulo, Kec. Kby. Baru, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12160',
    status: 'coming_soon',
    imageSrc: '/assets/locations/7Oz-dharmawangsa-temp.jpeg',
    imageAlt: 'Upcoming 7Oz location at Dharmawangsa, Jakarta',
    hasGallery: false,
    mapsUrl: 'https://maps.app.goo.gl/T8Pciwd3C56qyqxX9',
  },
] as const;

export function getAllLocations(): CafeLocation[] {
  return [...CAFE_LOCATIONS];
}

export function getLocationBySlug(slug: string): CafeLocation | undefined {
  return CAFE_LOCATIONS.find((location) => location.slug === slug);
}

export function getOpenLocations(): CafeLocation[] {
  return CAFE_LOCATIONS.filter((location) => location.status === 'open');
}

export function getPrimaryLocation(): CafeLocation {
  const open = CAFE_LOCATIONS.find((location) => location.status === 'open');
  if (open) {
    return open;
  }
  const first = CAFE_LOCATIONS[0];
  if (!first) {
    throw new Error('No cafe locations are configured.');
  }
  return first;
}

export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function locationMapsUrl(location: CafeLocation): string {
  return location.mapsUrl ?? mapsSearchUrl(location.address);
}

export function locationStatusLabel(status: LocationStatus): string {
  return status === 'open' ? 'Open now' : 'Coming soon';
}
