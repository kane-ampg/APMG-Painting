# CMS page editor — design

**Date:** 2026-09-10
**Goal:** Farbod and Zac open the editor, see each public page as the list of
sections it is made of, and swap the images and text inside those sections.
Nothing can be added, removed or reordered. AI drafts summaries and alt text.
Everything else in the CMS (login, allowlist, publishing, revalidation, image
pipeline) stays as built.

**Demo mode first.** The first deliverable runs with no database, in the
existing local preview mode (`isLocalPreview()`): login is skipped, content
comes from the TypeScript files, the media manager shows the repo's photos
under `public/images/`, and Save is disabled with a clear message. The same
screens work unchanged once Supabase is configured.

## 1. Information architecture

Top bar: **Pages · Media · Blog · Business details**. "Pages" is the landing
view; the old collection lists (`/admin/projects/` etc.) stay reachable but
are not in the top bar.

`/admin/pages/` lists every public page with its title, URL and a thumbnail
of its hero image: Home, Commercial painting, Office painting, Trade
services, About us, Contact us, Projects (index), each project case study,
each sector page, Blog (index).

`/admin/pages/<page>/` shows that page's **sections in order**, top to
bottom, matching the public page. Each section is a card with a small
heading ("Hero", "What we paint", "Where we work most", "Featured projects",
"Reviews", "Call to action") and its content rendered in plain form:

- Editable text renders as an input or textarea with a human label.
- Editable images render as a thumbnail with a **Swap image** button and an
  alt-text field.
- Fixed content (copy that is code, sectors, reviews, FAQs) renders greyed
  with the note "Fixed copy — ask the developer to change this". It is
  visible so the editors see the whole structure, but not editable.

A page's editable fields come from the existing collections:

| Page                                 | Sections and what is editable                                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home                                 | Hero (fixed video; headline/lede fixed), What we paint → each service card: photo, title, summary, four chips (services collection), Where we work most (fixed), Featured projects → each card's cover photo and title (projects), Reviews (fixed), CTA phone (business details) |
| Commercial / Office / Trade services | Service blocks as above; page intros fixed                                                                                                                                                                                                                                       |
| About us                             | Copy fixed; address, phone, ABN from business details                                                                                                                                                                                                                            |
| Contact us                           | Heading, lede, form heading, form intro, meta (pages/contact-us); phone, email, address, hours (business details)                                                                                                                                                                |
| Project case study                   | Every project field: cover and gallery photos with alt, title, challenge, scope list, preparation list, coating system, access list, constraints list, outcome list, testimonial                                                                                                 |
| Sector pages                         | Fixed copy; related project cards (projects)                                                                                                                                                                                                                                     |
| Blog post                            | All post fields; Markdown body with a plain toolbar-free textarea; AI draft button for summary/meta                                                                                                                                                                              |
| Business details                     | Phone, email, address, hours, ABN, socials (settings/site)                                                                                                                                                                                                                       |

## 2. Field presentation

Every field has a label and, where useful, one line of help. Labels live in
`lib/admin/labels.ts` keyed by collection and field. No code names are ever
shown.

- Strings: input; long strings (summary, challenge, body, lede): textarea.
- String lists (scope, outcomes, chips): one input per item with a remove
  button and an "Add item" button. Items can be added and removed because
  they are text, not layout. No drag handles.
- Images: thumbnail (aspect preserved), alt text input, **Swap image**.
- Project gallery: each image as a row (thumbnail, alt, Swap). No reorder.
- Testimonial: quote, attribution, organisation inputs, or "No testimonial".
- Technical fields (slug, isFeatured, sectorSlug, related slugs, tags,
  publishedAt) sit in a collapsed **Advanced** group at the bottom.
- Meta title and description show a character count against the limit.

## 3. Media manager

`/admin/media/` is a grid of thumbnails with the file name, dimensions and
alt text under each, an **Upload** drop zone at the top, and a search box
that filters by name and alt. Clicking a thumbnail opens a side panel with
the large image, its alt text (editable, with "Describe with AI") and the
pages that use it.

In local preview mode the grid lists every file under `public/images/**`
(read with `fs`, dimensions via `sharp`, served from the same path). Upload
and alt edits show the local-preview message. With Supabase configured the
grid lists the `media` table as today.

**Swap image** anywhere opens the same grid in a modal. Choosing an image
sets the field; the modal also has the upload drop zone. Picking never
saves by itself; the editor still presses Save.

## 4. Preview and saving

The page editor has a **Preview** button that opens the public page at its
real URL in a new tab (`/admin/preview/...` for drafts). Save draft and
Publish stay as today; in local preview mode both are disabled and show
"Local preview: no database is configured, so changes are not saved." A
banner at the top of every admin page says the same.

## 5. Not in scope

Adding, removing or reordering sections; new pages; rich text; changing
fixed copy; sectors, suburbs, FAQs, reviews, accreditations; roles beyond
the allowlist.

## 6. Acceptance

With no Supabase keys, `npm run dev` on the branch and:

1. `/admin/` lands on Pages with every public page listed and a thumbnail.
2. `/admin/pages/home/` shows sections in the site's order; the "What we
   paint" cards show real photos with Swap image and labelled fields.
3. Swap image opens a grid of the 21 repo photos with dimensions; choosing
   one replaces the thumbnail in the form.
4. A project page editor shows every image with alt, lists as items, no
   JSON anywhere, technical fields under Advanced.
5. Media shows the 21 photos with dimensions; search filters them.
6. Save shows the local-preview message; nothing crashes.
7. `npm run verify` passes; existing unit tests updated where labels or
   structure changed; new tests cover the page map (every public route has
   a page entry) and the local media listing.
