# What we need from APMG

The website is built. Everything below is the material we cannot produce for you, listed in the order it affects traffic and enquiries. Nothing here is a nice-to-have that a developer can work around — each item is currently the reason something on the site is switched off or showing a placeholder.

---

## 1. Google Business Profile — the biggest single lever

For searches like "painters near me", "commercial painters Melbourne" or "house painters Chirnside Park", Google shows a **local pack** of three businesses on a map above every ordinary search result. That pack is drawn from Google Business Profile, not from the website. A perfect website ranking fourth organically sits below three competitors who simply have a better-maintained profile.

Nothing we do in the code affects this. It has to be done in the profile itself.

**What to do**

- [ ] Claim and verify the profile for **APMG Painting Services Pty Ltd** at Factory 15/30 Ramset Dr, Chirnside Park VIC 3116.
- [ ] Set the primary category to **Painter**. Add secondary categories for the work you actually want: Commercial Painter, House Painter, Building Restoration Service.
- [ ] Set the service area to metropolitan Melbourne rather than a radius around Chirnside Park, so eastern-suburbs proximity does not cap where you appear.
- [ ] Enter business hours, the phone number **1300 97 97 40**, and the website URL. These must match the website exactly, character for character — Google cross-checks them and inconsistency costs ranking.
- [ ] Upload photos (see section 3). Profiles with more photos get more calls and direction requests.
- [ ] Add each service as a listed service with a description.
- [ ] Turn on messaging only if someone will actually answer it. An unanswered message is worse than no messaging.

**Then keep it alive.** Post something monthly — a finished job, a before-and-after, a note about availability. A profile last updated eighteen months ago ranks below one updated last week.

---

## 2. Reviews

Review count and recency are among the strongest local-pack ranking factors, and they are the first thing a person reads before calling a trade.

The current website is showing a Google widget claiming **5.0 from 70 reviews**. We have not carried that number across, and we should be direct about why: the website cannot evidence it, cannot display the reviews behind it, and putting that rating into the page's structured data when it comes from a third-party widget is a well-known route to a Google manual penalty. The risk is not worth it.

**What to do**

- [ ] Keep collecting reviews on Google Business Profile. That is where they earn local-pack visibility, and that is independent of the website.
- [ ] Ask at handover, not later. The moment a client signs off a finished job is when they are most willing, and a request a fortnight later converts far worse.
- [ ] Send the direct review link by text rather than asking someone to search for you. The link is in your profile under "Ask for reviews".
- [ ] For any review you would like **on the website**, get the reviewer's OK to reproduce it, and note which job it relates to.
- [ ] Send those to us with the wording, the attribution they are comfortable with (full name, first name and initial, or organisation only) and the date.

We have built the site so this switches on the moment you supply them. Reviews go into one file; the review section on the homepage and the star-rating structured data both activate together, with the average and count calculated from the actual reviews rather than typed in.

---

## 3. Photography

The site currently has **seventeen photographs total**, six of them work-in-progress shots carried across from the old site — pole rolling in an occupied office, a boom lift against a warehouse wall, fascia work off a ladder, render being coated over drop sheets. Those six now carry the services block on the home page and the trade services page. For a trade whose entire product is visual, seventeen is still thin — and it means image search, which sends real traffic for "painted office Melbourne" style queries, is barely used.

Eight sector pages have no photograph at all.

**Shot list, in priority order**

| Priority | Page | What we need |
|---|---|---|
| 1 | Sector pages ×8 | One landscape hero each: a school corridor, a clinic waiting room, an aged care lounge, a strata lobby, a retail tenancy, a venue interior, a gym or clubroom, a factory exterior |
| 2 | Every case study | Before-and-after pairs from the same position. The site is built to display these as pairs and currently cannot, because we only have "after" shots |
| 3 | About page | The team on site, in APMG branding. One group shot and two or three working shots |
| 4 | Home and service pages | More work in progress: masking, spray work, scaffolding and EWP set-ups on commercial sites. The six carried over from the old site cover cutting in and ladder access; process photographs outperform finished-room shots because they show competence, so this is the shot type worth over-supplying |
| 5 | Any page | Detail shots: prepared substrate, a cut line, an edge. These are what a facilities manager looks at |

**Practical requirements**

- Landscape orientation, at least 2000px wide.
- Shot on site, not stock. Stock photography on a trade site is spotted immediately and it undermines the case studies sitting next to it.
- Get the client's permission before photographing an occupied site, especially in healthcare, aged care and education.
- No identifiable patients, residents or children.
- Phone photographs are fine if they are sharp and well lit. A real photograph of your own work beats a professional photograph of someone else's.

---

