import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ContentBlock, CtaBand, FaqList, Hero, MediaBand } from '@/components/sections';
import { JsonLd } from '@/components/seo/json-ld';
import { faqSchema, serviceSchema } from '@/lib/schema';
import { Card, Container, Prose } from '@/components/ui';
import { getService } from '@/content/services';
import { tradeFaqs } from '@/content/faqs';

/**
 * Trade services. 287 words on the live site — the thinnest page of the lot.
 */
export const metadata: Metadata = buildMetadata({
  title: 'Trade & Property Maintenance Services Melbourne | APMG Painting',
  description:
    'Plastering, rendering, tiling, flooring and making good across Melbourne — the adjacent trades that sit around a painting scope, run under one programme.',
  path: '/trade-services/',
});

const service = getService('property-maintenance');

const TRADES = [
  {
    name: 'Plastering and patching',
    body: 'Repairs to damaged plasterboard, cornice and set joints, brought back to a paintable finish.',
  },
  {
    name: 'Rendering',
    body: 'Render repairs and new render, most often as preparation ahead of an exterior coating.',
  },
  { name: 'Tiling', body: 'Wall and floor tiling as part of a wider refurbishment scope.' },
  { name: 'Flooring', body: 'Floor coverings coordinated with the painting programme.' },
  {
    name: 'Making good',
    body: 'The small repairs that hold up a handover — filling, sealing, trims and fixings.',
  },
];

/**
 * Trade content: how a mixed scope is actually sequenced. General building
 * knowledge, not a claim about APMG's record.
 */
const SEQUENCE = [
  'The order is not negotiable, and most delays come from getting it wrong. Structural and services work first, because everything after it gets damaged if it runs late. Then wet trades — rendering, plastering, patching — which need drying time that cannot be compressed. Then sealing and coating. Then floor coverings, because a finished floor laid before the painting is a floor that gets protected, walked on and eventually argued about.',
  'Drying time is the constraint people underestimate. Fresh render and new plaster hold moisture, and coating over either before it has dried through traps that moisture behind the film. What follows is blistering, patchy sheen or adhesion failure a few months later — a defect that looks like bad paint and is actually a scheduling decision. In a Melbourne winter those drying windows are meaningfully longer than in summer, and the programme has to say so.',
  'Making good is a bigger line than most scopes allow for. On a tenancy that has been through several fit-outs, the walls carry old fixings, partition scars, cable penetrations, removed signage and layers of previous patching that never matched. Cutting that back and bringing it to a consistent substrate is frequently more work than the coating over it, and it is the item most often under-scoped in a competing quote.',
  'What cannot be seen cannot be priced firm. Water damage, unstable render, rusted fixings and previous poor repairs are usually hidden under a coating and only surface once preparation starts. The honest way to handle that is a labelled provisional sum against the areas that cannot be assessed until they are opened, with anything found reported and priced before it is carried out.',
];

export default function TradeServicesPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Trade and property maintenance services',
          description:
            'Plastering, patching, rendering, tiling, flooring and making good, coordinated alongside a painting programme across Melbourne.',
          path: '/trade-services/',
        })}
      />
      <JsonLd data={faqSchema(tradeFaqs)} />

      <Hero
        eyebrow="Property maintenance"
        heading="Trade and maintenance services"
        lede="Painting scopes rarely arrive on their own. Running the adjacent trades under one programme removes the gap between contractors that usually stalls a job."
        primaryCta={{ label: 'Discuss a scope', href: '/contact-us/#commercial' }}
        secondaryCta={{ label: 'Commercial painting', href: '/commercial/' }}
        image={{
          src: '/images/work/fascia-gutter-ladder.webp',
          alt: 'An APMG tradesperson on a ladder working along the fascia and gutter line of a weatherboard house',
        }}
      />

      <Container width="wide">
        <Breadcrumbs crumbs={[{ name: 'Trade services', path: '/trade-services/' }]} />
      </Container>

      <ContentBlock heading="Why these sit alongside painting">
        <Prose className="mb-8">
          {service?.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            On commercial sites this matters more than it sounds. A repaint held up waiting on a
            plasterer is a zone the client cannot use, and on a staged programme one delay moves
            everything behind it.
          </p>
        </Prose>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRADES.map((trade) => (
            <Card as="li" key={trade.name} className="gap-2">
              <h3 className="font-display text-lg tracking-tight">{trade.name}</h3>
              <p className="text-sm text-ink-soft">{trade.body}</p>
            </Card>
          ))}
        </ul>
      </ContentBlock>

      <MediaBand
        tone="sunken"
        src="/images/work/office-partition-cutting-in.webp"
        alt="A wide view of an office floor mid-repaint, a painter cutting in a partition head while the desks around him stay in place"
        caption="An office floor part-way through a repaint. On a tenancy that has been through several fit-outs, cutting back the old fixings, partition scars and mismatched patching is frequently more work than the coating that follows it."
      />

      <ContentBlock tone="sunken" heading="How a mixed scope is sequenced">
        <Prose>
          {SEQUENCE.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </Prose>
      </ContentBlock>

      <ContentBlock heading="Trade and maintenance questions">
        <FaqList items={tradeFaqs} />
      </ContentBlock>

      <CtaBand
        heading="Scope covering more than paint?"
        body="Tell us what is involved and we will tell you what we can run under one programme."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
