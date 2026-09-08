import type { Location } from '@/lib/content/types';

/**
 * Location pages.
 *
 * The live site publishes 68 suburb pages of 355–677 words each, none of which
 * carries a local project, a local photograph or a local testimonial. Three are
 * defective: `park-dale` duplicates `parkdale`, `travencore` misspells
 * Travancore, and `garden-vale` misspells Gardenvale.
 *
 * The rule applied here: a suburb page is indexable ONLY when it has genuine
 * unique value. Everything else is noindex and stays that way until APMG
 * supplies evidence. `indexabilityReason` records the call so the client can
 * review each one.
 *
 * This file currently holds a representative subset for the sandbox. The full
 * 68-page sort needs APMG's real project list plus Search Console impression
 * data — neither is available yet, and neither guessing nor bulk-deleting is
 * an acceptable substitute.
 */
export const locations: readonly Location[] = [
  {
    slug: 'painters-vermont',
    suburb: 'Vermont',
    region: 'Eastern suburbs',
    projectSlugs: ['emmaus-college-school-repaint-vermont'],
    intro:
      'APMG Painting completed a full interior and exterior repaint at Emmaus College in Vermont, working across a live campus while the school stayed open. Vermont sits in Melbourne’s eastern suburbs, roughly ten minutes from our Bayswater North base.',
    localNotes: [
      'Vermont’s commercial stock is largely low-rise brick and render — schools, childcare, medical suites and light industrial along Canterbury and Boronia Roads — so exterior programmes commonly combine render, brick and metal in a single scope.',
      'The Emmaus College project is documented in full, including the access methods and the coordination required alongside a neighbouring construction site.',
    ],
    indexable: true,
    indexabilityReason:
      'Carries a real, documented project completed in the suburb, with original photography.',
    legacyPath: '/areas/painters-vermont/',
  },
  {
    slug: 'painters-brighton',
    suburb: 'Brighton',
    region: 'Bayside',
    projectSlugs: ['medical-clinic-fit-out-painting-newbay-medical-brighton'],
    intro:
      'APMG Painting completed the painting works for the Newbay Medical clinic fit-out in Brighton. Brighton sits in Melbourne’s bayside, where salt exposure shortens the life of exterior coatings on west- and south-facing elevations.',
    localNotes: [
      'Bayside exteriors weather faster than inland equivalents. Coating selection matters more here than the interval between repaints.',
    ],
    indexable: true,
    indexabilityReason:
      'A real project in the suburb, though the project record itself is thin (164 words on the live site) and should be expanded.',
    // The live page's title and H1 read "Painting Brighton", not "Brighton" —
    // the template token was populated wrongly. Corrected here.
    legacyPath: '/areas/painters-brighton/',
  },
  {
    slug: 'painters-glen-iris',
    suburb: 'Glen Iris',
    region: 'Inner east',
    // The case study this page referenced was removed when the site narrowed
    // to commercial only (spec §3). No commercial project is documented in
    // this suburb yet.
    projectSlugs: [],
    indexable: false,
    indexabilityReason:
      'No commercial project documented in this suburb yet. Noindex pending evidence.',
    legacyPath: '/areas/painters-glen-iris/',
  },
  {
    slug: 'painters-armadale',
    suburb: 'Armadale',
    region: 'Inner east',
    projectSlugs: [],
    indexable: false,
    indexabilityReason:
      'No project, no local photography, no testimonial. The live page is a name-swapped template titled "Painters Painters Armadale". Noindex pending evidence, or consolidate into an inner-east regional page.',
    legacyPath: '/areas/painters-armadale/',
  },
  {
    slug: 'painters-parkdale',
    suburb: 'Parkdale',
    region: 'Bayside',
    projectSlugs: [],
    indexable: false,
    indexabilityReason:
      'No unique evidence. Also the survivor of a duplicate pair — /areas/painters-park-dale/ 301s here.',
    legacyPath: '/areas/painters-parkdale/',
  },
  {
    slug: 'painters-travancore',
    suburb: 'Travancore',
    region: 'Inner north west',
    projectSlugs: [],
    indexable: false,
    indexabilityReason:
      'No unique evidence. Slug corrected from the misspelled "travencore", which 301s here. The live page was titled "Painters in Painters Travencore".',
    legacyPath: '/areas/painters-travencore/',
  },
  {
    slug: 'painters-gardenvale',
    suburb: 'Gardenvale',
    region: 'Bayside',
    projectSlugs: [],
    indexable: false,
    indexabilityReason:
      'No unique evidence. Slug corrected from the misspelled "garden-vale", which 301s here.',
    legacyPath: '/areas/painters-garden-vale/',
  },
] as const;

export function getLocation(slug: string): Location | undefined {
  return locations.find((l) => l.slug === slug);
}

export const indexableLocations = locations.filter((l) => l.indexable);

/** Grouped for the /areas/ hub, which stays indexable as a genuine directory. */
export function locationsByRegion(): Map<string, Location[]> {
  const map = new Map<string, Location[]>();
  for (const location of locations) {
    const existing = map.get(location.region);
    if (existing) {
      existing.push(location);
    } else {
      map.set(location.region, [location]);
    }
  }
  return map;
}
