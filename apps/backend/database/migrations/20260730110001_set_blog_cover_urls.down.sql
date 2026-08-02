UPDATE blog_posts
SET cover_url = NULL,
    updated_at = NOW()
WHERE slug IN (
    'malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan',
    'grand-opening-7oz-espresso-cafe-in-tashkent'
)
  AND deleted_at IS NULL;
