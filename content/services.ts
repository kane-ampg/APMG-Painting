import type { Service } from '@/lib/content/types';

export const services: readonly Service[] = [
  {
    slug: 'interior-painting',
    title: 'Interior painting',
    shortTitle: 'Interior',
    audience: 'both',
    summary:
      'Interior work in occupied spaces — homes, offices, classrooms and clinics — staged so the space keeps working.',
    body: [
      'Interior painting is mostly a preparation and protection job. The visible result depends on what happens before the first coat: filling, sanding, sealing, and masking everything that is staying.',
      'In occupied buildings the harder problem is sequencing. Flooring, furniture and fittings are protected, and work is staged room by room or zone by zone so the space stays usable while the programme runs.',
    ],
    includes: [
      'Walls and ceilings',
      'Architraves, skirting and doors',
      'Feature walls and wallpaper',
      'Timber staining',
      'Textured finishes',
    ],
    image: {
      src: '/images/work/interior-door-wall-roller.webp',
      alt: 'An APMG painter rolling the wall beside a glazed door with an extension pole, in a building still in use',
    },
  },
  {
    slug: 'exterior-painting',
    title: 'Exterior painting',
    shortTitle: 'Exterior',
    audience: 'both',
    summary:
      'Exterior systems specified for UV, moisture and temperature movement, with access planned per elevation.',
    body: [
      'Melbourne exteriors take UV, driving rain and a wide temperature swing across a year. Coating selection and preparation are what decide whether a finish holds or fails early.',
      'Access is planned elevation by elevation. Multi-level and hard-to-reach areas are reached with the appropriate equipment rather than the most convenient one, and works are scheduled around suitable weather.',
    ],
    includes: [
      'Render, brick and weatherboard',
      'Roof painting',
      'Fascias, gutters and eaves',
      'Fences and outbuildings',
      'Multi-level building exteriors',
    ],
    image: {
      src: '/images/work/exterior-render-drop-sheets.webp',
      alt: 'Two APMG painters coating a rendered house exterior, drop sheets down and a ladder set at the window head',
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
      'Work covers the whole workplace — open floors, meeting rooms, kitchens, common areas, bathrooms, ceilings, doors and frames — with patching, plastering and rendering handled as part of the same programme.',
    ],
    includes: [
      'Open-plan floors and meeting rooms',
      'Kitchens, common areas and bathrooms',
      'Patching, plastering and rendering',
      'After-hours and staged programmes',
      'Colour consultation',
    ],
    image: {
      src: '/images/work/office-roller-occupied.webp',
      alt: 'An APMG painter rolling a wall with an extension pole in an occupied office, floors sheeted and desks left in place',
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
      'Line marking and safety colours',
      'Surface assessment and specification',
    ],
    image: {
      src: '/images/work/ewp-tilt-panel-cutting-in.webp',
      alt: 'An APMG painter working from a boom lift, harnessed, cutting in the line between white and green panels on a warehouse wall',
    },
  },
  {
    slug: 'property-maintenance',
    title: 'Associated trade and maintenance services',
    shortTitle: 'Trade services',
    audience: 'commercial',
    summary:
      'The adjacent trades that usually sit around a painting scope, coordinated under one programme.',
    body: [
      'Painting scopes rarely arrive alone. Repairs, patching and making good are frequently needed before a coating can be applied, and coordinating them under one programme avoids the gap between trades that stalls a job.',
    ],
    includes: [
      'Plastering and patching',
      'Rendering',
      'Tiling',
      'Flooring',
      'Making good and minor repairs',
    ],
    image: {
      src: '/images/work/fascia-gutter-ladder.webp',
      alt: 'An APMG tradesperson on a ladder working along the fascia and gutter line of a weatherboard house',
    },
  },
] as const;

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
