import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ContentBlock, CtaBand, FaqList, FeatureGrid, Hero, TrustBar } from '@/components/sections';
import { Container, Prose, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { serviceSchema } from '@/lib/schema';
import { getService } from '@/content/services';
import { faqsFor } from '@/content/faqs';
import { faqSchema } from '@/lib/schema';
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

/**
 * Trade content, not a company claim.
 *
 * These sections exist because the page was 416 words and could not compete for
 * any residential query on depth. Everything below is general painting and
 * building knowledge — what governs adhesion, what Melbourne conditions do to a
 * coating, what actually moves a price. None of it asserts anything about
 * APMG's record that content/projects.ts does not already evidence.
 */
const LASTING = [
  'Almost every early paint failure is an adhesion failure, and almost every adhesion failure was decided before the first coat went on. A coating can only hold to what is under it: a chalked, dusty, glossy or damp surface gives it nothing to grip. That is why preparation is the part of a quote worth reading closely, and the part that is easiest to cut without it showing for about eighteen months.',
  'Preparation is a sequence, not a step. Washing removes dirt, salt and the chalk that comes off an old exterior as a fine powder. Sanding flattens defects and keys a glossy surface. Filling deals with cracks and holes. Sealing binds anything porous or previously bare so the topcoat sits evenly instead of soaking in and going patchy. Skipping any one of them shows up somewhere.',
  'What goes wrong is usually diagnosable from the surface. Paint peeling in sheets from a weatherboard usually means moisture behind the coating rather than a bad product. Fine cracking that follows a pattern is normally movement in the substrate. Powder on your hand off a rendered wall is chalking, which is the binder breaking down under UV, and it must be washed off before anything is applied. Bubbling on a ceiling is water, and painting it without finding the source just buys another six months.',
  'Number of coats is a weaker signal than most people expect. Two coats over correct preparation will outlast three over a poorly prepared surface, every time. Where extra coats genuinely matter is with deep or saturated colours, which need more film to reach an even finish, and over patchy or previously bare substrates that have been sealed.',
];

const MELBOURNE = [
  {
    heading: 'A wide temperature swing',
    body: 'Melbourne moves a long way in a day and further across a year, and buildings move with it. That movement is what opens joints, cracks filler and splits sealant, so exterior systems are specified with enough flexibility to take it rather than for hardness alone.',
  },
  {
    heading: 'UV on north and west elevations',
    body: 'The north and west faces of a house take substantially more UV than the south, and they age faster and more visibly. It is normal for one elevation to need recoating while the others are sound, and it is usually cheaper to treat them on different cycles than to repaint the whole house to the worst face.',
  },
  {
    heading: 'Salt air near the bay',
    body: 'Bayside and near-coastal properties sit in a more aggressive exposure. Salt shortens coating life on exposed elevations and attacks metal fixings, gutters and fascias sooner than the same house would inland.',
  },
  {
    heading: 'Weatherboard and moisture',
    body: 'Melbourne has a lot of weatherboard, and weatherboard fails from behind. Paint lifting along the bottom edge of boards is normally moisture getting in at the ends or from below, and coating over it treats the symptom.',
  },
  {
    heading: 'Render, brick and timber in one scope',
    body: 'Most established Melbourne exteriors combine substrates, and each takes its own preparation and system. A single product across the whole house is the shortcut that shortens the recoat cycle.',
  },
  {
    heading: 'Painting weather, not painting season',
    body: 'The working season is long, but the surface has to be dry and within a workable temperature when the coating goes on. That rules out straight after rain, late winter afternoons, and a wall in full midsummer sun rather than whole months of the year.',
  },
];

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
      <JsonLd data={faqSchema(faqsFor('residential'))} />

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
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-label text-ink-muted">
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
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-label text-ink-muted">
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

      <ContentBlock tone="sunken" heading="What decides how long a paint job lasts">
        <Prose>
          {LASTING.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </Prose>
      </ContentBlock>

      <ContentBlock heading="Painting a house in Melbourne">
        <Prose className="mb-8">
          <p>
            The conditions here are specific enough to change a specification. These are the ones
            that most often decide how an exterior is scoped.
          </p>
        </Prose>
        <FeatureGrid items={MELBOURNE} />
      </ContentBlock>

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
