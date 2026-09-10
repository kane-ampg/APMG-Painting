import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  ContentBlock,
  CtaBand,
  FaqList,
  Hero,
  MediaFigure,
  ProseWithFigure,
  ScheduleList,
} from '@/components/sections';
import { JsonLd } from '@/components/seo/json-ld';
import { faqSchema, serviceSchema } from '@/lib/schema';
import { Prose } from '@/components/ui';
import { getService, getSiteSettings } from '@/lib/content/source';
import { tradeFaqs } from '@/content/faqs';

/**
 * Painting for builders and head contractors. 287 words on the live site —
 * the thinnest page of the lot.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Painting for Builders & Head Contractors Melbourne | APMG Painting',
  description:
    'Painting delivered into a construction programme across Melbourne — staged to the build, sequenced around other trades, and carried through to handover.',
  path: '/trade-services/',
});

const TRADES = [
  {
    name: 'New-build painting',
    body: 'Painting packages for new construction, staged to follow the build rather than run as a single visit.',
  },
  {
    name: 'Defect rectification and touch-up',
    body: 'Touch-up and defect painting ahead of handover, matched to the original coating system.',
  },
  {
    name: 'Practical completion and defects liability',
    body: 'Painting carried through practical completion and into the defects-liability period as items are raised.',
  },
  {
    name: 'Sequencing around other trades',
    body: 'Painting programmed around the trades ahead of it and the trades that follow, rather than assumed to fit in the gaps.',
  },
  {
    name: 'Substrate preparation',
    body: 'New plasterboard, fresh render and previously worked surfaces filled, sanded, sealed and primed ahead of coating.',
  },
];

/**
 * Trade content: how painting sits inside a construction sequence. General
 * building knowledge, not a claim about APMG's record.
 */
const SEQUENCE = [
  'The order is not negotiable, and most delays come from getting it wrong. Structural and services work first, because everything after it gets damaged if it runs late. Wet trades ahead of painting — render, plaster and set — need drying time that cannot be compressed. Painting follows once the substrate is dry and prepared, and other trades that could mark a finished surface are scheduled to follow it rather than precede it.',
  'Drying time is the constraint people underestimate. Fresh render and new plasterboard set hold moisture, and coating over either before it has dried through traps that moisture behind the film. What follows is blistering, patchy sheen or adhesion failure a few months later — a defect that looks like bad paint and is actually a scheduling decision. In a Melbourne winter those drying windows are meaningfully longer than in summer, and the programme has to say so.',
  'Substrate preparation is a bigger line than most scopes allow for. New plasterboard needs its joints set and sanded flush before it will take a finish evenly, and surfaces already handled by other trades carry fixings, marks and patching that need bringing to a consistent, paintable surface. Getting that stage right is frequently more work than the coating that follows it, and it is the item most often under-scoped in a competing quote.',
  'What cannot be seen cannot be priced firm. Water damage, unstable render and previous poor repairs are usually hidden under a coating and only surface once preparation starts. The honest way to handle that is a labelled provisional sum against the areas that cannot be assessed until they are opened, with anything found reported and priced before it is carried out.',
];

/** Rendered inside a column beside the prose, so the frame is half the page. */
const SIDE_FIGURE_SIZES = '(min-width: 1152px) 544px, (min-width: 1024px) 50vw, 100vw';

export default async function TradeServicesPage() {
  const [service, settings] = await Promise.all([
    getService('builders-and-head-contractors'),
    getSiteSettings(),
  ]);

  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Painting for builders and head contractors',
          description:
            'Painting delivered into a construction programme — staged to the build, sequenced around other trades, and carried through to handover, across Melbourne.',
          path: '/trade-services/',
          settings,
        })}
      />
      <JsonLd data={faqSchema(tradeFaqs)} />

      <Hero
        eyebrow="Builders & head contractors"
        heading="Painting for builders and head contractors"
        lede="Painting delivered into a construction programme rather than a single site visit — staged to the build, sequenced around other trades, and carried through to handover."
        primaryCta={{ label: 'Discuss a scope', href: '/contact-us/#commercial' }}
        secondaryCta={{ label: 'Commercial painting', href: '/commercial/' }}
        image={{
          src: '/images/work/office-partition-cutting-in.webp',
          alt: 'An APMG painter cutting in above a glazed partition in an open-plan office, working around the fit-out already in place',
        }}
        crumbs={[{ name: 'Builders & head contractors', path: '/trade-services/' }]}
      />

      <ContentBlock heading="Painting on a construction programme">
        <ProseWithFigure
          figure={
            <MediaFigure
              src="/images/work/new-build-trim-priming.webp"
              alt="An APMG painter rolling primer onto a length of trim laid across trestles on a site still under construction, the rest of the run stacked alongside"
              caption="Trim primed off the wall, on a new build still in progress."
              detail="Priming the run on trestles while the carpenters are still fixing means the finish coats can follow them straight in, instead of the painter waiting on a finished room."
              aspect="side"
              sizes={SIDE_FIGURE_SIZES}
            />
          }
        >
          <Prose>
            {service?.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p>
              On commercial sites this matters more than it sounds. A finish held up waiting on
              the trade ahead of it is a zone the head contractor cannot hand over, and on a
              staged programme one delay moves everything behind it.
            </p>
          </Prose>
        </ProseWithFigure>

        <h3 className="mb-4 mt-14 font-display text-xl">What the package can include</h3>
        <ScheduleList items={TRADES} />
      </ContentBlock>

      <ContentBlock tone="sunken" heading="How painting sits in the sequence">
        <ProseWithFigure
          figure={
            <MediaFigure
              src="/images/work/fitout-reveal-making-good.webp"
              alt="An APMG tradesperson marking out a newly framed timber window reveal against existing brickwork on a fit-out, before the surface is filled and primed"
              caption="Making good where new work meets an existing wall."
              detail="A fit-out still in progress. Preparation gets measured and priced at this stage, before a brush is opened — and it is the stage a construction programme most often leaves too little room for."
              aspect="side"
              focus="top"
              sizes={SIDE_FIGURE_SIZES}
            />
          }
        >
          <Prose>
            {SEQUENCE.map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </Prose>
        </ProseWithFigure>
      </ContentBlock>

      <ContentBlock heading="Builder and head contractor questions">
        <FaqList items={tradeFaqs} />
      </ContentBlock>

      <CtaBand
        heading="Painting on your build?"
        body="Tell us where painting sits in the programme and we will tell you how we fit around it."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
        phone={settings.phone}
      />
    </>
  );
}
