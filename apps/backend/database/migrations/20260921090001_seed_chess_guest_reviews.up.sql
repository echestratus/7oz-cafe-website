-- Add chess-guest video reviews to homepage testimonials.

UPDATE cms_contents
SET data = $json${
  "heading": "Guest Voices",
  "description": "Players, ministers, and visiting friends — in their own words.",
  "items": [
    {
      "name": "Dr. Zulkifli Hasan",
      "role": "Minister in the Prime Minister's Department (Religious Affairs), Malaysia",
      "review": "I'm a coffee enthusiast, and I rarely return to the same café two days in a row. After trying the coffee yesterday, I came back again today—it really is that good.",
      "avatarSrc": "/assets/reviews/dr-zulkifli-hasan.webp",
      "videoSrc": "/assets/reviews/dr-zulkifli-hasan.mp4"
    },
    {
      "name": "Shady Al-Suleiman",
      "review": "Alhamdulillah, I've tried this coffee, and it's a really good coffee. Very enjoyable—Alhamdulillah.",
      "avatarSrc": "/assets/reviews/shady-al-suleiman.webp",
      "videoSrc": "/assets/reviews/shady-al-suleiman.mp4"
    },
    {
      "name": "Evgenij Miroshnichenko",
      "role": "Grandmaster, Ukraine",
      "review": "I'm not really a coffee expert — more of a chess expert from Ukraine. I go by Miro. I discovered this place, and the coffee is fantastic. I've bought packages to take home. Everything is perfect. I love the guys, and I love the place. I hope we'll have more coffee shops like this.",
      "avatarSrc": "/assets/reviews/evgenij-miroshnichenko.webp",
      "videoSrc": "/assets/reviews/evgenij-miroshnichenko.mp4"
    },
    {
      "name": "Aleksa Strikovic",
      "role": "Grandmaster",
      "review": "Good afternoon. We're here at this wonderful place. Very good coffee, very tasty coffee, and a very nice guy serving us. Everything is fine. I recommend this place.",
      "avatarSrc": "/assets/reviews/aleksa-strikovic.webp",
      "videoSrc": "/assets/reviews/aleksa-strikovic.mp4"
    },
    {
      "name": "Sherkia Andrew",
      "review": "Hi, I'm Sherkia Andrew. We're here at 7Oz Cafe, and they really have good quality beverages. I have to recommend it — the team checking in on us, asking what we want, asking if we need anything more. I really admire the effort. Honestly, a 10 out of 10 experience.",
      "avatarSrc": "/assets/reviews/sherkia-andrew.webp",
      "videoSrc": "/assets/reviews/sherkia-andrew.mp4"
    },
    {
      "name": "Diajeng Theresa Singgih",
      "role": "Indonesian Women's Chess Olympiad",
      "review": "I'm Diajeng Theresa Singgih, from Indonesia's women's Olympiad chess team. I just ordered matcha — sometimes coffee, sometimes matcha — ahead of competing for Indonesia. 7Oz Espresso Cafe is very cozy. I really love the matcha, and the coffee wakes me up in a good way. I come here every day while I'm in Uzbekistan. You have to try it.",
      "avatarSrc": "/assets/reviews/diajeng-theresa-singgih.webp",
      "videoSrc": "/assets/reviews/diajeng-theresa-singgih.mp4"
    },
    {
      "name": "Omar Phelps",
      "role": "International Master",
      "review": "I'm at 7Oz. Someone told me to try this coffee — and when I did, I swear it's the best coffee of all time. The best coffee on the planet. Come try it. Come to 7Oz. You won't regret it. Santé — health and happiness.",
      "avatarSrc": "/assets/reviews/omar-phelps.webp",
      "videoSrc": "/assets/reviews/omar-phelps.mp4"
    }
  ]
}$json$::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc07';

WITH homepage AS (
    SELECT id
    FROM cms_pages
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
),
next_version AS (
    SELECT COALESCE(MAX(v.version_number), 0) + 1 AS version_number
    FROM cms_versions v
    INNER JOIN homepage h ON h.id = v.page_id
),
inserted AS (
    INSERT INTO cms_versions (id, page_id, version_number, summary, snapshot, published_at)
    SELECT
        'dddddddd-dddd-dddd-dddd-dddddddddd22'::uuid,
        h.id,
        nv.version_number,
        'Homepage guest reviews: chess visitors',
        jsonb_build_object(
            'page', jsonb_build_object(
                'id', p.id,
                'slug', p.slug,
                'title', p.title,
                'status', 'published',
                'seo', p.seo
            ),
            'sections', COALESCE((
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', s.id,
                        'code', s.code,
                        'label', s.label,
                        'isEnabled', s.is_enabled,
                        'sortOrder', s.sort_order,
                        'data', c.data
                    )
                    ORDER BY s.sort_order, s.code
                )
                FROM cms_sections s
                INNER JOIN cms_contents c ON c.section_id = s.id
                WHERE s.page_id = p.id
                  AND s.deleted_at IS NULL
            ), '[]'::jsonb)
        ),
        NOW()
    FROM homepage h
    INNER JOIN cms_pages p ON p.id = h.id
    CROSS JOIN next_version nv
    WHERE NOT EXISTS (
        SELECT 1
        FROM cms_versions existing
        WHERE existing.id = 'dddddddd-dddd-dddd-dddd-dddddddddd22'::uuid
    )
    RETURNING id, page_id
)
UPDATE cms_pages p
SET published_version_id = i.id,
    status = 'published',
    updated_at = NOW()
FROM inserted i
WHERE p.id = i.page_id;
