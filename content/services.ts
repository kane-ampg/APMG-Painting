import type { Service } from '@/lib/content/types';

export const services: readonly Service[] = [
  {
    slug: 'interior-painting',
    title: 'Interior painting',
    shortTitle: 'Interior',
    audience: 'commercial',
    summary:
      'Interior work in occupied buildings — offices, classrooms, wards and retail floors — staged so the space keeps working.',
    body: [
      'Interior painting is mostly a preparation and protection job. The visible result depends on what happens before the first coat: filling, sanding, sealing, and masking everything that is staying.',
      'In occupied buildings the harder problem is sequencing. Floors, fittings and equipment are protected, and work is staged zone by zone so the building stays usable while the programme runs.',
    ],
    includes: [
      'Walls and ceilings',
      'Doors, frames and joinery',
      'Corridors and high-traffic wall zones',
      'Washable and scrubbable systems',
      'Exposed services and soffits',
    ],
    image: {
      src: '/images/work/hall-scaffold-sheeted-floor.webp',
      alt: 'An APMG painter on a mobile scaffold cutting in the blue band beneath the clerestory windows of a school hall, the whole floor sheeted in black plastic',
    },
  },
  {
    slug: 'exterior-painting',
    title: 'Exterior painting',
    shortTitle: 'Exterior',
    audience: 'commercial',
    summary:
      'Exterior systems specified for UV, moisture and temperature movement, with access planned per elevation.',
    body: [
      'Melbourne exteriors take UV, driving rain and a wide temperature swing across a year. Coating selection and preparation are what decide whether a finish holds or fails early.',
      'Access is planned elevation by elevation. Multi-level and hard-to-reach areas are reached with the appropriate equipment rather than the most convenient one, and works are scheduled around suitable weather.',
    ],
    includes: [
      'Render, brick and precast concrete',
      'Roof and roof plant',
      'Fascias, gutters and eaves',
      'Car parks, walkways and balustrades',
      'Multi-level building exteriors',
    ],
    image: {
      src: '/images/work/exterior-spray-brick-elevation.webp',
      alt: 'An APMG painter in a respirator spraying the finish coat onto a face-brick elevation, spray line in hand',
    },
  },
  {
    slug: 'office-painting',
    title: 'Office painting',
    shortTitle: 'Office',
    audience: 'commercial',
    summary:
      'Workplace repaints programmed around business hours so staff keep working through the job.',
    body: [
      'Office work is judged on disruption as much as finish. Most programmes run after hours or in staged zones so desks stay occupied and the business keeps operating.',
      'Work covers the whole workplace — open floors, meeting rooms, kitchens, common areas, bathrooms, ceilings, doors and frames — with patching and making good handled as part of the same programme.',
    ],
    includes: [
      'Open-plan floors and meeting rooms',
      'Kitchens, common areas and bathrooms',
      'Patching and making good',
      'After-hours and staged programmes',
      'Colour consultation',
    ],
    image: {
      src: '/images/work/office-roller-occupied.webp',
      alt: 'An APMG painter running a pole roller down an office wall beside occupied desks and monitors, a second painter working the partition line behind',
    },
  },
  {
    slug: 'protective-coatings',
    title: 'Protective and specialist coatings',
    shortTitle: 'Protective coatings',
    audience: 'commercial',
    summary:
      'Systems for industrial substrates where the coating is doing a protective job, not a decorative one.',
    body: [
      'Industrial substrates need the existing coating identified and the surface properly assessed before anything is specified. Concrete, render, colorbond and structural steel each behave differently.',
      'Preparation methods are matched to the substrate and its condition — from hot or cold power washing and steam cleaning through to abrasion and chemical treatment where required.',
    ],
    includes: [
      'Concrete and tilt-panel',
      'Structural steel',
      'Colorbond and metal cladding',
      'Surface assessment and specification',
    ],
    image: {
      src: '/images/work/ewp-tilt-panel-cutting-in.webp',
      alt: 'An APMG painter working from a boom lift, harnessed, cutting in the line between white and green panels on a warehouse wall',
    },
  },
  {
    slug: 'builders-and-head-contractors',
    title: 'Painting for builders and head contractors',
    shortTitle: 'Builders & head contractors',
    audience: 'commercial',
    summary:
      'Painting delivered into a construction programme — staged to the build, sequenced around other trades, and carried through to handover.',
    body: [
      'Painting sold to a builder or head contractor runs to the construction programme rather than to a single site visit. The trigger is a staged handover from whatever trade is ahead of it, and the painting has to be ready to follow without holding up the trade behind it.',
      'Substrate preparation is where this work is won or lost. New plasterboard, fresh render and surfaces already touched by other trades all need to be brought to a paintable finish — filled, sanded, sealed and primed — before a coat goes on, and drying time on wet trades ahead of painting is a scheduling constraint the programme has to allow for, not a step that can be compressed.',
    ],
    includes: [
      'New-build painting packages',
      'Staged painting to a construction programme',
      'Defect rectification and touch-up painting before handover',
      'Practical-completion and defects-liability painting',
      'Painting coordinated around other trades’ sequencing',
      'Substrate preparation ahead of coating',
    ],
    image: {
      src: '/images/work/new-build-trim-priming.webp',
      alt: 'An APMG painter rolling primer onto a length of trim laid across trestles on a site still under construction, the rest of the run stacked alongside',
    },
  },
] as const;

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
