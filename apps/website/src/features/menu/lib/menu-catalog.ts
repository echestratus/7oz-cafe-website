import { readdir } from 'node:fs/promises';
import path from 'node:path';

export type MenuCategoryId = 'coffee' | 'non-coffee' | 'pastries';

export type MenuItem = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category: MenuCategoryId;
  group: 'beverages' | 'pastries';
};

export type MenuCategory = {
  id: MenuCategoryId;
  group: 'beverages' | 'pastries';
  label: string;
  description: string;
  items: MenuItem[];
};

export type MenuCatalog = {
  categories: MenuCategory[];
  allItems: MenuItem[];
};

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/** Filenames that are coffee drinks even when the slug is ambiguous. */
const COFFEE_SLUGS = new Set([
  'berrypresso',
  'bumble-coffee',
  'espresso',
  'hazelnut-latte',
  'hot-americano',
  'hot-latte',
  'mont-blanc',
  'raf-coffee',
  'raspberry-raf',
]);

const NON_COFFEE_SLUGS = new Set([
  'green-lemonade',
  'hot-chocolate',
  'ice-chocolate',
  'pink-lemonade',
  'strawberry-mojito',
]);

const CATEGORY_META: Record<
  MenuCategoryId,
  { group: 'beverages' | 'pastries'; label: string; description: string }
> = {
  coffee: {
    group: 'beverages',
    label: 'Coffee',
    description: 'Espresso classics and specialty cups from the bar.',
  },
  'non-coffee': {
    group: 'beverages',
    label: 'Non-coffee',
    description: 'Chocolate, lemonade, and refreshing house drinks.',
  },
  pastries: {
    group: 'pastries',
    label: 'Pastries',
    description: 'Fresh pastry from the case — danish, croissant, and more.',
  },
};

export function toMenuLabel(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function slugFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').toLowerCase();
}

export function classifyBeverageSlug(slug: string): 'coffee' | 'non-coffee' {
  if (NON_COFFEE_SLUGS.has(slug)) {
    return 'non-coffee';
  }
  if (COFFEE_SLUGS.has(slug)) {
    return 'coffee';
  }

  const coffeeHints = ['coffee', 'espresso', 'latte', 'americano', 'raf', 'cappuccino', 'mocha'];
  if (coffeeHints.some((hint) => slug.includes(hint))) {
    return 'coffee';
  }

  return 'non-coffee';
}

async function listImagesInFolder(relativeFolder: string): Promise<string[]> {
  const directory = path.join(process.cwd(), 'public', 'assets', 'menu', relativeFolder);
  try {
    const entries = await readdir(directory);
    return entries
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

export async function getMenuCatalog(): Promise<MenuCatalog> {
  const [beverageFiles, pastryFiles] = await Promise.all([
    listImagesInFolder('beverages'),
    listImagesInFolder('pastries'),
  ]);

  const items: MenuItem[] = [];

  for (const filename of beverageFiles) {
    const slug = slugFromFilename(filename);
    const category = classifyBeverageSlug(slug);
    items.push({
      id: `beverages-${slug}`,
      src: `/assets/menu/beverages/${filename}`,
      alt: toMenuLabel(filename),
      caption: toMenuLabel(filename),
      category,
      group: 'beverages',
    });
  }

  for (const filename of pastryFiles) {
    const slug = slugFromFilename(filename);
    items.push({
      id: `pastries-${slug}`,
      src: `/assets/menu/pastries/${filename}`,
      alt: toMenuLabel(filename),
      caption: toMenuLabel(filename),
      category: 'pastries',
      group: 'pastries',
    });
  }

  const categoryOrder: MenuCategoryId[] = ['coffee', 'non-coffee', 'pastries'];
  const categories = categoryOrder.map((id) => ({
    id,
    ...CATEGORY_META[id],
    items: items.filter((item) => item.category === id),
  }));

  return { categories, allItems: items };
}

export function pickFeaturedMenuItems(catalog: MenuCatalog): {
  coffee: MenuItem[];
  nonCoffee: MenuItem[];
  pastries: MenuItem[];
} {
  const coffee = catalog.categories.find((c) => c.id === 'coffee')?.items ?? [];
  const nonCoffee = catalog.categories.find((c) => c.id === 'non-coffee')?.items ?? [];
  const pastries = catalog.categories.find((c) => c.id === 'pastries')?.items ?? [];

  return {
    coffee: coffee.slice(0, 3),
    nonCoffee: nonCoffee.slice(0, 2),
    pastries: pastries.slice(0, 3),
  };
}
