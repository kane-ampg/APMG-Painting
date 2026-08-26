import Image from 'next/image';
import { Container, microLabel, Placeholder } from '@/components/ui';
import { footerNav } from '@/components/navigation/nav-data';
import { FooterNavList } from '@/components/navigation/footer-nav-list';
import { accreditationLogos, accreditations, formattedAddress, site } from '@/lib/site';
import { googleAggregate } from '@/content/reviews';
import { sectors } from '@/content/sectors';
import { cn } from '@/lib/utils';

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

/**
 * The four figures, formerly a black band near the top of the homepage.
 *
 * Every value is derived from lib/site.ts or the content files, never typed as
 * a literal here — that is what stops a "500+ projects" style claim appearing
 * later. Each figure carries a label precise enough to be defensible on its
 * own. Now that it sits in the footer it runs on every page, so nothing in it
 * may be homepage-specific.
 */
function FooterFacts() {
  const yearsTrading = new Date().getFullYear() - site.founded;

  const facts = [
    {
      label: 'In business',
      figure: `${yearsTrading} years`,
      detail: `${site.legalName} was founded in ${site.founded} and has grown into a painting and property maintenance contractor.`,
    },
    {
      label: 'Client rating',
      figure: `${googleAggregate.rating.toFixed(1)} on Google`,
      detail: `Averaged across ${googleAggregate.count} reviews from schools, healthcare, strata, retail and industrial clients.`,
    },
    {
      label: 'Commercial sectors',
      figure: String(sectors.length),
      detail:
        'Each with its own access, compliance and scheduling constraints, set out sector by sector.',
    },
    {
      label: 'Workmanship warranty',
      figure: '5 years',
      detail:
        'Backed by the Dulux Accredited Painter programme, covering peeling, flaking and blistering.',
    },
  ];

  return (
    <dl className="grid gap-8 border-b border-white/15 py-12 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt className="text-xs font-semibold uppercase tracking-label text-white/60">
            {fact.label}
          </dt>
          <dd className="mt-2">
            <span className="font-display text-3xl font-semibold leading-none tracking-tight text-brand-400">
              {fact.figure}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-white/70">{fact.detail}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Optical sizing for a mixed-shape logo wall.
 *
 * The four marks do not agree on shape — MPA is near-square at 1.14:1, the
 * other three are wordmarks around 2:1 — and capping them all at one height
 * hands the square mark roughly twice the visual mass of its neighbours.
 * Height therefore falls as the mark gets wider, on the fourth root of the
 * aspect ratio: that lands between equal-height (which over-weights the square
 * mark) and equal-area (which over-weights it the other way, because a
 * wordmark is mostly the whitespace between letters).
 *
 * Derived from the mark's own intrinsic dimensions rather than tuned per file,
 * so a fifth accreditation drops in without anyone re-measuring the row.
 */
function markHeight(width: number, height: number) {
  const rem = 3.1 * Math.pow(2 / (width / height), 0.25);
  return `${Math.min(3.6, Math.max(2.6, rem)).toFixed(2)}rem`;
}

/**
 * One strip of painter's masking tape.
 *
 * Two of these hold each accreditation card to the black ground, at opposite
 * corners, angled the same way — the way one hand would actually tape a notice
 * up. Each strip runs off its corner onto the footer, which is the detail that
 * sells it: tape stopping at the card edge reads as a printed border, tape
 * running past it reads as tape.
 *
 * 22 degrees, and no steeper. A strip laid across the corner at 45 was the
 * first attempt and is the more obvious version of this, but at that angle its
 * bounding box runs about 1.6rem past the corner — wider than the gap between
 * cards at every breakpoint — so every strip landed on its neighbour. At 22
 * the sideways reach stays inside the gap while the strip still reads as tape
 * rather than as a label sitting level with the edge. Vertical clearance is
 * free, since the row has py-10 around it; horizontal clearance is not.
 *
 * Colour, grain and translucency live in `.tape-strip` in globals.css, and the
 * torn ends in the two `.tape-torn-*` variants beside it. Only geometry is set
 * here.
 *
 * Purely decorative, so `aria-hidden` and `pointer-events-none`: the credential
 * itself is carried by the logo's alt text and the visually-hidden detail line.
 */
function Tape({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'tape-strip pointer-events-none absolute z-10 h-[0.8rem] w-[2.7rem]',
        className,
      )}
    />
  );
}

