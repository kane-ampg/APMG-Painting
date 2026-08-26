import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CommercialEnquiryForm } from '@/components/forms/enquiry-forms';
import { GoogleMark } from '@/components/sections/review-parts';
import { ButtonLink, Container, microLabel, Section, SectionHeading } from '@/components/ui';
import { googleAggregate } from '@/content/reviews';
import { accreditationLogos, directionsUrl, formattedAddress, site } from '@/lib/site';
import { cn } from '@/lib/utils';

export const metadata: Metadata = buildMetadata({
  title: 'Contact APMG Painting | Melbourne Painters',
  description:
    'Contact APMG Painting. Tell us about the site and the scope, or call 1300 97 97 40 for a commercial site assessment.',
  path: '/contact-us/',
});

/**
 * Contact.
 *
 * The one page on the site where the visitor has already decided. Everything
 * here is arranged around that: the three ways to reach APMG sit above the
 * form rather than under it, because a facilities manager with a phone in
 * their hand should never have to scroll past a fourteen-field form to find a
 * number — and the form itself is given a column of reassurance beside it
 * instead of standing alone in a narrow measure, which is what it did before.
 *
 * The masthead is the only dark full-bleed opening outside the homepage fold,
 * and it is earned: the photograph is the signed depot with the whole fleet in
 * front of it, which answers "are these people real" faster than any sentence
 * on the page could.
 *
 * Nothing here states an hours or response-time commitment. `site.openingHours`
 * is still null and APMG has never published one — a "we reply within 2 hours"
 * line would be the single easiest claim to write on this page and the single
 * easiest one to break.
 */

/**
 * The three ways in, in the order they are actually used.
 *
 * Not a card grid. Three cells on one rule, the phone given the display size
 * because for a trade business it carries more traffic than the other two put
 * together, and the office given a directions link because an address without
 * one is a fact rather than an action.
 */
const CHANNELS = [
  {
    label: 'Call',
    value: site.phone.display,
    href: site.phone.href,
    note: 'One number for every site.',
    lead: true,
  },
  {
    label: 'Email',
    value: site.email,
    href: `mailto:${site.email}`,
    note: 'Drawings, scopes and tender packs.',
    lead: false,
  },
  {
    label: 'Office',
    value: formattedAddress,
    href: directionsUrl,
    note: 'Get directions',
    lead: false,
    external: true,
  },
] as const;

/**
 * What the enquiry actually sets off.
 *
 * Every line is the same commitment made elsewhere on the site — the homepage
 * process rail and the form's own site-assessment hint — restated at the point
 * where somebody is deciding whether to fill the thing in. Numbered because
 * the order is the content: the site visit happens before the number, and that
 * sequencing is the whole argument.
 */
const NEXT_STEPS = [
  {
    heading: 'We come back with questions',
    body: 'Access, hours and scope, mostly. Those are quicker to settle before anyone attends than to discover on site.',
  },
  {
    heading: 'We attend before we quote',
    body: 'Preparation is the largest variable in any painting job, and it cannot be judged from a photograph or a floor area.',
  },
  {
    heading: 'You get an itemised scope',
    body: 'Labour, materials and scheduling broken out — and broken down per location where the work spans several sites.',
  },
] as const;

