import Image from 'next/image';
import { Container } from '@/components/ui';
import { footerNav } from '@/components/navigation/nav-data';
import { FooterNavList } from '@/components/navigation/footer-nav-list';
import { formattedAddress, site } from '@/lib/site';

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-label text-white/60">
        {heading}
      </h2>
      <FooterNavList links={links} />
    </div>
  );
}

export function Footer() {
  // Generated, not hard-coded. The live site's footer still reads "© 2025".
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-brand-600 bg-ink text-white">
      <Container width="wide">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            {/* The white original, on the ink ground it was drawn for. */}
            <Image
              src="/images/brand/apmg-logo-white.webp"
              alt="APMG Painting"
              width={378}
              height={285}
              className="mb-5 h-16 w-auto"
            />
            <address className="text-sm not-italic leading-relaxed text-white/85">
              {formattedAddress}
              <br />
              <a
                href={site.phone.href}
                className="mt-3 inline-block rounded font-semibold text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {site.phone.display}
              </a>
              <br />
              <a
                href={`mailto:${site.email}`}
                className="rounded text-white/85 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {site.email}
              </a>
            </address>
          </div>

          <FooterColumn heading="Commercial" links={footerNav.commercial} />
          <FooterColumn heading="Residential" links={footerNav.residential} />
          <FooterColumn heading="Company" links={footerNav.company} />
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName}
            {site.abn ? ` · ABN ${site.abn}` : ''}
          </p>
          <p>Servicing {site.serviceArea.primary}</p>
        </div>
      </Container>
    </footer>
  );
}
