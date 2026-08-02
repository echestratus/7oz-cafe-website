UPDATE blog_posts
SET cover_url = '/assets/news/minister-visit-uzbekistan.jpg',
    updated_at = NOW()
WHERE slug = 'malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan'
  AND deleted_at IS NULL;

UPDATE blog_posts
SET cover_url = '/assets/news/grand-opening-tashkent.jpg',
    updated_at = NOW()
WHERE slug = 'grand-opening-7oz-espresso-cafe-in-tashkent'
  AND deleted_at IS NULL;
