import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_PENDING_LABEL,
  CAFE_LOCATIONS,
  getLocationBySlug,
  getPrimaryLocation,
  locationAddressLabel,
  locationMapsUrl,
  sortLocationsByStatus,
  sortLocationsComingSoonLast,
} from './locations.ts';

test('homepage keeps coming-soon rooms last without changing the catalog', () => {
  const original = [...CAFE_LOCATIONS];
  const sorted = sortLocationsComingSoonLast(CAFE_LOCATIONS);
  const existing = original.filter((location) => location.status !== 'coming_soon');
  const upcoming = original.filter((location) => location.status === 'coming_soon');

  assert.deepEqual(sorted, [...existing, ...upcoming]);
  assert.deepEqual(CAFE_LOCATIONS, original);
  assert.deepEqual(sortLocationsComingSoonLast([]), []);
});

test('every location has a unique id and slug', () => {
  const ids = CAFE_LOCATIONS.map((location) => location.id);
  const slugs = CAFE_LOCATIONS.map((location) => location.slug);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('the flagship is an open cafe', () => {
  assert.equal(getPrimaryLocation().status, 'open');
});

test('open cafes always have an address and a photo', () => {
  for (const location of CAFE_LOCATIONS) {
    if (location.status !== 'open') {
      continue;
    }
    assert.ok(location.address, `${location.slug} needs an address`);
    assert.ok(location.image, `${location.slug} needs a photo`);
  }
});

test('Almaty is coming soon without a confirmed address', () => {
  const almaty = getLocationBySlug('almaty');

  assert.ok(almaty);
  assert.equal(almaty.status, 'coming_soon');
  assert.equal(almaty.country, 'Kazakhstan');
  assert.equal(locationAddressLabel(almaty), ADDRESS_PENDING_LABEL);
  assert.equal(locationMapsUrl(almaty), null);
});

test('maps link prefers the saved short link, then a search for the address', () => {
  const withShortLink = getLocationBySlug('dharmawangsa');
  const withAddressOnly = getLocationBySlug('hadith-hotel');

  assert.ok(withShortLink);
  assert.ok(withAddressOnly?.address);
  assert.equal(locationMapsUrl(withShortLink), withShortLink.mapsUrl);
  assert.equal(
    locationMapsUrl(withAddressOnly),
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(withAddressOnly.address)}`,
  );
});

test('sortLocationsByStatus lists open, upcoming, then closed in catalog order', () => {
  const sorted = sortLocationsByStatus(CAFE_LOCATIONS);
  const statuses = sorted.map((location) => location.status);
  const firstUpcoming = statuses.indexOf('coming_soon');
  const firstClosed = statuses.indexOf('closed');

  assert.equal(statuses.lastIndexOf('open') < firstUpcoming, true);
  assert.equal(statuses.lastIndexOf('coming_soon') < firstClosed, true);
  assert.deepEqual(
    sorted.filter((location) => location.status === 'coming_soon').map((location) => location.slug),
    CAFE_LOCATIONS.filter((location) => location.status === 'coming_soon').map(
      (location) => location.slug,
    ),
  );
  assert.equal(sorted.length, CAFE_LOCATIONS.length);
});
