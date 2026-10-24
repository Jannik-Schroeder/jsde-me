# Canonicals and scheduled content

Each public page and MDX article owns its canonical URL. No shared root canonical is inherited by every article. Existing Europe/Berlin publication filtering and future-route notFound behavior remain in use. A new sitemap uses the same published-only index and revalidates hourly; the homepage now also revalidates hourly so scheduled articles do not require a redeploy to appear in the list. Publication date is not emitted as an invented modification timestamp.

Live validation compares all committed article dates to the public index/sitemap: published articles must return 200, future articles must remain 404 and absent from lists/feed/sitemap.
