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
} from './locations.ts';

test('location displays put every closed room after open and upcoming rooms without mutating input', () => {
  const original = [...CAFE_LOCATIONS];
  const sorted = sortLocationsByStatus(CAFE_LOCATIONS);
  const open = original.filter((location) => location.status === 'open');
  const upcoming = original.filter((location) => location.status === 'coming_soon');
  const closed = original.filter((location) => location.status === 'closed');

  assert.deepEqual(sorted, [...open, ...upcoming, ...closed]);
  assert.deepEqual(CAFE_LOCATIONS, original);
  assert.deepEqual(sortLocationsByStatus([]), []);
});

test('closed rooms stay last even if supplied before other locations', () => {
  const closed = getLocationBySlug('city-park');
  const upcoming = getLocationBySlug('almaty');
  const open = getPrimaryLocation();
  assert.ok(closed);
  assert.ok(upcoming);

  const anotherClosed = { ...closed, id: 'another-closed', slug: 'another-closed' };
  const input = [closed, upcoming, anotherClosed, open];
  assert.deepEqual(sortLocationsByStatus(input), [open, upcoming, closed, anotherClosed]);
  assert.deepEqual(input, [closed, upcoming, anotherClosed, open]);
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

test('Humble 8 has two distinct concepts at the same venue with their own logos', () => {
  const espresso = getLocationBySlug('humble-8');
  const underground = getLocationBySlug('humble-8-underground');

  assert.ok(espresso?.logo);
  assert.ok(underground?.logo);
  assert.notEqual(espresso.id, underground.id);
  assert.notEqual(espresso.logo.src, underground.logo.src);
  assert.equal(espresso.address, underground.address);
  assert.match(espresso.name, /Humble 8 Social Space Kemang/);
  assert.match(underground.name, /Underground/);
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
