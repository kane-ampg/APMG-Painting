import type { Sector } from '@/lib/content/types';

/**
 * Sector pages — the commercial proof surface.
 *
 * On the live site all eight of these sit in the footer only, absent from the
 * main navigation. Under the commercial-led strategy they become children of
 * /commercial/ in the nav, while keeping their existing URLs (`legacyPath`)
 * so no indexed page moves.
 *
 * Copy is rewritten around operational reality rather than generic paint
 * benefits. Sectors with no linked project carry no proof claim.
 */
export const sectors: readonly Sector[] = [
  {
    slug: 'education-and-childcare',
    title: 'School and childcare painting in Melbourne',
    shortTitle: 'Education & childcare',
    primaryQuery: 'school painting Melbourne',
    metaTitle: 'School & Childcare Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne schools, colleges and childcare centres. Work staged around term dates and live campuses, by personnel holding Working with Children Checks.',
    intro:
      'Painting a school means working around a campus that never really stops. Term dates, exam periods, playground access and the presence of children all shape when work can happen and how a site is set up each day.',
    considerations: [
      {
        heading: 'Staged around the school calendar',
        body: 'Most work is sequenced into term breaks and holiday periods. Where that is not possible, zones are isolated and handed back progressively so teaching continues.',
      },
      {
        heading: 'Personnel clearances',
        body: 'Staff working on education sites hold Working with Children Checks. Site inductions and sign-in procedures are followed as the school requires.',
      },
      {
        heading: 'Access across varied building heights',
        body: 'Campuses mix single-storey classrooms with taller halls and gymnasiums, so access is planned per building — ladders, scaffolding or an EWP as each area requires.',
      },
      {
        heading: 'Neighbouring site coordination',
        body: 'Schools frequently sit alongside childcare centres or active construction. Boundaries, deliveries and shared access are coordinated with the other operators.',
      },
    ],
    projectSlugs: ['emmaus-college-school-repaint-vermont'],
    legacyPath: '/education-and-childcare-painting-melbourne/',
  },
  {
    slug: 'healthcare',
    title: 'Healthcare and medical painting in Melbourne',
    shortTitle: 'Healthcare',
    primaryQuery: 'healthcare painting Melbourne',
    metaTitle: 'Healthcare & Medical Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne medical clinics and healthcare facilities. Work staged around patient hours with low-odour coatings and controlled access.',
    intro:
      'Clinical environments set the terms. Infection control, patient movement and consulting-room availability all determine when a space can be handed over and what can be applied in it.',
    considerations: [
      {
        heading: 'Worked around patient hours',
        body: 'Areas are handed over room by room, commonly outside consulting hours, so the facility keeps operating throughout.',
      },
      {
        heading: 'Coating selection for clinical spaces',
        body: 'Low-odour and washable systems are specified where occupancy turnaround is short and surfaces are cleaned frequently.',
      },
      {
        heading: 'Personnel clearances',
        body: 'Staff working on healthcare sites hold current police checks.',
      },
    ],
    projectSlugs: ['medical-clinic-fit-out-painting-newbay-medical-brighton'],
    legacyPath: '/healthcare-painters/',
  },
  {
    slug: 'aged-care-and-retirement',
    title: 'Aged care and retirement living painting in Melbourne',
    shortTitle: 'Aged care & retirement',
    primaryQuery: 'aged care painting Melbourne',
    metaTitle: 'Aged Care & Retirement Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne aged care and retirement living facilities. Staged works in occupied residences with low-odour systems and clear access routes.',
    intro:
      'Residents live on site throughout. That makes noise, odour, dust and — above all — clear, unobstructed access routes the constraints that shape the programme.',
    considerations: [
      {
        heading: 'Occupied throughout',
        body: 'Work is staged so residents keep safe, level access to their rooms and to common areas at every point in the programme.',
      },
      {
        heading: 'Low-odour systems',
        body: 'Coatings are selected to limit odour where residents cannot easily relocate during works.',
      },
      {
        heading: 'Personnel clearances',
        body: 'Staff working on aged care sites hold current police checks.',
      },
    ],
    projectSlugs: [],
    legacyPath: '/aged-care-and-retirement-painting/',
  },
  {
    slug: 'body-corporate-and-strata',
    title: 'Body corporate and strata painting in Melbourne',
    shortTitle: 'Body corporate & strata',
    primaryQuery: 'strata painting Melbourne',
    metaTitle: 'Body Corporate & Strata Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne owners corporations and strata-managed buildings. Documented scopes, staged common-area works and predictable programmes.',
    intro:
      'Strata work answers to a committee, not a single decision-maker. Scopes need to be documented well enough to be approved at a meeting, and programmes need to survive contact with residents who live there.',
    considerations: [
      {
        heading: 'Scopes written to be approved',
        body: 'Quotations are itemised by area and system so a committee can compare like for like and approve without a second round of questions.',
      },
      {
        heading: 'Common areas kept usable',
        body: 'Lobbies, corridors, stairwells and car parks are staged so residents retain access throughout.',
      },
      {
        heading: 'Resident notice',
        body: 'Programme dates are provided in advance for the manager to circulate, including any period affecting balconies or entry points.',
      },
    ],
    projectSlugs: [],
    legacyPath: '/body-corporate-and-real-estate-painting-melbourne/',
  },
  {
    slug: 'retail',
    title: 'Retail painting in Melbourne',
    shortTitle: 'Retail',
    primaryQuery: 'retail painting Melbourne',
    metaTitle: 'Retail & Shopfitting Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne retail tenancies and shopfronts. Overnight and after-hours programmes that hand the floor back for trade.',
    intro:
      'Retail work is measured against trading hours. The practical question is rarely how long the painting takes — it is how much can be completed and made presentable between close and open.',
    considerations: [
      {
        heading: 'After-hours programmes',
        body: 'Work is commonly carried out overnight or outside trading hours, with the space cleaned and returned ready to trade each morning.',
      },
      {
        heading: 'Centre requirements',
        body: 'Shopping-centre inductions, dock bookings and after-hours access permits are arranged before work begins.',
      },
      {
        heading: 'Fit-out coordination',
        body: 'Painting is sequenced with shopfitters, electricians and signage so trades are not working over one another.',
      },
    ],
    projectSlugs: [],
    legacyPath: '/retail-painting/',
  },
  {
    slug: 'hospitality',
    title: 'Hospitality painting in Melbourne',
    shortTitle: 'Hospitality',
    primaryQuery: 'hospitality painting Melbourne',
    metaTitle: 'Hospitality & Venue Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne pubs, restaurants, cafes and venues. Work programmed around service so the venue keeps trading.',
    intro:
      'Venues trade at the times most trades prefer to work. Programmes are built backwards from service, and finishes have to withstand cleaning regimes far harsher than a domestic interior.',
    considerations: [
      {
        heading: 'Programmed around service',
        body: 'Work is scheduled around trading hours and function bookings, commonly early mornings or full venue closures.',
      },
      {
        heading: 'Durable, cleanable finishes',
        body: 'Systems are specified for high-traffic areas and frequent commercial cleaning.',
      },
      {
        heading: 'Food-safe sequencing',
        body: 'Kitchen and servery areas are isolated and cleaned down before handover.',
      },
    ],
    projectSlugs: [],
    legacyPath: '/hospitality-painters-in-melbourne/',
  },
  {
    slug: 'leisure-and-sports',
    title: 'Leisure and sports facility painting in Melbourne',
    shortTitle: 'Leisure & sports',
    primaryQuery: 'sports facility painting Melbourne',
    metaTitle: 'Leisure & Sports Facility Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne leisure centres, gyms, clubrooms and sporting facilities. Work staged around fixtures, seasons and member access.',
    intro:
      'Leisure facilities run to a fixture list. Seasons, competitions and member access decide the window, and the surfaces involved are often large, high and heavily used.',
    considerations: [
      {
        heading: 'Staged around the season',
        body: 'Work is planned into off-season windows or between fixtures where a facility cannot close.',
      },
      {
        heading: 'Large and high surfaces',
        body: 'Stadium walls, gymnasium ceilings and clubroom exteriors need appropriate access equipment planned area by area.',
      },
      {
        heading: 'High-contact durability',
        body: 'Change rooms, wet areas and equipment stores take heavy wear and are specified accordingly.',
      },
    ],
    projectSlugs: [],
    legacyPath: '/leisure-and-sports-painting/',
  },
  {
    slug: 'industrial',
    title: 'Industrial and warehouse painting in Melbourne',
    shortTitle: 'Industrial & warehouse',
    primaryQuery: 'industrial painting Melbourne',
    metaTitle: 'Industrial & Warehouse Painting Melbourne | APMG Painting',
    metaDescription:
      'Painting for Melbourne factories, warehouses and distribution centres. Large-format exteriors, protective coatings and works around live operations.',
    intro:
      'Industrial sites bring scale and substrate variety together: large-format exteriors, steelwork, concrete tilt panels and roof structures, usually while the facility keeps running.',
    considerations: [
      {
        heading: 'Substrate assessment first',
        body: 'Concrete, render, colorbond and structural steel each need their own preparation and system. Older sites need existing coatings identified before specification.',
      },
      {
        heading: 'Height and access',
        body: 'Large-format facades and roof structures are planned with the appropriate access method for each elevation.',
      },
      {
        heading: 'Around live operations',
        body: 'Programmes are built around production, dispatch schedules and vehicle movement so the facility keeps operating.',
      },
    ],
    projectSlugs: ['case-study-factory-exterior-painting-in-noble-park-victoria'],
    // New page. Industrial content currently has no home of its own — it sits
    // inside /commercial/. Creating a page is safe; moving one is not.
    legacyPath: '/industrial-painting-melbourne/',
  },
] as const;

export function getSector(slug: string): Sector | undefined {
  return sectors.find((s) => s.slug === slug);
}
