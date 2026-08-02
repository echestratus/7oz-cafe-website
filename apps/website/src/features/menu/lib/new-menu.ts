import type { MenuCatalog, MenuItem } from '@/features/menu/lib/menu-catalog';

/**
 * Temporary New Menu spotlight.
 * Items stay in the full menu catalog after the window ends —
 * they only leave this section (and lose the New badge).
 * When no items are active, the section is hidden.
 * Update slugs / startsAt for the next wave.
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
    'dirty-latte',
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