/**
 * Accreditations, as a logo wall.
 *
 * Only entries flagged `verified` in lib/site.ts are presented as credentials,
 * and only the four that carry a mark get a logo — the screening checks are
 * held per person, so badging them would imply a company-level certification
 * that does not exist. They are stated in words on the about page instead.
 *
 * Each mark sits on its own white chip. The four supplied files do not agree
 * on a background — MPA is transparent, the Dulux badge has white baked in and
 * Haymes a solid blue box — so dropping them straight onto the ink ground
 * would show the boxes. The chip normalises that, and it has to be true white
 * rather than a tinted off-white, or the Dulux badge's baked-in white shows as
 * a seam inside its own chip.
 *
 * Five marks, which no column count divides evenly, so this is a centred
 * wrapping row rather than a grid: an orphan on the last line sits under the
 * middle of the line above and reads as deliberate, where a grid would push it
 * hard against one edge. The three max-widths then fix where it breaks instead
 * of leaving it to the viewport — 2 + 2 + 1 on phones, 3 + 2 on tablets, all
 * five across from 1024. Each is the exact width of that many chips plus their
 * gaps, so the row cannot break anywhere unintended.
 *
 * Chips are h-20 with a fixed width, so every mark gets the same frame however
 * wide it is. Both are kept tight on purpose: give them more room and the
 * white reads as the element and the logo as an afterthought floating in it.
 *
 * Square corners, per the borderRadius override in tailwind.config.ts: the
 * whole system is flat slabs and hard rules, and a softened chip here would be
 * the only rounded thing on the page.
 *
 * In colour, not greyscale: a faded accreditation badge reads as decoration,
 * and these are the strongest trust signal on the site.
 *
 * If nothing is verified the bar renders the gap rather than disappearing:
 * a silently empty trust bar looks identical to a business with no credentials.
 */
function FooterAccreditations() {
  if (accreditationLogos.length === 0) {
    return (
      <div className="border-b border-white/15 py-10">
        <Placeholder
          note={`accreditation logos and wording appear here once APMG supplies certificates for ${accreditations
            .map((a) => a.label)
            .join(', ')}. Nothing is displayed as verified until then.`}
        />
      </div>
    );
  }

  return (
    <div className="border-b border-white/15 py-10">
      <h2 className={cn(microLabel, 'mb-6 text-center text-white/60')}>
        Accredited, prequalified and insured
      </h2>
      <ul className="mx-auto flex max-w-[18.5rem] flex-wrap justify-center gap-3 sm:max-w-[31rem] sm:gap-4 lg:max-w-[52rem]">
        {accreditationLogos.map((item) => (
          <li
            key={item.id}
            className="relative flex h-20 w-[8.5rem] items-center justify-center bg-white px-3 sm:w-[9.5rem]"
          >
            <Tape className="tape-torn-a -left-1.5 -top-1.5 -rotate-[22deg]" />
            <Tape className="tape-torn-b -bottom-1.5 -right-1.5 -rotate-[22deg]" />
            <Image
              src={item.logo!.src}
              alt={item.logo!.alt}
              width={item.logo!.width}
              height={item.logo!.height}
              /* Height is set optically; width follows the mark. max-w-full is
                 the floor under it — on a 320px screen the widest wordmark
                 would otherwise run past its chip. */
              style={{ height: markHeight(item.logo!.width, item.logo!.height), width: 'auto' }}
              className="max-w-full object-contain"
            />
            <span className="sr-only">{item.detail}</span>
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
    <footer className="border-t-4 border-brand-600 bg-ink text-white">
      <Container width="wide">
        <FooterFacts />
        <FooterAccreditations />

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
          <FooterColumn heading="Service Areas" links={footerNav.areas} />
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
