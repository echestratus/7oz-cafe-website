import type { MenuCatalog, MenuItem } from '@/features/menu/lib/menu-catalog';

/**
 * Temporary “New Menu” campaign. Visible from startsAt for durationMonths.
 * Update slugs / startsAt when launching the next wave of new items.
 */
export const NEW_MENU_CAMPAIGN = {
  startsAt: '2026-07-31T00:00:00+07:00',
  durationMonths: 3,
  slugs: [
    'berrypresso',
    'spanish-latte',
    'mont-blanc',
    'pink-lemonade',
    'green-lemonade',
    'hazelnut-latte',
    'mango-latte',
    'strawberry-manuka',
  ],
} as const;

export type NewMenuSlug = (typeof NEW_MENU_CAMPAIGN.slugs)[number];

export function getNewMenuWindow(startsAt = NEW_MENU_CAMPAIGN.startsAt) {
  const start = new Date(startsAt);
  const end = new Date(start);
  end.setMonth(end.getMonth() + NEW_MENU_CAMPAIGN.durationMonths);
  return { start, end };
}

export function isNewMenuCampaignActive(now = new Date()): boolean {
  const { start, end } = getNewMenuWindow();
  return now >= start && now < end;
}

export function menuItemSlug(item: MenuItem): string {
  return item.id.replace(/^(beverages|pastries)-/, '');
}

export function isNewMenuItem(item: MenuItem, now = new Date()): boolean {
  if (!isNewMenuCampaignActive(now)) {
    return false;
  }
  return (NEW_MENU_CAMPAIGN.slugs as readonly string[]).includes(menuItemSlug(item));
}

export function pickNewMenuItems(catalog: MenuCatalog, now = new Date()): MenuItem[] {
  if (!isNewMenuCampaignActive(now)) {
    return [];
  }

  const bySlug = new Map(catalog.allItems.map((item) => [menuItemSlug(item), item]));

  return NEW_MENU_CAMPAIGN.slugs.flatMap((slug) => {
    const item = bySlug.get(slug);
    return item ? [item] : [];
  });
}
