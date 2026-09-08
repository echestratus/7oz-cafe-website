import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import { getApiBaseUrl } from '@/lib/env';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  kind: 'news' | 'event' | string;
  coverUrl?: string | null;
  status: string;
  publishedAt?: string | null;
  seo?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BlogListResult = {
  items: BlogPost[];
  page: number;
  limit: number;
  total: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload && 'message' in payload ? payload.message : 'Unable to load blogs.');
  }

  return payload.data;
}

export async function listPublishedBlogs(page = 1, limit = 12): Promise<BlogListResult> {
  const response = await fetch(
    `${getApiBaseUrl()}/public/blogs?page=${page}&limit=${limit}`,
    {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    },
  );
  return parseResponse<BlogListResult>(response);
}

export async function getPublishedBlogBySlug(slug: string): Promise<BlogPost> {
  const response = await fetch(`${getApiBaseUrl()}/public/blogs/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  return parseResponse<BlogPost>(response);
}

export const fallbackBlogPosts: BlogPost[] = [
  {
    id: 'fallback-4',
    slug: 'samarkand-governor-and-indonesia-hajj-minister-taste-7oz-coffee',
    title: "Samarkand's Governor and Indonesia's Hajj Minister Taste 7Oz Coffee",
    excerpt:
      "The Governor of Samarkand and Indonesia's Minister of Hajj shared 7Oz coffee together — a diplomatic pause where two countries met over a carefully poured cup.",
    body: `The Governor of Samarkand and Indonesia's Minister of Hajj shared 7Oz coffee together — standing at a long wooden bar, cups in hand, while black 7Oz boxes lined the counter and conversation settled into the unhurried pace that good coffee invites.

It was a formal room and an informal ritual. Protocol brought the guests to the same table. The cup gave them something warmer to talk about than the agenda.

## A cup between two welcomes

Samarkand is one of Uzbekistan's great historic cities, defined by welcome as much as by heritage. Indonesia's Hajj ministry represents faith, pilgrimage, and care for people on the move. Sharing 7Oz coffee between those two offices is a simple image with a long echo: hospitality that travels, and a taste that does not need translation.

The moment also belongs to a wider pattern. Official guests keep finding 7Oz when Indonesia and Uzbekistan sit down together — because a cafe that takes coffee seriously is a natural place to pause.

## Indonesian coffee, presented as it is meant to be

7Oz served the cup the way the brand always intends it: precise, generous, and unmistakably Indonesian in spirit. Beside the pour sat the cafe's packaged coffee — a reminder that the same craft guests find in the tasting can also travel home.

That dual presence matters. A single espresso can open a conversation. A box of 7Oz coffee can continue it after the visit ends.

## Diplomacy without the podium

Not every diplomatic moment needs a stage. Sometimes it is a saucer, a shared smile, and a barista working quietly at the end of the bar. 7Oz was there for that pause — pouring for Samarkand's governor, Indonesia's Hajj minister, and everyone standing with them.

The photographs will show suits, cups, and a polished counter. The story underneath is simpler: two countries, one cafe, and a cup worth remembering.`,
    kind: 'news',
    coverUrl: '/assets/news/samarkand-governor-and-indonesia-minister-of-hajj-trying-7oz-coffee.webp',
    status: 'published',
    publishedAt: '2026-09-07T09:00:00Z',
    createdAt: '2026-09-07T09:00:00Z',
    updatedAt: '2026-09-07T09:00:00Z',
  },
  {
    id: 'fallback-3',
    slug: 'uzbekistans-tourism-chairman-tries-gayoh-coffee-at-7oz',
    title: "Uzbekistan's Tourism Chairman Tries Gayoh Coffee at 7Oz",
    excerpt:
      "Uzbekistan's Chairman of Tourism sat down with 7Oz for Gayoh coffee — a signature cup that turned an official pause into a memorable taste of Indonesian hospitality.",
    body: `Uzbekistan's Chairman of Tourism sat down with 7Oz for Gayoh coffee — a quiet, carefully poured pause in a formal program, and a first impression that tourism leaders rarely forget.

The tasting placed Indonesian coffee craft beside Uzbekistan's hospitality agenda. Around the bar, cups were served with the same composure 7Oz brings to every guest: clean extraction, a composed presentation, and a flavor meant to be tasted slowly rather than rushed between appointments.

## Gayoh, poured with intention

Gayoh is one of 7Oz's most distinctive cups. It is not a novelty pour for cameras. It is a signature drink built to carry aroma, balance, and a story guests can retell — the kind of detail that stays with a visitor after the official photographs are filed.

For a tourism chairman, that cup is also a working sample of destination experience. Guests remember how they were received. They remember the warmth of the room. They remember a flavor that felt considered.

## Indonesian coffee in a Central Asian conversation

7Oz Espresso Cafe carries Indonesian coffee heritage into Uzbekistan through EGI Food under PT. EGI Resources. The brand's work in Tashkent has always been about more than opening a cafe: it is about proving that Nusantara coffee culture can sit comfortably in Central Asia without losing its character.

A visit like this makes that argument without a speech. The chairman did not need a briefing deck to understand the point. He needed a cup that was worth finishing.

## Why the moment matters

Tourism is built from small, repeatable welcomes. When the person responsible for those first welcomes chooses to try Gayoh at 7Oz, it underscores the cafe's role as a meeting point — between Jakarta and Tashkent, between protocol and pleasure, between a destination's promise and the taste that makes it believable.

7Oz will keep pouring that cup the same way: precise, generous, and ready for whoever sits down next.`,
    kind: 'news',
    coverUrl: '/assets/news/chairman-tourism-uz-trying-gayoh-coffee.webp',
    status: 'published',
    publishedAt: '2026-08-06T09:00:00Z',
    createdAt: '2026-08-06T09:00:00Z',
    updatedAt: '2026-08-06T09:00:00Z',
  },
  {
    id: 'fallback-1',
    slug: 'malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan',
    title: "Malaysia's Minister of Religious Affairs Visits 7oz Cafe in Uzbekistan",
    excerpt:
      "Malaysia's Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit.",
    body: `Malaysia's Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit.

The stop showcased the cafe's warm hospitality, inviting atmosphere, and commitment to serving quality food and beverages.

It became a memorable moment that reflects the growing friendship between Malaysia and Uzbekistan — and the role of 7oz as a welcoming space for conversation over carefully crafted coffee.`,
    kind: 'news',
    coverUrl: '/assets/news/minister-visit-uzbekistan.webp',
    status: 'published',
    publishedAt: '2026-05-25T07:00:00Z',
    createdAt: '2026-05-25T07:00:00Z',
    updatedAt: '2026-05-25T07:00:00Z',
  },
  {
    id: 'fallback-2',
    slug: 'grand-opening-7oz-espresso-cafe-in-tashkent',
    title: 'Grand Opening 7oz Espresso Cafe in Tashkent',
    excerpt:
      '7oz Espresso Cafe opened in Tashkent Boulevard on April 15, 2026 — bringing Indonesian coffee heritage to Uzbekistan.',
    body: `7oz Espresso Cafe officially made history by hosting a festive grand opening on Wednesday, April 15, 2026, in one of Tashkent's most prestigious commercial areas: Tashkent Boulevard, Uzbekistan.

The modern urban coffee shop marks a proud expansion of Indonesian coffee culture abroad. It is managed by EGI Food under PT. EGI Resources, bringing Jakarta's cafe craft to Central Asia with intention and warmth.

## EGI Resources on the international stage

Opening the first international branch in Central Asia reflects a long-term global vision. Market entry into Uzbekistan was grounded in careful research into urban lifestyle growth in the capital — and a belief that exceptional coffee can travel with its heritage intact.

## Modern architecture with Nusantara warmth

The facade and interior blend modern industrial aesthetics with warm Nusantara hospitality. Natural wood, soft lighting, ergonomic seating, and indoor greenery create a space for guests who come to meet, work, or simply unwind over a carefully pulled cup.

## Opening day energy

On inauguration day, locals and the Indonesian diaspora filled the cafe. The program included coffee cupping, latte art demonstrations by a head barista from Jakarta, and freshly baked pastries from the EGI Food kitchen — a strong start for international F&B operations.`,
    kind: 'event',
    coverUrl: '/assets/news/grand-opening-tashkent.webp',
    status: 'published',
    publishedAt: '2026-04-15T10:00:00Z',
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
  },
];
