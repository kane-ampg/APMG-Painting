import { accreditations, formattedAddress, isSandbox, site, siteUrl } from '@/lib/site';
import { services } from '@/content/services';
import { sectors } from '@/content/sectors';
import { projects } from '@/content/projects';
import { locations } from '@/content/locations';
import { homeFaqs } from '@/content/faqs';

/**
 * /llms.txt — a plain-text summary for AI answer engines.
 *
 * Built from the same typed content the pages render, so it cannot drift into
 * claiming something the site does not. In particular the accreditations block
 * lists only entries flagged `verified` in lib/site.ts; while none are, the
 * file says so rather than omitting the subject and letting a model guess.
 *
 * Suppressed entirely while the sandbox flag is on — a preview build should not
 * be handing answer engines a tidy summary of itself.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  if (isSandbox) {
    return new Response('User-agent: *\n# Preview build. No content published.\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const verified = accreditations.filter((a) => a.verified);

  const body = `# ${site.name}

> ${site.tagline}. ${site.legalName}, founded ${site.founded}, based at ${formattedAddress}. Work is carried out across ${site.serviceArea.primary}, within roughly ${site.serviceArea.radiusKm} km of the Chirnside Park base.

APMG Painting is a painting and property maintenance contractor. The work splits two ways: commercial programmes in buildings that stay open while they are painted — schools, clinics, aged care, strata, retail, hospitality and industrial sites — and interior and exterior painting on Melbourne homes.

Contact: ${site.phone.display} · ${site.email}

## How the work is quoted

Commercial enquiries begin with a site assessment that establishes scope, substrate condition, access and permitted working hours before a price is given. Residential enquiries are quoted after the property has been seen. Neither is quoted from a photograph or a floor area, because preparation is the largest variable in the job.

## Services

${services.map((s) => `- [${s.title}](${siteUrl}/commercial/): ${s.summary}`).join('\n')}

## Commercial sectors

${sectors.map((s) => `- [${s.shortTitle}](${siteUrl}${s.legacyPath}): ${s.intro}`).join('\n')}

## Documented projects

${projects.map((p) => `- [${p.title}](${siteUrl}/projects/${p.slug}/): ${p.location}. ${p.challenge}`).join('\n')}

## Suburbs served

Melbourne metropolitan area, worked from ${site.address.suburb}. "Do you work in X?" is the most common question an answer engine gets asked about a trade business, so the suburbs with documented work are listed rather than left to a link:

${locations.map((l) => `- ${l.suburb}, ${l.region}${l.indexable ? '' : ' (no documented project yet)'}`).join('\n')}

Suburbs outside this list within roughly ${site.serviceArea.radiusKm} km of ${site.address.suburb} are still serviced; the list records where work is documented, not the limit of the service area.

## Common questions

${homeFaqs.map((f) => `### ${f.question}\n\n${f.answer}`).join('\n\n')}

## Key pages

- [Commercial painting](${siteUrl}/commercial/)
- [House painting](${siteUrl}/residential-painting/)
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
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
