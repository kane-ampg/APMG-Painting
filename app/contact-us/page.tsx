import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CommercialEnquiryForm } from '@/components/forms/enquiry-forms';
import { Container, Section, SectionHeading } from '@/components/ui';
import { getPage, getSiteSettings } from '@/lib/content/source';
import { addressNote, formatAddress, phoneHref } from '@/lib/site';

/**
 * Contact page.
 *
 * The copy is a CMS singleton (`pages/contact-us`) and the contact facts are
 * the `settings/site` singleton; the form itself stays in code because it is
 * validation and a Server Action, not copy.
 */
export async function generateMetadata(): Promise<Metadata> {
  const copy = await getPage('contact-us');
  return buildMetadata({
    title: copy.metaTitle,
    description: copy.metaDescription,
    path: '/contact-us/',
  });
}

export default async function ContactPage() {
  const [copy, settings] = await Promise.all([getPage('contact-us'), getSiteSettings()]);
  // Drops itself once settings.address.effectiveFrom passes, so the move
  // notice cannot outlive the move.
  const note = addressNote(settings);

  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={[{ name: 'Contact', path: '/contact-us/' }]} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">{copy.lede}</p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                Phone
              </dt>
              <dd className="mt-1">
                <a
                  href={phoneHref(settings.phone)}
                  className="font-display text-xl font-semibold text-brand-700 hover:underline"
                >
                  {settings.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                Email
              </dt>
              <dd className="mt-1">
                <a href={`mailto:${settings.email}`} className="text-ink hover:underline">
                  {settings.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                Address
              </dt>
              <dd className="mt-1 text-ink">
                {formatAddress(settings.address)}
                {note && <span className="mt-1 block text-sm text-ink-soft">{note}</span>}
              </dd>
            </div>
            {/* Only once an editor enters hours: invented hours produce a rich
                result that tells people to call when nobody is there. */}
            {settings.openingHours && settings.openingHours.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-label text-ink-muted">
                  Hours
                </dt>
                <dd className="mt-1 text-ink">
                  {settings.openingHours.map((h) => (
                    <span key={h.days.join()} className="block">
                      {h.days.length > 2
                        ? `${h.days[0]}–${h.days[h.days.length - 1]}`
                        : h.days.join(', ')}{' '}
                      {h.opens}–{h.closes}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Container>
      </Section>

      {/* The header's "Get a quote" lands here. `#commercial` stays as the deep
          link from the service pages. */}
      <div id="quote" className="scroll-mt-16 sm:scroll-mt-20">
        <Section tone="paper" id="commercial">
          <Container width="narrow">
            <p className="mb-2 text-xs font-semibold uppercase tracking-label text-brand-600">
              For organisations
            </p>
            <SectionHeading className="mb-3">{copy.formHeading}</SectionHeading>
            <p className="mb-8 text-ink-soft">{copy.formIntro}</p>
            <CommercialEnquiryForm />
          </Container>
        </Section>
      </div>
    </>
  );
}
