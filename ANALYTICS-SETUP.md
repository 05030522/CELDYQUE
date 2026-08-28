# CELDYQUE analytics setup

## IDs

- GTM container: `GTM-MQ9CS753`
- GA4 measurement ID: `G-MHWJ7SQ6ZZ`
- Production hosts: `https://celdyque.com` and `https://www.celdyque.com`

These identifiers are public installation identifiers, not account credentials.

## Website implementation

`assets/site.js` loads the first-party `assets/analytics.js` consent UI on every
page using the shared site assets, including all 20 sitemap pages. No direct
`gtag.js` installation or unconditional GTM noscript iframe is added.
Shared script, CSS and footer URLs are versioned to avoid stale service-worker
assets hiding the new consent controls. The offline cache version is bumped.

- Analytics is off until the visitor explicitly allows it.
- The Google container itself is blocked before consent and after refusal.
- Consent commands are queued on the page before GTM is loaded, not in a GTM
  Custom HTML tag. Analytics consent alone can become granted; `ad_storage`,
  `ad_user_data` and `ad_personalization` remain denied.
- The choice is stored in `celdyque.analytics-consent.v1` in localStorage for
  180 days. Invalid, expired or inaccessible storage fails closed. Storage is
  required to opt in, so withdrawal can be saved as well.
- Visitors can reopen Analytics settings in the footer. Withdrawal disables
  this GA4 destination, removes its standard first-party `_ga` cookies, queues
  the denial, and reloads to unload existing tag listeners. A consent update
  may be sent at withdrawal; no new visit tracking should run after reload.
- Other tabs, page restores and expiry are rechecked. The notice does not
  block browsing or the existing Amazon Attribution links.
- Localhost, preview hosts and HTTP never load Google tags, even after opt-in.
- The banner governs only this site's analytics, not external Amazon pages,
  Google Fonts, hosting logs, or all potential third-party services.

This is a technical implementation, not a legal compliance certification. The
owner must review the notice, privacy disclosures, applicable visitor regions,
data retention and account settings before production activation. The website
does not yet have an owner-approved, comprehensive privacy policy.

## Owner: create the Google tag in GTM

1. Open the `celdyque.com` container (`GTM-MQ9CS753`).
2. Go to **Tags > New**. Name it **GA4 - CELDYQUE**.
3. Under **Tag Configuration**, choose **Google Tag** (not a GA4 Event tag).
4. Enter **Tag ID**: `G-MHWJ7SQ6ZZ`.
5. Under **Triggering**, select **Initialization - All Pages**. Do not use
   **Consent Initialization** for this analytics tag.
6. Save. Keep the container limited to this tag until its consent behavior is
   verified. Do not add advertising tags, URL passthrough, cross-domain linking
   to Amazon, or another direct GA4 installation.
7. Once website code is deployed and disclosures reviewed, use **Preview** with
   `https://celdyque.com/`. Allow analytics in the site's banner and confirm the
   Google tag fires once, with analytics granted and all ad consent denied.
8. Use **Submit > Publish and Create Version** after the preview is correct.

Because this is basic consent, Tag Assistant can report no tag before opt-in.
This is expected. Do not bypass the consent gate to make that warning disappear.
Account creation, a saved GTM workspace tag, and a published GTM container are
different steps. This code change alone does not publish the GTM container.

## Owner: GA4 settings and verification

- Keep enhanced measurement for page views, scrolls and outbound clicks enabled.
  Review the remaining enhanced events. Do not send contact details, email
  addresses, free-form text or other personal information in URLs/events.
- A normal outbound Amazon link generates enhanced-measurement event `click`
  after installation and consent. Use its `link_url`, `link_domain` and
  `outbound` parameters to identify retailer traffic. No duplicate click event
  or fake `purchase` event is added by the website code.
- Do not configure Amazon as a cross-domain measurement domain. Actual sales
  are measured by Amazon Attribution, not this site's GA4 property.
- In a clean browser session, verify no `gtm.js`, `gtag/js` or analytics collect
  requests before a choice or after Decline. Existing font/media requests are
  unrelated to analytics.
- After Allow analytics, verify one container request, one page view per page,
  and the correct GA4 ID. Check GA4 Realtime or DebugView, then the outbound
  Amazon click. Exclude testing/internal traffic when reviewing results.
- Reopen Analytics settings, decline, and confirm reload, cookie cleanup and
  no analytics requests on subsequent pages. Check again on mobile.
- Test without an ad blocker only in a dedicated test session; visitors who
  decline, block scripts or withhold referrers will not appear fully in reports.
- AI referral traffic is not the same as all AI mentions or search exposure.
- Choose and document the GA4 event-data retention period and who may access
  the property. Verify whether Amazon tags are reused outside this website.

## Local checks

```sh
node --test scripts/test_analytics.cjs scripts/test_faq.cjs
python scripts/check_seo.py
git diff --check
```

The unit tests simulate consent/storage and script insertion without making
Google requests. Local browser QA checks the UI with tracking disabled by the
hostname gate. Neither replaces live Tag Assistant and GA4 verification after
the owner publishes the Google tag and deploys the website.

Local verification: 18 Node tests and the 20-page SEO checker pass. Desktop and
mobile checks cover the banner, equal-size choice buttons, decline, reopening
settings, focus return, and saved opt-in after reload. No Google script is
inserted on localhost. The existing Shop full-bleed hero produces a small
horizontal overflow with desktop scrollbars; the new notice stays within the
viewport. No unrelated Shop layout changes were included.

## Official references

- [Basic consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Consent code and ordering](https://developers.google.com/tag-platform/security/guides/consent)
- [Add the Google tag in GTM](https://support.google.com/tagmanager/answer/14842872?hl=en)
- [Verify and publish](https://support.google.com/tagmanager/answer/14842769?hl=en)
- [Enhanced measurement](https://support.google.com/analytics/answer/9216061?hl=en)
- [Privacy controls and opt-out](https://developers.google.com/tag-platform/security/guides/privacy)