## 4. Certificates and accreditations

The site lists six credentials and displays **none of them**, because we have no evidence for any. Where the trust indicators should sit, the homepage currently shows a note saying the content is awaited. That is deliberate: an unverified credential is worse than a missing one, particularly for the sectors you want, where procurement checks.

The audit of the current site found this needed doing regardless. The live site renders the Master Painters body five different ways, claims registration with "Workplace Safety" — which is not an organisation that exists — and describes an "NDIS Accreditation" where the actual credential is an NDIS Worker Screening Check.

**Send us a copy of each**

- [ ] Master Painters Australia membership certificate — with the exact registered name
- [ ] Dulux Accredited Painter certificate — this is also what supports the 5-year workmanship warranty, which we cannot mention until it is evidenced
- [ ] Public liability insurance certificate of currency — with the insured amount
- [ ] Workers compensation certificate of currency
- [ ] Confirmation that personnel on education sites hold Working with Children Checks
- [ ] Confirmation that personnel on healthcare and aged care sites hold current police checks
- [ ] Confirmation of NDIS Worker Screening Checks where applicable

Each one you supply switches on a trust indicator and adds to the site's structured data. All six turn the placeholder into a credentials bar.

---

## 5. Google Search Console access

The current site publishes **68 suburb pages**. None carries a local project, a local photograph or a local testimonial, and three are defective — one is a duplicate, two are misspelled.

The rebuild keeps a small subset and deliberately leaves the rest out until there is evidence for them. That is the right call on quality. It is the wrong call to make on instinct, because a page ranking for a long-tail search is worth keeping even when the copy is weak: you can improve copy, and you cannot get lost rankings back quickly.

We have built a script that makes this decision from data instead. We need the data.

**What to send**

1. Add us as a user in Search Console for apmgpainting.com.au (Settings → Users and permissions → Add user → Full).
2. Or, if you would rather not: Performance → Pages → set the date range to the **last 16 months** → filter Page contains `/areas/` → Export → CSV, and send us the file.

From that we produce a per-URL recommendation — keep, consolidate, redirect or noindex — with the reason for each, for your review before anything changes.

---

## 6. Other business facts

- [ ] **ABN.** Not published anywhere on the current site. It is needed for the footer legal line and for the business's structured data, and it is a trust signal for commercial procurement.
- [ ] **Project durations.** Four of the five case studies say nothing about how long the job took. "Eleven offices in nine weeks" is a far stronger proof point than a description with no timeframe.
- [ ] **A written testimonial for the Emmaus College and NDIS projects.** The current site says the client was pleased but publishes no quotation or attribution, so we cannot use it. One attributable sentence from each would be worth more than the paragraph that is there now.
- [ ] **Confirm the service area.** The current commercial page says "throughout Australia" once. Every case study is Victorian and the office is in Chirnside Park, so the site says metropolitan Melbourne. If interstate work is real, we need evidence of it before claiming it.

---

## 7. Go-live configuration

For whoever deploys the site. Two environment variables, and the site is indexable.

```
NEXT_PUBLIC_SITE_URL="https://apmgpainting.com.au"
NEXT_PUBLIC_SANDBOX="false"
```

Until `NEXT_PUBLIC_SANDBOX` is `false`, every page is marked `noindex` and robots.txt blocks all crawling. This is intentional — a preview build must never be indexed alongside the live site — but it does mean **nothing can rank until it is flipped**.

Also needed at go-live:

- [ ] **Enquiry email delivery.** Currently unconfigured, and the forms say so honestly rather than pretending a message was sent. Set `ENQUIRY_TRANSPORT="resend"` with an API key, a from address and a to address.
- [ ] **Analytics.** The GTM container `GTM-N7D3JPMV` and the CallRail script from the current site are ready to carry across, left blank so review traffic is not counted.
- [ ] **Redirects.** The three corrected suburb slugs need 301s from their old URLs. These are recorded in the codebase and tested.
- [ ] **Submit the sitemap** at `https://apmgpainting.com.au/sitemap.xml` in Search Console once live.

---

## Summary — what unblocks what

| We receive | What switches on |
|---|---|
| Google Business Profile claimed and filled | Local pack eligibility. The largest single traffic gain available |
| Reviews with permission | Review section, star ratings in search results |
| Six certificates | Trust indicators sitewide, credentials in structured data, the Dulux warranty as a selling point |
| Sector and process photography | Eight sector pages get imagery; image search becomes a channel |
| Search Console export | An evidence-based decision on 68 suburb pages instead of a guess |
| ABN, durations, testimonials | Stronger proof on every case study; complete business schema |
| Two environment variables | The site becomes indexable at all |
