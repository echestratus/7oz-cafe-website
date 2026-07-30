-- Restore prior shorter bodies from initial blog seed.

UPDATE blog_posts
SET body = $body$Malaysia's Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit. The stop showcased the cafe's warm hospitality, inviting atmosphere, and commitment to serving quality food and beverages, making it a memorable moment that reflects the growing friendship between Malaysia and Uzbekistan.$body$,
    updated_at = NOW()
WHERE slug = 'malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan'
  AND deleted_at IS NULL;

UPDATE blog_posts
SET body = $body$7oz Espresso Cafe officially made history by hosting a festive grand opening on Wednesday, April 15, 2026, in one of Tashkent's most prestigious commercial areas, Tashkent Boulevard, Uzbekistan. The modern urban coffee shop marks a proud expansion of Indonesian coffee culture abroad and is managed by EGI Food under PT. EGI Resources.

## EGI Resources on the international stage

Opening the first international branch in Central Asia reflects a long-term global vision. Market entry into Uzbekistan was based on careful research into urban lifestyle growth in the capital.

## Modern architecture with Nusantara warmth

The facade and interior blend modern industrial aesthetics with warm Nusantara hospitality — natural wood, soft lighting, ergonomic seating, and indoor greenery for guests who come to meet, work, or unwind.

## Opening day energy

On inauguration day, locals and the Indonesian diaspora filled the cafe. The program included coffee cupping, latte art demonstrations by a head barista from Jakarta, and freshly baked pastries from the EGI Food kitchen — a strong start for international F&B operations.$body$,
    updated_at = NOW()
WHERE slug = 'grand-opening-7oz-espresso-cafe-in-tashkent'
  AND deleted_at IS NULL;
