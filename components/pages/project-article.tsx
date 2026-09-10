import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CmsImage } from '@/components/media/cms-image';
import { CtaBand, RelatedLinks, TestimonialBlock } from '@/components/sections';
import { Container, mediaZoom, Placeholder, Section, SectionHeading } from '@/components/ui';
import { JsonLd } from '@/components/seo/json-ld';
import { projectSchema } from '@/lib/schema';
import { isPlaceholder } from '@/lib/content/types';
import type { Project, Sector, Service, SiteSettings } from '@/lib/content/types';
import { getLocation } from '@/content/locations';

function DetailList({ heading, items }: { heading: string; items?: readonly string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h2 className="mb-3 font-display text-xl">{heading}</h2>
      <ul className="flex flex-col gap-2 text-ink-soft">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Props = {
  project: Project;
  /** May be missing for a draft whose sector slug does not yet resolve. */
  sector?: Sector;
  /**
   * Resolved from `project.relatedServiceSlugs` by the caller — the source
   * lookup is async, so this component stays a plain sync render.
   */
  relatedServices?: readonly Service[];
  /** Business details, for the closing call-to-action's phone number. */
  settings: SiteSettings;
};

/**
 * The project case-study body: everything the public page renders below its
 * `notFound()` guard. Shared with the admin preview so a draft shows exactly
 * what publishing would produce, rather than a stand-in.
 */
export function ProjectArticle({ project, sector, relatedServices = [], settings }: Props) {
  const cover = project.images[0];
  const gallery = project.images.slice(1);

  return (
    <>
      <JsonLd data={projectSchema(project)} />

      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs
            crumbs={[
              { name: 'Projects', path: '/projects/' },
              { name: project.title, path: `/projects/${project.slug}/` },
            ]}
          />
          <p className="mb-3 text-xs font-semibold uppercase tracking-label text-brand-600">
            {project.location}
          </p>
          <h1 className="max-w-4xl font-display text-4xl leading-tight sm:text-5xl">
            {project.title}
          </h1>
        </Container>
      </Section>

      {cover && (
        <div className="group relative aspect-[16/9] w-full overflow-hidden bg-paper-sunken sm:aspect-[21/9]">
          <CmsImage
            image={cover}
            fill
            priority
            sizes="100vw"
            className={`object-cover ${mediaZoom}`}
          />
        </div>
      )}

      <Section tone="paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_17rem]">
            <div className="flex flex-col gap-10">
              <div>
                <h2 className="mb-3 font-display text-xl">The challenge</h2>
                <p className="max-w-prose text-ink-soft">{project.challenge}</p>
              </div>

              {project.initialCondition && (
                <div>
                  <h2 className="mb-3 font-display text-xl">Initial condition</h2>
                  <p className="max-w-prose text-ink-soft">{project.initialCondition}</p>
                </div>
              )}

              <DetailList heading="Scope of work" items={project.scopeOfWork} />
              <DetailList heading="Preparation" items={project.preparation} />

              {project.coatingSystem && (
                <div>
                  <h2 className="mb-3 font-display text-xl">Coating system</h2>
                  <p className="max-w-prose text-ink-soft">{project.coatingSystem}</p>
                </div>
              )}

              <DetailList heading="Access and safety" items={project.accessAndSafety} />
              <DetailList heading="Site constraints" items={project.schedulingConstraints} />
              <DetailList heading="Outcome" items={project.outcome} />

              {project.testimonial &&
                (isPlaceholder(project.testimonial) ? (
                  <Placeholder note={project.testimonial.note} />
                ) : (
                  <TestimonialBlock
                    quote={project.testimonial.quote}
                    attribution={project.testimonial.attribution}
                    organisation={project.testimonial.organisation}
                  />
                ))}
            </div>

            <aside className="flex flex-col gap-6 lg:border-l lg:border-paper-edge lg:pl-8">
              <div>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-label text-ink-muted">
                  Project summary
                </h2>
                <dl className="flex flex-col gap-3 text-sm">
                  <div>
                    <dt className="text-ink-muted">Client or property</dt>
                    <dd className="font-medium">{project.clientOrPropertyType}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Location</dt>
                    <dd className="font-medium">{project.location}</dd>
                  </div>
                  {sector && (
                    <div>
                      <dt className="text-ink-muted">Sector</dt>
                      <dd className="font-medium">{sector.shortTitle}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-ink-muted">Duration</dt>
                    <dd className="font-medium">
                      {project.duration && isPlaceholder(project.duration) ? (
                        <span className="font-normal text-ink-muted">Not recorded</span>
                      ) : (
                        String(project.duration ?? 'Not recorded')
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              <RelatedLinks
                heading="Related services"
                links={relatedServices.map((service) => ({
                  label: service.shortTitle,
                  href: '/commercial/',
                }))}
              />

              <RelatedLinks
                heading="Nearby"
                links={project.relatedLocationSlugs
                  .map((locationSlug) => getLocation(locationSlug))
                  .filter((location) => location !== undefined)
                  .map((location) => ({
                    label: location.suburb,
                    href: `/areas/${location.slug}/`,
                  }))}
              />
            </aside>
          </div>
        </Container>
      </Section>

      {gallery.length > 0 && (
        <Section tone="sunken">
          <Container>
            <SectionHeading className="mb-6">Gallery</SectionHeading>
            <ul className="grid gap-4 sm:grid-cols-2">
              {gallery.map((image) => (
                <li
                  key={image.src}
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg"
                >
                  <CmsImage
                    image={image}
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    className={`object-cover ${mediaZoom}`}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CtaBand
        heading="Similar site, similar constraints?"
        body="Tell us what needs painting and when we are allowed on site."
        cta={{ label: 'Request a site assessment', href: '/contact-us/#commercial' }}
        phone={settings.phone}
      />
    </>
  );
}
