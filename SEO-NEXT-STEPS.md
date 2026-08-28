# CELDYQUE Search Visibility Checklist

Updated: 2026-08-28. Code checks do not prove indexing, rankings, AI citations or rich-result eligibility.

## Image and Video Update (2026-08-28)

- The current sitemap has 21 canonical pages, 64 image references and one video entry. The existing sitemap URL is unchanged; no separate video sitemap submission is needed.
- Original product photos and video files are preserved. The lowered Shop photos are also unchanged. Product image descriptions now identify the visible packaging, with real intrinsic dimensions, image encoding metadata and primary-image schema. Home and About stock images have descriptive alt text without presenting them as actual CELDYQUE product photos.
- `brand-film.html` is a dedicated watch page for the already-public Home film, with native controls, a visible description and links from Home and About. Its duration is 13.72 seconds (rounded to 14 seconds in the sitemap). The original file has no audio track; the page supplies a written visual summary rather than invented spoken captions.
- `celdyque-brand-film-poster.jpg` was extracted from the Home film at 4.12 seconds; `celdyque-texture-film-poster.jpg` was extracted from the About film at 2.8 seconds. Neither is a generated product scene.
- The About background clip remains decorative. The unused `videos/video1.mp4` is not newly published or promoted by this change.
- Video `uploadDate` is not confirmed. Do not use checkout timestamps or Git commit dates as proof of first publication. VideoObject markup is intentionally deferred until the owner supplies the actual first public date; the watch page and video sitemap do not require that optional sitemap field. Do not claim a validated video rich result yet.
- Video and byte-range requests bypass the service-worker asset cache so partial responses do not interfere with playback or seeking.
- Run `python scripts/check_seo.py`, `python scripts/test_media.py`, and `node --test scripts/test_faq.cjs scripts/test_analytics.cjs scripts/test_media.cjs`. The new checks run in deployment CI too. File dimensions and duration were measured locally; test results are not evidence of public indexing.
- Local verification covered 51 image elements and 21 sharing images against their actual file dimensions, the watch page on desktop and mobile, Home-to-film navigation, native video playback, and representative product galleries. The original Home full-bleed layout still has a small pre-existing scrollbar-width overflow; it was not redesigned in this media change. Deployment and public Search Console video indexing have not been verified.

### Remaining Owner Work

1. Confirm the Home film's first public date. Then add matching, truthful VideoObject metadata on its watch page.
2. After deployment, inspect `https://celdyque.com/brand-film.html` in Search Console and request indexing. Monitor the video indexing report and Performance search types Image and Video when available. The page must be indexed before video eligibility can be assessed.
3. Provide publishable product-front/back/label photos and real use-demonstration videos with their publication dates and approved descriptions. The short brand film does not substitute for product-specific demonstrations.
4. Existing HTTPS enforcement, legacy 404 handling and GTM/GA4 publication verification remain separate follow-ups. See `ANALYTICS-SETUP.md` for the implemented consent-gated analytics; the older analytics setup item below describes the earlier SEO-only change.

