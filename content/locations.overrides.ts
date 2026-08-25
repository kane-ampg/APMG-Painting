/**
 * Hand-written suburb copy, keyed by `state|slug`, merged over the generated data.
 *
 * Kept separate so scripts/build-locations.mts can be re-run at any time
 * without destroying human writing.
 *
 * Keyed by `state|slug`, not bare slug — 13 locality names exist in both
 * states (Brighton, Newport, Windsor, Fairfield, Albion, Burnside, Clifton
 * Hill, Donnybrook, Gilberton, Heathwood, Middle Park, Sumner, Wishart). A
 * bare-slug key would put Brighton VIC's hand-written copy on Brighton QLD's
 * page — a factual claim about work APMG has never done in Queensland.
 */
export type LocalityOverride = {
  intro?: string;
  localNotes?: readonly string[];
};

/**
 * Queensland presence.
 *
 * False because APMG has no Queensland address, no completed Queensland
 * projects and no Queensland phone number (spec §9). While this is false:
 * no second LocalBusiness entity, no QLD locality is indexable, and no QLD
 * copy may claim local presence.
 *
 * Flip it only when APMG supplies an address or a documented project.
 */
export const qldPresence = false;

/**
 * Suburb-level tier promotions, applied over the generated tier.
 *
 * The generator assigns tiers from the committed seed list. Bayswater North
 * generates at Tier 3 — noindex — which is wrong: it is APMG's own registered
 * office as of the August 2026 move, and the spec's own Tier 1 rationale leads
 * with it. The one suburb the business physically operates from cannot be the
 * one suburb it is unable to rank in.
 *
 * Keyed by `state|slug`, because 13 slugs exist in both states.
 */
export const TIER_1_OVERRIDES: Readonly<Record<string, true>> = {
  'VIC|bayswater-north': true,
};

export const localityOverrides: Readonly<Record<string, LocalityOverride>> = {
  'VIC|vermont': {
    intro:
      'APMG Painting completed a full interior and exterior repaint at Emmaus College in Vermont, working across a live campus while the school stayed open. Vermont sits in Melbourne’s eastern suburbs, roughly ten minutes from our Bayswater North base.',
    localNotes: [
      'Vermont’s commercial stock is largely low-rise brick and render — schools, childcare, medical suites and light industrial along Canterbury and Boronia Roads — so exterior programmes commonly combine render, brick and metal in a single scope.',
      'The Emmaus College project is documented in full, including the access methods and the coordination required alongside a neighbouring construction site.',
    ],
  },
  'VIC|brighton': {
    intro:
      'APMG Painting completed the painting works for the Newbay Medical clinic fit-out in Brighton. Brighton sits in Melbourne’s bayside, where salt exposure shortens the life of exterior coatings on west- and south-facing elevations.',
    localNotes: [
      'Bayside exteriors weather faster than inland equivalents. Coating selection matters more here than the interval between repaints.',
    ],
  },
};
