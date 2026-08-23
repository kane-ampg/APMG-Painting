import Link from 'next/link';
import { Container } from '@/components/ui';
import { footerNav } from '@/components/navigation/nav-data';
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
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
        {heading}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded text-sm text-white/85 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  // Generated, not hard-coded. The live site's footer still reads "© 2025".
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white">
      <Container width="wide">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex flex-col">
              <span className="font-display text-xl font-bold leading-none tracking-tight">
                APMG
              </span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                Painting
              </span>
            </div>
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
