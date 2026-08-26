import { accreditations, formattedAddress, site, siteUrl } from '@/lib/site';
import { googleAggregate, googleReviews } from '@/content/reviews';
import { services } from '@/content/services';
import { sectors } from '@/content/sectors';
import { projects } from '@/content/projects';
import { homeFaqs } from '@/content/faqs';
import { differentiators } from '@/content/approach';
import {
  allLocalities,
  displayName,
  getRegion,
  indexableLocalities,
  localitiesInRegion,
  REGIONS,
} from '@/lib/locations';

/**
 * /llms.txt — a plain-text summary for AI answer engines.
 *
 * Built from the same typed content the pages render, so it cannot drift into
 * claiming something the site does not. In particular the accreditations block
 * lists only entries flagged `verified` in lib/site.ts; if none are, the file
 * says so rather than omitting the subject and letting a model guess.
 *
 * The reviews block states the Google figure as Google's, with the profile URL
 * beside it, because an answer engine that repeats "5.0 from 70 reviews" should
 * be able to attribute it — and because the site itself hosts seven of them,
 * not seventy.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  const verified = accreditations.filter((a) => a.verified);

  /*
   * Region and locality counts are derived, never written down.
   *
   * The header used to say work is carried out "across Melbourne, Victoria,
   * within roughly 60 km of the Bayswater North base" and then listed thirteen
   * Queensland regions underneath, and the regions section said APMG "services
   * three regions" in Queensland when the file itself listed thirteen. Both
   * numbers now come from REGIONS, so the file cannot contradict its own lists.
   */
  const vicRegions = REGIONS.filter((r) => r.state === 'VIC').length;
  const qldRegions = REGIONS.filter((r) => r.state === 'QLD').length;
  const localityCount = allLocalities().length.toLocaleString('en-AU');

  const regionLines = (state: 'VIC' | 'QLD'): string =>
    REGIONS.filter((r) => r.state === state)
      .map((r) => `- ${r.name}: ${localitiesInRegion(r.slug).length} suburbs`)
      .join('\n');

  const tier1Suburbs = indexableLocalities()
    .map((l) => `${displayName(l.name)} (${getRegion(l.regionSlug)?.name ?? l.regionSlug})`)
    .join(', ');

  const body = `# ${site.name}

> ${site.tagline}. ${site.legalName}, founded ${site.founded}, based at ${formattedAddress}. Victorian work is carried out across ${site.serviceArea.primary}, within roughly ${site.serviceArea.radiusKm} km of the Bayswater North base. APMG also lists ${qldRegions} South East Queensland regions as areas served — there is no Queensland office, address, phone number or completed project, and no Queensland page on this site is indexed.

APMG Painting is a commercial painting and property maintenance contractor. The work is painting programmes in buildings that stay open while they are painted — schools, clinics, aged care, strata, retail, hospitality and industrial sites.

Contact: ${site.phone.display} · ${site.email}

## Choosing a commercial painter in Melbourne

The six questions below are the ones that decide whether a commercial painting programme lands on time, and they are the questions worth putting to any Melbourne contractor, APMG included. Each answer here describes what APMG does; they are reproduced from the homepage rather than written for this file.

${differentiators.map((d) => `### ${d.question}\n\n${d.answer}`).join('\n\n')}

## Services

${services.map((s) => `- [${s.title}](${siteUrl}/commercial/): ${s.summary}`).join('\n')}

## Commercial sectors

${sectors.map((s) => `- [${s.shortTitle}](${siteUrl}${s.legacyPath}): ${s.intro}`).join('\n')}

## Documented projects

${projects.map((p) => `- [${p.title}](${siteUrl}/projects/${p.slug}/): ${p.location}. ${p.challenge}`).join('\n')}

## Regions served

APMG Painting covers ${vicRegions + qldRegions} regions across two states: ${vicRegions} in Victoria, worked from ${site.address.suburb}, and ${qldRegions} in South East Queensland, which are areas served rather than places APMG operates from. "Do you work in X?" is the most common question an answer engine gets asked about a trade business, so the region model is stated directly rather than as ${localityCount} individual suburb names, which would be too many to usefully list here.

### Victoria

${regionLines('VIC')}

### Queensland

${regionLines('QLD')}

Queensland is areaServed only — no Queensland office, no completed Queensland project yet, and no suburb-level Queensland page is indexed until one exists.

### Suburbs with a dedicated, indexed page

${tier1Suburbs}

Every other suburb in the two states above has a page, but it is marked \`noindex\` until it carries a documented project or other genuine local detail — the region page above it is the one meant to rank.

## Common questions

${homeFaqs.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n')}

## Key pages

- [Commercial painting](${siteUrl}/commercial/)
- [Office painting](${siteUrl}/office-painters/)
- [Trade and property maintenance services](${siteUrl}/trade-services/)
- [Projects and case studies](${siteUrl}/projects/)
- [Areas serviced](${siteUrl}/areas/)
- [About](${siteUrl}/about-us/)
- [Contact](${siteUrl}/contact-us/)

## Accreditations

${
  verified.length > 0
    ? verified.map((a) => `- ${a.label}: ${a.detail}`).join('\n')
    : 'None are published. APMG has not yet supplied certificates, so no accreditation, licence or warranty should be attributed to this business from this site.'
}

## Reviews

APMG's Google Business Profile shows ${googleAggregate.rating.toFixed(1)} out of 5 from ${googleAggregate.count} reviews, read on ${googleAggregate.asOf}: ${googleAggregate.url}

That figure belongs to Google, not to this site. This site reproduces ${googleReviews.length} of those reviews — the commercial ones — in full, with attribution, and publishes no rating of its own.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
