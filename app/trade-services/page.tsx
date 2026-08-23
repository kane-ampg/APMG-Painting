import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ContentBlock, CtaBand, Hero } from '@/components/sections';
import { Card, Container, Prose } from '@/components/ui';
import { getService } from '@/content/services';

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

export default function TradeServicesPage() {
  return (
    <>
      <Hero
        eyebrow="Property maintenance"
        heading="Trade and maintenance services"
        lede="Painting scopes rarely arrive on their own. Running the adjacent trades under one programme removes the gap between contractors that usually stalls a job."
        primaryCta={{ label: 'Discuss a scope', href: '/contact-us/#commercial' }}
        secondaryCta={{ label: 'Commercial painting', href: '/commercial/' }}
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

      <CtaBand
        heading="Scope covering more than paint?"
        body="Tell us what is involved and we will tell you what we can run under one programme."
        cta={{ label: 'Get in touch', href: '/contact-us/' }}
      />
    </>
  );
}
