import { placeholder, type Project } from '@/lib/content/types';

/**
 * Case studies.
 *
 * Every fact here is transcribed from the existing apmgpainting.com.au project
 * pages. Nothing is invented. Where the source page did not state something
 * (durations, testimonial attribution, coating products), the field is either
 * omitted or carries a clearly labelled editorial placeholder.
 *
 * Copy has been rewritten for clarity and to use one company name, but no
 * claim has been strengthened. The NDIS study in particular was heavily
 * keyword-stuffed on the live site; the facts are unchanged.
 */
export const projects: readonly Project[] = [
  {
    slug: 'emmaus-college-school-repaint-vermont',
    title: 'Emmaus College school repaint, Vermont',
    clientOrPropertyType: 'Secondary school campus',
    location: 'Vermont, Victoria',
    sectorSlug: 'education-and-childcare',
    challenge:
      'A full interior and exterior repaint across a campus that stayed open throughout. The site had to keep running while work moved between zones, with access shared alongside an active construction site on one boundary and an operating childcare facility on another.',
    scopeOfWork: [
      'Internal common areas repainted throughout',
      'External building surfaces repainted in a multi-colour scheme',
      'Work sequenced across multiple zones while the campus remained operational',
    ],
    preparation: [
      'Surface preparation to internal areas as required',
      'Exterior preparation to support long-term adhesion',
    ],
    coatingSystem:
      'Two coats to internal surfaces. Three coats to most external surfaces, with multiple colours applied in controlled stages to hold clean lines and even coverage.',
    accessAndSafety: [
      'Ladders for lower-level areas',
      'Scaffolding for extended work zones',
      'Boom lift (EWP) for higher and restricted-access areas',
    ],
    schedulingConstraints: [
      'Live school environment — zones isolated and handed back progressively',
      'External works scheduled around suitable weather, with sequencing adjusted to prioritise internal or protected areas',
      'Adjacent construction site — access, deliveries and shared boundaries coordinated with the builder and site supervisor',
      'Operating childcare facility next door — boundary control, activity timing and safe conduct near shared areas',
    ],
    duration: placeholder('Project duration not stated on the source page — confirm with APMG.'),
    images: [
      {
        src: '/images/projects/emmaus-college-vermont-01.webp',
        alt: 'Repainted exterior brickwork and rendered walls at Emmaus College in Vermont',
      },
      {
        src: '/images/projects/emmaus-college-vermont-02.webp',
        alt: 'Multi-colour exterior scheme applied across a school building elevation at Emmaus College',
      },
    ],
    outcome: [
      'Refreshed internal common areas with consistent coverage',
      'A durable, multi-coat exterior finish',
      'Cleanly applied multi-colour external surfaces',
      'Safe, efficient completion despite access constraints and neighbouring site activity',
    ],
    testimonial: placeholder(
      'No testimonial was published for this project — request one from the school if permission allows.',
    ),
    relatedServiceSlugs: ['interior-painting', 'exterior-painting'],
    relatedLocationSlugs: ['painters-vermont'],
    isFeatured: true,
  },

  {
    slug: 'case-study-factory-exterior-painting-in-noble-park-victoria',
    title: 'Factory exterior repaint, Noble Park',
    clientOrPropertyType: 'Manufacturing facility',
    location: 'Noble Park, Victoria',
    sectorSlug: 'industrial',
    initialCondition:
      'External surfaces carried accumulated dust, dirt and deteriorating coatings, with render damage in places.',
    challenge:
      'A full exterior repaint of a working factory, delivered in the client’s brand colours without interrupting production or site access.',
    scopeOfWork: [
      'Full exterior repaint across the facility',
      'Render repairs ahead of coating',
      'Brand-aligned colour scheme applied across the building',
    ],
    preparation: [
      'Washed and cleaned all external surfaces to remove dust, dirt and old coatings',
      'Repaired render where needed to give a smooth, even base',
    ],
    coatingSystem:
      'Two coats of premium exterior paint, giving depth of colour and added durability against sun, wind and rain.',
    accessAndSafety: [
      'Boom lifts for high areas',
      'Scissor lifts for mid-level walls',
      'Scaffolding for tight corners',
      'All work carried out under OH&S practices by a licensed team',
    ],
    schedulingConstraints: [
      'Works scheduled to avoid peak operational times',
      'Safe pedestrian and vehicle access maintained throughout',
      'Coordinated directly with site managers',
    ],
    duration: placeholder('Project duration not stated on the source page — confirm with APMG.'),
    images: [
      {
        src: '/images/projects/noble-park-factory-01.webp',
        alt: 'Repainted factory exterior in Noble Park showing the client’s brand colour scheme',
      },
      {
        src: '/images/projects/noble-park-factory-02.webp',
        alt: 'Large-format factory wall repainted using boom lift access in Noble Park',
      },
    ],
    outcome: [
      'A brand-aligned exterior that reads as a deliberate, professional presentation',
      'Durable paintwork specified for Melbourne’s changing weather',
      'No disruption to day-to-day business',
    ],
    testimonial: {
      quote:
        'The new paint job has completely refreshed the site and our staff love the new look. The APMG team worked around our schedule with no disruption.',
      // The live page attributes this only as "Client Feedback".
      attribution: 'Client feedback',
    },
    relatedServiceSlugs: ['exterior-painting', 'protective-coatings'],
    relatedLocationSlugs: [],
    isFeatured: true,
  },

  {
    slug: 'ndis-commercial-painting',
    title: 'Repaint of 11 NDIS offices across Melbourne',
    clientOrPropertyType: 'Disability services provider — 11 office sites',
    location: 'Across metropolitan Melbourne',
    sectorSlug: 'industrial',
    challenge:
      'Repainting eleven separate office sites for one client, each an occupied workplace, under a single contract with fixed budget accountability and consistent standards across every location.',
    scopeOfWork: [
      'Interior repaint across eleven office sites',
      'Single coordinated programme covering all locations',
      'Itemised quotation breaking down labour, materials and scheduling per site',
    ],
    preparation: [
      'Pre-start meetings at each site to confirm requirements, safety expectations and site-specific considerations',
      'Safe Work Method Statements, insurance certificates and compliance documentation prepared in advance',
    ],
    accessAndSafety: [
      'Barriers, signage and protective coverings maintained across every site',
      'All work completed in line with OHS standards',
      'Each worksite kept secure for staff and visitors throughout',
    ],
    schedulingConstraints: [
      'Much of the work completed outside standard business hours so staff could keep working uninterrupted',
      'Eleven sites sequenced to hold a single overall programme',
    ],
    duration: placeholder('Programme length not stated on the source page — confirm with APMG.'),
    images: [
      {
        // Representative of APMG commercial interior work, NOT photographed at
        // an NDIS site. Alt text says only what the image actually shows.
        src: '/images/projects/ndis-offices-01.webp',
        alt: 'Repainted commercial office interior by APMG Painting',
      },
    ],
    outcome: [
      'All eleven sites delivered on time and within budget',
      'A consistent standard of finish across every location',
      'Staff able to keep working throughout, with disruption confined to after-hours periods',
    ],
    testimonial: placeholder(
      'The source page states the client praised the result but publishes no quotation or attribution. Request a written, attributable testimonial before using one.',
    ),
    relatedServiceSlugs: ['interior-painting', 'office-painting'],
    relatedLocationSlugs: [],
    isFeatured: true,
  },

  {
    slug: 'medical-clinic-fit-out-painting-newbay-medical-brighton',
    title: 'Medical clinic fit-out and painting — Newbay Medical, Brighton',
    clientOrPropertyType: 'Medical clinic',
    location: 'Brighton, Victoria',
    sectorSlug: 'healthcare',
    challenge:
      'Painting as part of a clinic fit-out, delivered to a standard suited to a clinical environment.',
    scopeOfWork: ['Painting works delivered as part of the clinic fit-out'],
    duration: placeholder('Not stated on the source page.'),
    images: [
      {
        // Representative commercial interior, NOT photographed at Newbay Medical.
        // Replace with real project photography before publication.
        src: '/images/projects/newbay-medical-brighton-01.webp',
        alt: 'Repainted commercial interior by APMG Painting',
      },
    ],
    outcome: ['A clean, clinical finish delivered as part of the fit-out programme'],
    testimonial: placeholder('No testimonial published.'),
    relatedServiceSlugs: ['interior-painting'],
    relatedLocationSlugs: ['painters-brighton'],
    // 164 words on the live site with no scope, preparation or access detail.
    // Excluded from featured slots until APMG supplies the project record.
    isFeatured: false,
  },

  {
    slug: 'house-painting-glen-iris',
    title: 'House painting, Glen Iris',
    clientOrPropertyType: 'Detached home',
    location: 'Glen Iris, Victoria',
    // Residential work sits outside the commercial sector taxonomy.
    sectorSlug: 'residential',
    challenge: 'Residential repaint of a Glen Iris home.',
    scopeOfWork: ['House painting works'],
    duration: placeholder('Not stated on the source page.'),
    images: [
      {
        src: '/images/projects/glen-iris-house-01.webp',
        alt: 'Repainted weatherboard house exterior in Glen Iris',
      },
    ],
    outcome: ['Completed residential repaint'],
    testimonial: placeholder('No testimonial published.'),
    relatedServiceSlugs: ['interior-painting', 'exterior-painting'],
    relatedLocationSlugs: ['painters-glen-iris'],
    // 155 words on the live site. Needs a real project record before it earns
    // a place in the case-study set.
    isFeatured: false,
  },
] as const;

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export const featuredProjects = projects.filter((p) => p.isFeatured);

export function projectsForSector(sectorSlug: string): Project[] {
  return projects.filter((p) => p.sectorSlug === sectorSlug);
}