References: [Google image guidance](https://developers.google.com/search/docs/appearance/google-images), [video watch-page guidance](https://developers.google.com/search/docs/appearance/video), [video sitemap requirements](https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps), [VideoObject requirements](https://developers.google.com/search/docs/appearance/structured-data/video).

## Implemented

- Canonical URLs, Open Graph URLs and site identities use https://celdyque.com/ across the 20 sitemap pages.
- Home, Shop, FAQ, About, Contact and Where to Buy have consistent metadata and structured page identities.
- Shop has a CollectionPage and a 14-product ItemList; Home links to eight featured products plus Shop, FAQ and Where to Buy.
- Home has a brand H1, video poster and intrinsic image dimensions. The missing About video poster is fixed. Original image/video files remain unchanged.
- FAQ has 21 readable answers and direct links to all 14 current products. Its JSON-LD answers match the visible answers. Topic filtering, empty states and question deep links are tested.
- Unsupported treatment claims, pregnancy assurances, guaranteed results and universal shelf-life claims have been removed from the general FAQ. Finished-product evidence still needs owner review across product copy and image-embedded text.
- Sitemap contains 20 canonical pages and 62 image references, with encoded image paths and actual modification dates.
- Existing robots rules allow Googlebot, Bingbot, OAI-SearchBot and PerplexityBot. No crawler training-policy changes were made.
- Incomplete offers with unverified stock/seller data were removed from 13 product schemas. Product identity, original photographs and Amazon attribution links are unchanged. Volufiline already had no Offer.
- Removed unused Home popup CSS and script that referenced absent elements.
- Deployment now runs semantic SEO checks and FAQ behavior tests.

## Owner Actions, in Priority Order

1. Review Home and FAQ on desktop and mobile before publishing this local change. Browser automation was blocked during this run; screenshots and visual layout have not been verified.
2. In GitHub repository Settings > Pages, enable **Enforce HTTPS** once available. The www HTTPS URL redirects correctly, but the plain HTTP apex URL returned 200 instead of redirecting during the audit. This cannot be fixed with a canonical tag alone.
3. Verify the celdyque.com domain property in Google Search Console using the DNS record supplied by Google. Submit https://celdyque.com/sitemap.xml. Inspect the Home, Shop, FAQ and priority product URLs, then request indexing where appropriate. If already verified, reuse that property.
4. Add or import the site into Bing Webmaster Tools and submit the same sitemap. Review crawl/indexing errors. IndexNow is an optional next step after ownership is established; it is not a Google indexing submission method.
5. Supply approved current ingredient lists, product-name concentration definitions, packaging directions, shelf-life labels and finished-product evidence. Confirm authorized retailers and support details. We should not extrapolate raw-ingredient studies into guaranteed product outcomes.
6. Provide real product-front/back/label photos, texture/application photos and original use-demonstration videos with permission to publish. Supply titles, accurate publication dates, duration and captions/transcripts for video pages. Preserve label legibility and never fabricate before/after results.
7. Decide whether to configure analytics. Supply a GA4 property/measurement ID and the intended consent/privacy setup. We can then measure retailer outbound clicks, page engagement and referral traffic without changing Amazon attribution parameters. No analytics or new tracking was installed in this change.

## Next Content Work

- Write an evidence-reviewed Volufiline usage guide and an honest PDRN serum/cream comparison. Link them from relevant product pages and FAQ; avoid many near-duplicate keyword pages.
- Add a dedicated page per substantive demonstration video, with the video as the main content, accessible controls, captions/transcript and matching VideoObject metadata. A decorative Home background film is not a substitute for a watch page.
- Build share-image variants from approved original photography. The repaired sharing paths currently use the existing brand image; a custom product composition remains a later enhancement.
- Review actual field performance in Search Console and PageSpeed Insights before choosing further image/video compression work. Image and video originals were not recompressed here.
- Decide what to do with the inactive Retinal page, product-detail template and coming-soon/temporary pages before adding redirects or noindex rules. Being absent from a sitemap does not itself prevent indexing.

## Search Feature Limits

- Google ended FAQ rich results in May 2026. FAQ remains useful content; its schema is not a promise of a special search display.
- Google does not require a special AI schema or llms.txt for AI search visibility. Prioritize useful, accurate, crawlable content, internal links and genuine brand evidence.
- Product rich-result requirements are not met by merely having a Product node. Current pages have no verified live offer prices or qualifying review data; rich-result eligibility has not been established. Do not invent prices, reviews, stock or seller identities to fill schema fields.
- Merchant Center online-store requirements include checkout on the merchant website. The current Amazon-outbound site should not be treated as a qualifying direct-checkout store without changing that business model.

## Verification and Recovery

Run `python scripts/check_seo.py` and `node --test scripts/test_faq.cjs` from the repository root. Automated checks cover metadata, canonical URLs, local links/assets, robots rules, schema parsing, FAQ parity, catalog coverage and sitemap images. They do not replace Google Rich Results Test, Search Console indexing checks, external retailer checks or visual/browser testing.

Before this change: local branch `backup-before-site-seo-20260828`, commit `50d138e`. The earlier product-redesign backup remains `backup-before-product-page-refresh`, commit `71f72be`. Prefer a reviewed revert commit to rewriting published main history.

## Official References

- [Google AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google FAQ feature retirement](https://developers.google.com/search/updates)
- [Google image SEO](https://developers.google.com/search/docs/appearance/google-images)
- [Google video SEO](https://developers.google.com/search/docs/appearance/video)
- [Google product snippet requirements](https://developers.google.com/search/docs/appearance/structured-data/product-snippet)
- [Search Console sitemap submission](https://support.google.com/webmasters/answer/7451001)
- [Bing sitemap submission](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed)
- [Merchant Center website requirements](https://support.google.com/merchants/answer/12160471)
