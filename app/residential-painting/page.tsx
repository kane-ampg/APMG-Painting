import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ContentBlock, CtaBand, FaqList, Hero, TrustBar } from '@/components/sections';
import { Container, Prose, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { serviceSchema } from '@/lib/schema';
import { getService } from '@/content/services';
import { faqsFor } from '@/content/faqs';
import { site } from '@/lib/site';

/**
 * Residential hub.
 *
 * The live page claims "over 30 years of experience" in its title, meta and
 * body, which reads as company age and contradicts "Founded in 2015" on the
 * homepage. /about-us/ already frames it correctly — established 2015, team
 * brings 30 years of industry experience — and that framing is used here.
 */
export const metadata: Metadata = buildMetadata({
  title: 'House Painters Melbourne | Interior & Exterior | APMG Painting',
  description:
    'House painters across Melbourne. Interior and exterior work staged room by room so you keep living in the house, with the preparation that decides how long a finish lasts.',
  path: '/residential-painting/',
});

const interior = getService('interior-painting');
const exterior = getService('exterior-painting');

export default function ResidentialPage() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Residential house painting',
          description: 'Interior and exterior house painting across metropolitan Melbourne.',
          path: '/residential-painting/',
        })}
      />

      <Hero
        eyebrow="House painting"
        heading="House painters across Melbourne"
        lede="Interior and exterior work on Melbourne homes. We stage the job so you keep using the house, and we spend the time on preparation, because that is what decides how the finish looks in five years."
        primaryCta={{ label: 'Request a free quote', href: '/contact-us/#residential' }}
        secondaryCta={{ label: 'Call ' + site.phone.display, href: site.phone.href }}
        image={{
          src: '/images/hero/residential-hero.webp',
          alt: 'Painter cutting in along a ceiling line inside a Melbourne home',
        }}
      />

      <Container width="wide">
        <Breadcrumbs crumbs={[{ name: 'House painting', path: '/residential-painting/' }]} />
      </Container>

      <TrustBar />

      <ContentBlock heading="Who we work for">
        <Prose>
          <p>
            Our residential customers are homeowners and property managers looking for a painter who
            is affordable without cutting the parts of the job that matter. We are also the regular
            choice for a number of strata-managed buildings and residential property managers,
            largely because the programme runs when we say it will.
          </p>
          <p>
            APMG Painting was founded in {site.founded}, and the team brings around 30 years of
            combined industry experience.
          </p>
        </Prose>
      </ContentBlock>

      {interior && (
        <Section tone="sunken" id="interior">
          <Container>
            <SectionHeading className="mb-4">{interior.title}</SectionHeading>
            <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
              <Prose>
                {interior.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </Prose>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Includes
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-ink-soft">
                  {interior.includes.map((item) => (
                    <li key={item} className="border-b border-paper-edge pb-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {exterior && (
        <Section tone="paper" id="exterior">
          <Container>
            <SectionHeading className="mb-4">{exterior.title}</SectionHeading>
            <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
              <Prose>
                {exterior.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <p>
                  We use <strong>Dulux</strong> premium paints and coatings for exterior work,
                  specified for UV exposure, moisture and the temperature movement a Melbourne year
                  puts through a building.
                </p>
              </Prose>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Includes
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-ink-soft">
                  {exterior.includes.map((item) => (
                    <li key={item} className="border-b border-paper-edge pb-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </Section>
      )}

      <ContentBlock tone="sunken" heading="Common questions">
        <FaqList items={faqsFor('residential')} />
      </ContentBlock>

      <CtaBand
        heading="Get a quote for your place"
        body="Tell us the suburb, whether it is inside, outside or both, and roughly when you want it done."
        cta={{ label: 'Request a free quote', href: '/contact-us/#residential' }}
      />
    </>
  );
}
