# Image sources

Every photograph in `public/images/` comes from apmgpainting.com.au — APMG's own
media library, shot for APMG. Nothing here is stock, and nothing here is
generated. This file records where each file came from so that a future editor
can re-fetch an original at full size, or retire an asset when the source page
that justified it is gone.

Scraped by crawling the live site's HTML (the WordPress REST API and all three
sitemap paths return a 500). Each `srcset` family was collapsed to its largest
variant, checked against what was already committed by perceptual hash, then
re-encoded to WebP at quality 80.

## Naming

Files are named for what is in the frame, not for the camera roll. `1O8A4142`
tells a future editor nothing; `supervisor-roof-walkthrough` tells them whether
it is the shot they want without opening it.

## What the alt text may say

The two `company/` photographs are of an APMG-signed unit and forecourt. **No
surface may caption them as Bayswater North.** They predate the move and nobody
has confirmed which premises they show; the address is stated in text, beside
them, from `lib/site.ts`. Describing the building without naming the suburb
costs the page nothing and cannot go stale.

## 2026-08-25 — contact page scrape

| File                                    | Source path under `/wp-content/uploads/` |
| --------------------------------------- | ---------------------------------------- |
| `company/apmg-fleet-depot.webp`         | `2025/09/DJI_0020.webp`                  |
| `company/apmg-team-lineup.webp`         | `2025/10/apmg-team-scaled.webp`          |
| `company/apmg-crew-onsite.webp`         | `2025/09/apmg-painitng-team.webp`        |
| `company/apmg-van-street.webp`          | `2025/10/apmgpainting-van.webp`          |
| `work/supervisor-roof-walkthrough.webp` | `2025/09/1O8A4142.webp`                  |
| `work/tapware-refit-detail.webp`        | `1O8A4662.webp`                          |
| `work/office-ceiling-cut-in.webp`       | `2025/10/1O8A4799.webp`                  |
| `work/office-corridor-rolling.webp`     | `2025/10/1O8A4796.webp`                  |
| `work/planter-wall-cutting-in.webp`     | `2M6A0245.webp`                          |
| `work/column-spray-respirator.webp`     | `2M6A0864.webp`                          |
| `work/painter-extension-roller.webp`    | `2025/09/apmg-painter-with-roller.webp`  |

Placed so far: `apmg-fleet-depot` and `apmg-team-lineup` on `/contact-us/`;
`supervisor-roof-walkthrough` in the `/trade-services/` hero and
`office-corridor-rolling` in its media band. The rest are in the library unplaced — they are here because the scrape was worth
doing once properly rather than a page at a time.

Three candidates were dropped as duplicates of files already committed:
`1O8A4813` (`work/office-roller-occupied.webp`), `2M6A1813`
(`projects/emmaus-college-vermont-02.webp`) and `DJI_0035`
(`projects/emmaus-college-vermont-01.webp`).
