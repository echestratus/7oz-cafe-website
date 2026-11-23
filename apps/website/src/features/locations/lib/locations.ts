export type LocationStatus = 'open' | 'coming_soon' | 'closed';

export interface LocationImage {
  src: string;
  alt: string;
}

export interface CafeLocation {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  /** Omitted until an upcoming cafe has a confirmed address. */
  address?: string;
  status: LocationStatus;
  /** Omitted until a cafe has photography; views fall back to the brand backdrop. */
  image?: LocationImage;
  /** A concept-specific logo displayed over its location photograph. */
  logo?: LocationImage;
  /** When false, open locations show an awaiting-gallery page instead of an empty grid. */
  hasGallery: boolean;
  /** Canonical Google Maps short link when available. */
  mapsUrl?: string;
}

const HUMBLE_8_ADDRESS =
  'Jl. Kemang I No.5, RT.10/RW.5, Bangka, Kec. Mampang Prpt., Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12730';

/**
 * Catalog order is display order: the flagship, then the newest announcement,
 * then the other open rooms, upcoming rooms, and closed rooms last.
 */
export const CAFE_LOCATIONS: readonly CafeLocation[] = [
  {
    id: 'hadith-hotel',
    slug: 'hadith-hotel',
    name: '7Oz Hadith Hotel',
    shortName: 'Hadith Hotel',
    city: 'Samarkand',
    country: 'Uzbekistan',
    address: 'Hadith Hotel, Imam Bukhari Complex, Xoʻja Ismoil, Samarkand, Uzbekistan',
    status: 'open',
    image: {
      src: '/assets/locations/7Oz-hadith.webp',
      alt: '7Oz Espresso Cafe at Hadith Hotel, Samarkand',
    },
    hasGallery: true,
  },
  {
    id: 'almaty',
    slug: 'almaty',
    name: '7Oz Almaty',
    shortName: 'Almaty',
    city: 'Almaty',
    country: 'Kazakhstan',
    status: 'coming_soon',
    hasGallery: false,
  },
  {
    id: 'kampoeng-indonesia',
    slug: 'kampoeng-indonesia',
    name: '7Oz Hotel Kampoeng Indonesia',
    shortName: 'Kampoeng Indonesia',
    city: 'Xoʻja Ismoil',
    country: 'Uzbekistan',
    address: 'RW6X+G73 Payariq Region, Xoʻja Ismoil, Samarqand viloyati, Uzbekistan',
    status: 'open',
    image: {
      src: '/assets/locations/7Oz-kampoeng-indonesia.webp',
      alt: '7Oz Espresso Cafe at Hotel Kampoeng Indonesia',
    },
    hasGallery: true,
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
    status: 'open',
    image: {
      src: '/assets/locations/7Oz-dharmawangsa.webp',
      alt: '7Oz Espresso Cafe at Dharmawangsa, Jakarta',
    },
    hasGallery: true,
    mapsUrl: 'https://maps.app.goo.gl/T8Pciwd3C56qyqxX9',
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
    image: {
      src: '/assets/locations/7Oz-mecca.webp',
      alt: 'Upcoming 7Oz location at Mecca Hotel, Tashkent',
    },
    hasGallery: false,
  },
  {
    id: 'humble-8',
    slug: 'humble-8',
    name: '7Oz Espresso — Humble 8 Social Space Kemang',
    shortName: '7Oz Espresso · Humble 8',
    city: 'Jakarta',
    country: 'Indonesia',
    address: HUMBLE_8_ADDRESS,
    status: 'coming_soon',
    image: {
      src: '/assets/locations/7Oz-humble-8.webp',
      alt: 'Upcoming 7Oz location at Humble 8, Jakarta',
    },
    logo: {
      src: '/assets/logo/7oz-humble-8.webp',
      alt: '7Oz Espresso',
    },
    hasGallery: false,
  },
  {
    id: 'humble-8-underground',
    slug: 'humble-8-underground',
    name: '7Oz Underground — Humble 8 Social Space Kemang',
    shortName: '7Oz Underground · Humble 8',
    city: 'Jakarta',
    country: 'Indonesia',
    address: HUMBLE_8_ADDRESS,
    status: 'coming_soon',
    image: {
      src: '/assets/locations/7Oz-humble-8.webp',
      alt: 'Humble 8 Social Space Kemang, home of 7Oz Underground',
    },
    logo: {
      src: '/assets/logo/7oz-underground-split-roundel.webp',
      alt: '7Oz Underground Espresso',
    },
    hasGallery: false,
  },
  {
    id: 'city-park',
    slug: 'city-park',
    name: '7Oz Tashkent City',
    shortName: 'Tashkent City',
    city: 'Tashkent',
    country: 'Uzbekistan',
    address: "City Park, Ukchi ko'chasi 3A, 100011, Tashkent, Uzbekistan",
    status: 'closed',
    image: {
      src: '/assets/locations/7Oz-current.webp',
      alt: 'Former 7Oz Espresso Cafe at Tashkent City',
    },
    hasGallery: true,
    mapsUrl: 'https://maps.app.goo.gl/QJqbNtSMLS2YTwtB6',
  },
] as const;

const STATUS_ORDER: Record<LocationStatus, number> = {
  open: 0,
  coming_soon: 1,
  closed: 2,
};

export const ADDRESS_PENDING_LABEL = 'Address to be announced';

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

/** Open rooms first, then upcoming, then closed. Keeps catalog order within each group. */
export function sortLocationsByStatus(locations: readonly CafeLocation[]): CafeLocation[] {
  return [...locations].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

/** City and country, e.g. "Almaty, Kazakhstan". */
export function locationPlace(location: CafeLocation): string {
  return `${location.city}, ${location.country}`;
}

/** The street address, or a clear placeholder while an upcoming cafe has none. */
export function locationAddressLabel(location: CafeLocation): string {
  return location.address ?? ADDRESS_PENDING_LABEL;
}

export function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Null while a cafe has no address to point a map at. */
export function locationMapsUrl(location: CafeLocation): string | null {
  if (location.mapsUrl) {
    return location.mapsUrl;
  }
  return location.address ? mapsSearchUrl(location.address) : null;
}

export function locationStatusLabel(status: LocationStatus): string {
  if (status === 'open') {
    return 'Open now';
  }
  if (status === 'closed') {
    return 'Closed';
  }
  return 'Coming soon';
}
