import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo/metadata';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { CommercialEnquiryForm, ResidentialEnquiryForm } from '@/components/forms/enquiry-forms';
import { Container, Section, SectionHeading } from '@/components/ui';
import { formattedAddress, site } from '@/lib/site';

export const metadata: Metadata = buildMetadata({
  title: 'Contact APMG Painting | Melbourne Painters',
  description:
    'Contact APMG Painting in Melbourne. Separate enquiry forms for commercial site assessments and residential quotes, or call 1300 97 97 40.',
  path: '/contact-us/',
});

export default function ContactPage() {
  return (
    <>
      <Section tone="sunken" className="py-10">
        <Container width="wide">
          <Breadcrumbs crumbs={[{ name: 'Contact', path: '/contact-us/' }]} />
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Contact us</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">
            Two different jobs, two different sets of questions. Pick whichever fits — or just call.
          </p>

          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Phone
              </dt>
              <dd className="mt-1">
                <a
                  href={site.phone.href}
                  className="font-display text-xl font-semibold text-brand-700 hover:underline"
                >
                  {site.phone.display}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Email
              </dt>
              <dd className="mt-1">
                <a href={`mailto:${site.email}`} className="text-ink hover:underline">
                  {site.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Address
              </dt>
              <dd className="mt-1 text-ink">{formattedAddress}</dd>
            </div>
          </dl>
        </Container>
      </Section>

      <Section tone="paper" id="commercial">
        <Container width="narrow">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            For organisations
          </p>
          <SectionHeading className="mb-3">Request a site assessment</SectionHeading>
          <p className="mb-8 text-ink-soft">
            For schools, clinics, aged care, strata, retail, hospitality, offices and industrial
            sites. The operating-hours question matters more than any other — tell us when we are
            allowed on site.
          </p>
          <CommercialEnquiryForm />
        </Container>
      </Section>

      <Section tone="sunken" id="residential">
        <Container width="narrow">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">
            For homeowners
          </p>
          <SectionHeading className="mb-3">Request a free quote</SectionHeading>
          <p className="mb-8 text-ink-soft">
            For houses, apartments and townhouses across Melbourne, inside or out.
          </p>
          <ResidentialEnquiryForm />
        </Container>
      </Section>
    </>
  );
}
