-- Seed two published news stories from recent official hospitality tastings.

INSERT INTO blog_posts (
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    status,
    published_at,
    seo
) VALUES
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee03',
    'uzbekistans-tourism-chairman-tries-gayoh-coffee-at-7oz',
    'Uzbekistan''s Tourism Chairman Tries Gayoh Coffee at 7Oz',
    'Uzbekistan''s Chairman of Tourism sat down with 7Oz for Gayoh coffee — a signature cup that turned an official pause into a memorable taste of Indonesian hospitality.',
    $body_chairman$Uzbekistan's Chairman of Tourism sat down with 7Oz for Gayoh coffee — a quiet, carefully poured pause in a formal program, and a first impression that tourism leaders rarely forget.

The tasting placed Indonesian coffee craft beside Uzbekistan's hospitality agenda. Around the bar, cups were served with the same composure 7Oz brings to every guest: clean extraction, a composed presentation, and a flavor meant to be tasted slowly rather than rushed between appointments.

## Gayoh, poured with intention

Gayoh is one of 7Oz's most distinctive cups. It is not a novelty pour for cameras. It is a signature drink built to carry aroma, balance, and a story guests can retell — the kind of detail that stays with a visitor after the official photographs are filed.

For a tourism chairman, that cup is also a working sample of destination experience. Guests remember how they were received. They remember the warmth of the room. They remember a flavor that felt considered.

## Indonesian coffee in a Central Asian conversation

7Oz Espresso Cafe carries Indonesian coffee heritage into Uzbekistan through EGI Food under PT. EGI Resources. The brand's work in Tashkent has always been about more than opening a cafe: it is about proving that Nusantara coffee culture can sit comfortably in Central Asia without losing its character.

A visit like this makes that argument without a speech. The chairman did not need a briefing deck to understand the point. He needed a cup that was worth finishing.

## Why the moment matters

Tourism is built from small, repeatable welcomes. When the person responsible for those first welcomes chooses to try Gayoh at 7Oz, it underscores the cafe's role as a meeting point — between Jakarta and Tashkent, between protocol and pleasure, between a destination's promise and the taste that makes it believable.

7Oz will keep pouring that cup the same way: precise, generous, and ready for whoever sits down next.$body_chairman$,
    'news',
    '/assets/news/chairman-tourism-uz-trying-gayoh-coffee.webp',
    'published',
    TIMESTAMPTZ '2026-08-06 09:00:00+00',
    '{"metaTitle":"Uzbekistan''s Tourism Chairman Tries Gayoh Coffee at 7Oz","metaDescription":"Uzbekistan''s Chairman of Tourism tasted 7Oz Gayoh coffee — Indonesian hospitality in a cup, served during an official visit.","canonicalPath":"/blogs/uzbekistans-tourism-chairman-tries-gayoh-coffee-at-7oz"}'::jsonb
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee04',
    'samarkand-governor-and-indonesia-hajj-minister-taste-7oz-coffee',
    'Samarkand''s Governor and Indonesia''s Hajj Minister Taste 7Oz Coffee',
    'The Governor of Samarkand and Indonesia''s Minister of Hajj shared 7Oz coffee together — a diplomatic pause where two countries met over a carefully poured cup.',
    $body_samarkand$The Governor of Samarkand and Indonesia's Minister of Hajj shared 7Oz coffee together — standing at a long wooden bar, cups in hand, while black 7Oz boxes lined the counter and conversation settled into the unhurried pace that good coffee invites.

It was a formal room and an informal ritual. Protocol brought the guests to the same table. The cup gave them something warmer to talk about than the agenda.

## A cup between two welcomes

Samarkand is one of Uzbekistan's great historic cities, defined by welcome as much as by heritage. Indonesia's Hajj ministry represents faith, pilgrimage, and care for people on the move. Sharing 7Oz coffee between those two offices is a simple image with a long echo: hospitality that travels, and a taste that does not need translation.

The moment also belongs to a wider pattern. Official guests keep finding 7Oz when Indonesia and Uzbekistan sit down together — because a cafe that takes coffee seriously is a natural place to pause.

## Indonesian coffee, presented as it is meant to be

7Oz served the cup the way the brand always intends it: precise, generous, and unmistakably Indonesian in spirit. Beside the pour sat the cafe's packaged coffee — a reminder that the same craft guests find in the tasting can also travel home.

That dual presence matters. A single espresso can open a conversation. A box of 7Oz coffee can continue it after the visit ends.

## Diplomacy without the podium

Not every diplomatic moment needs a stage. Sometimes it is a saucer, a shared smile, and a barista working quietly at the end of the bar. 7Oz was there for that pause — pouring for Samarkand's governor, Indonesia's Hajj minister, and everyone standing with them.

The photographs will show suits, cups, and a polished counter. The story underneath is simpler: two countries, one cafe, and a cup worth remembering.$body_samarkand$,
    'news',
    '/assets/news/samarkand-governor-and-indonesia-minister-of-hajj-trying-7oz-coffee.webp',
    'published',
    TIMESTAMPTZ '2026-09-07 09:00:00+00',
    '{"metaTitle":"Samarkand''s Governor and Indonesia''s Hajj Minister Taste 7Oz Coffee","metaDescription":"The Governor of Samarkand and Indonesia''s Minister of Hajj tasted 7Oz coffee together — a diplomatic pause over Indonesian coffee.","canonicalPath":"/blogs/samarkand-governor-and-indonesia-hajj-minister-taste-7oz-coffee"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