export default function ContactPage() {
  return (
    <>
      {/*
       * Masthead.
       *
       * Full-bleed rather than contained, so the photograph runs to the edge of
       * the screen and the copy still lines up with every other page's left
       * margin. That alignment is what the `pl-[max(...)]` does: it reproduces
       * the inner edge of a `width="wide"` Container (max-w-7xl, sm:px-8)
       * without putting the image inside one.
       *
       * The red rule is at the base, not the top. Under a sticky white header
       * a 4px rule reads as the header's own underline; at the bottom it is the
       * cut line the page is divided on, with the three channels sitting
       * directly beneath it.
       */}
      <section className="border-b-4 border-brand-600 bg-ink text-white">
        <div className="lg:grid lg:grid-cols-[1.08fr_1fr] lg:items-stretch">
          <div className="flex flex-col justify-center px-5 py-12 sm:px-8 lg:py-24 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-16">
            <Breadcrumbs crumbs={[{ name: 'Contact', path: '/contact-us/' }]} tone="ink" />
            <h1 className="mt-2 text-balance font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Talk to us about the site
            </h1>
            <p className="mt-6 max-w-prose text-lg leading-relaxed text-white/75">
              Tell us the building, the areas involved and when we are allowed on site. Those three
              answers are what decide whether a site assessment can be scheduled — the rest follows
              from them.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="#quote" variant="accent">
                Send an enquiry
              </ButtonLink>
              <ButtonLink href={site.phone.href} variant="ghostLight">
                {site.phone.display}
              </ButtonLink>
            </div>
          </div>

          {/*
           * Sized by aspect ratio on small screens and stretched to the copy
           * column's height from `lg`, so the band never ends up shorter than
           * the text beside it and never crops the signage out of frame.
           */}
          <div className="relative aspect-[16/10] w-full sm:aspect-[2/1] lg:aspect-auto lg:min-h-[520px]">
            <Image
              src="/images/company/apmg-fleet-depot.webp"
              alt="APMG's depot, its signage carrying the 1300 number, with the signed work fleet parked across the forecourt"
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/*
       * The channels, on the cut line.
       *
       * Divided by rules rather than boxed into cards: three bordered tiles
       * would make the phone number look like one option of three, and it is
       * not — it is the one most of this page's traffic came here for.
       */}
      <section className="border-b border-paper-edge bg-white">
        <Container width="wide">
          {/* Three across only from `lg`. Between `sm` and `lg` a third of
                the container is narrower than the email address is long, and
                the cells collide; stacked rows at those widths cost nothing but
                height. */}
          <ul className="grid divide-y divide-paper-edge lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {CHANNELS.map((channel) => (
              <li key={channel.label} className="min-w-0 lg:first:-ml-6 lg:last:-mr-6">
                <a
                  href={channel.href}
                  {...('external' in channel && channel.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="group flex h-full flex-col gap-1.5 px-0 py-6 transition-colors hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 lg:px-6 lg:py-8"
                >
                  <span className={cn(microLabel, 'text-ink-muted')}>{channel.label}</span>
                  <span
                    className={cn(
                      'break-words font-display tracking-tight text-ink decoration-brand-600 decoration-2 underline-offset-4 group-hover:underline',
                      channel.lead ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl',
                    )}
                  >
                    {channel.value}
                  </span>
                  <span className="mt-auto pt-2 text-sm text-ink-soft">
                    {channel.note}
                    {'external' in channel && channel.external && (
                      <span aria-hidden="true" className="ml-1 text-brand-600">
                        →
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* The header's "Get a quote" lands here. `#commercial` stays as the deep
          link from the service pages. */}
      <div id="quote" className="scroll-mt-16 sm:scroll-mt-20">
        <Section tone="sunken" id="commercial">
          <Container width="wide">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <SectionHeading className="mb-3">Request a site assessment</SectionHeading>
                <p className="mb-8 max-w-prose text-ink-soft">
                  For schools, clinics, aged care, strata, retail, hospitality, offices and
                  industrial sites. The operating-hours question matters more than any other — tell
                  us when we are allowed on site.
                </p>
                <div className="border border-paper-edge bg-white p-5 sm:p-8 lg:p-10">
                  <CommercialEnquiryForm />
                </div>
              </div>

              {/*
               * The reassurance column. Sticky from `lg` so it stays beside the
               * field the visitor is actually on — the form is long enough that
               * a static aside would be off screen by the third question, which
               * is exactly where people stop filling one in.
               */}
              <aside className="lg:col-span-5">
                <div className="lg:sticky lg:top-24">
                  <h2 className={cn(microLabel, 'text-ink-muted')}>What happens next</h2>

                  <ol className="relative mt-6 space-y-8 pl-12">
                    {NEXT_STEPS.map((step, index) => (
                      <li key={step.heading} className="relative">
                        {/* The connector, drawn per step rather than once down
                            the whole column, so the thread stops at the last
                            numeral instead of trailing past it. A sequence line
                            that runs on after the final stop reads as an
                            unfinished list. Same mark as the homepage process
                            rail, held still: there is no scroll worth measuring
                            inside a sticky column. */}
                        {index < NEXT_STEPS.length - 1 && (
                          <span
                            aria-hidden="true"
                            className="absolute -bottom-8 -left-8 top-8 w-px bg-brand-600"
                          />
                        )}
                        <span
                          aria-hidden="true"
                          className="absolute -left-12 top-0 flex h-8 w-8 items-center justify-center bg-ink font-display text-sm text-white"
                        >
                          {index + 1}
                        </span>
                        <h3 className="font-display text-lg tracking-tight text-ink">
                          {step.heading}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-10 border-t border-paper-edge pt-8">
                    <a
                      href={googleAggregate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                    >
                      <GoogleMark className="h-6 w-6 shrink-0" />
                      <span className="text-sm text-ink-soft">
                        <span className="font-display text-lg tracking-tight text-ink group-hover:underline">
                          {googleAggregate.rating.toFixed(1)} on Google
                        </span>{' '}
                        from {googleAggregate.count} reviews
                      </span>
                    </a>

                    {/* Tiled on white at one common height. The four marks
                        are drawn at wildly different aspect ratios and three of
                        them assume a white ground, so left loose on the sunken
                        section they read as four stray stickers. Undimmed: a
                        credential at 70% opacity looks like one that expired. */}
                    <ul className="mt-6 grid grid-cols-4 gap-2">
                      {accreditationLogos.map((entry) => (
                        <li
                          key={entry.id}
                          className="flex h-14 items-center justify-center border border-paper-edge bg-white px-2"
                        >
                          <Image
                            src={entry.logo!.src}
                            alt={entry.logo!.alt}
                            width={entry.logo!.width}
                            height={entry.logo!.height}
                            className="max-h-8 w-auto object-contain"
                          />
                          <span className="sr-only">{entry.detail}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-8 text-sm text-ink-soft">
                      Prefer to talk it through?{' '}
                      <a
                        href={site.phone.href}
                        className="font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        Call {site.phone.display}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </Section>
      </div>

      {/*
       * Where we work from.
       *
       * Typographic rather than mapped. `site.coords` is still null, so there
       * is no honest point to drop a pin on, and the directions link resolves
       * the street address through Maps itself rather than through the Google
       * profile — which still points at the previous premises.
       */}
      <Section tone="paper" className="pb-0 sm:pb-0">
        <Container width="wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <SectionHeading className="mb-6">Where we work from</SectionHeading>
              <address className="not-italic">
                <p className="font-display text-2xl leading-snug tracking-tight text-ink sm:text-3xl">
                  {site.address.street}
                  <br />
                  {site.address.suburb} {site.address.state} {site.address.postcode}
                </p>
              </address>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={directionsUrl} variant="outline" target="_blank">
                  Get directions
                </ButtonLink>
                <ButtonLink href={site.phone.href} variant="primary">
                  {site.phone.display}
                </ButtonLink>
              </div>
            </div>

            <div className="lg:col-span-6 lg:pt-16">
              <p className="max-w-prose text-lg leading-relaxed text-ink-soft">
                Work is carried out across {site.serviceArea.primary}, within roughly{' '}
                {site.serviceArea.radiusKm} km of the {site.address.suburb} base — the eastern and
                south-eastern corridors most of all, and the rest of the metro area on programmes
                that justify the travel.
              </p>
              <p className="mt-5">
                <Link
                  href="/areas/"
                  className="font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  Areas we service
                </Link>
              </p>
            </div>
          </div>
        </Container>

        {/*
         * Closing band. Full width because the photograph is a panorama and
         * boxing it into the container would set fifteen people at thumbnail
         * height. It runs straight into the footer's red rule.
         */}
        <figure className="mt-14 sm:mt-20">
          <div className="relative aspect-[16/9] w-full sm:aspect-[21/9] lg:aspect-[12/5]">
            <Image
              src="/images/company/apmg-team-lineup.webp"
              alt="The APMG team standing in front of the company's unit, with the work fleet parked behind them"
              fill
              loading="lazy"
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="sr-only">
            The APMG team outside the company premises with the work fleet.
          </figcaption>
        </figure>
      </Section>
    </>
  );
}
