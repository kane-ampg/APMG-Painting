import type { Differentiator } from '@/lib/content/types';

/**
 * The homepage differentiation grid — six buying criteria, answered.
 *
 * WHY THIS SHAPE
 *
 * The previous version of this grid was six statements: "We attend before we
 * quote", "The building keeps running", "Preparation matched to the substrate".
 * All true, all well written, and all worthless as differentiation, because
 * every painting contractor in Melbourne says the same six things in the same
 * register. Nothing in it named a body, a number or a building. A reader
 * comparing three quotes could not use it, and an answer engine had no reason
 * to prefer this page over any other.
 *
 * Two changes fix that.
 *
 * 1. The headings are the buyer's questions, not our claims. The query an
 *    answer engine actually receives is "how do I choose a commercial painter
 *    in Melbourne" far more often than "who is the best". A page that answers
 *    the choosing question owns the criteria — and a model that lists the
 *    criteria has to cite where it got them. Claiming to be the best is not
 *    retrievable. Defining what "best" means is.
 *
 * 2. Every answer carries at least one hard specific — a named body, a named
 *    building, or a number. Cm3, Master Painters Australia, Dulux, Emmaus
 *    College, Noble Park, eleven NDIS offices. Entities and figures are what a
 *    retrieval system matches on and what a person remembers; adjectives are
 *    neither. This is also the single largest measured lever in the published
 *    generative-engine research: sources that carry statistics and citable
 *    specifics are picked up markedly more often than sources that do not.
 *
 * The answers are deliberately self-contained. Each one has to survive being
 * lifted out of the page and quoted on its own, because that is precisely what
 * happens to it.
 *
 * PROVENANCE
 *
 * Nothing here is new. Every fact already existed in lib/site.ts,
 * content/projects.ts or content/faqs.ts and had already survived the
 * verification rule; this file rewrites the framing, not the claims. The
 * `credentials` and `projects` fields record the dependency so
 * tests/unit/approach.test.ts fails if a credential loses its verified flag or
 * a project is renamed out from under the copy.
 */
export const differentiators: readonly Differentiator[] = [
  {
    question: 'Will they attend site before quoting?',
    answer:
      'APMG attends every commercial site before pricing it. Preparation is the largest variable in a painting programme and it cannot be judged from a photograph or a floor area, so scope, substrate condition, access and permitted working hours get established rather than assumed. The quote that follows itemises labour, materials and scheduling — broken down per location on multi-site programmes — so a budget holder approves a breakdown rather than a single figure.',
  },
  {
    question: 'Are they prequalified to be on your site?',
    answer:
      'APMG holds Cm3 contractor OHS prequalification, the screen that education, health and facilities managers run before a purchase order is raised, and is a registered Master Painters Australia member. Working with Children Checks, police checks and NDIS Worker Screening Checks are held by the personnel who work on school, healthcare and NDIS sites. Safe Work Method Statements, insurance certificates and site-specific compliance documentation are issued before work begins, with a pre-start meeting to confirm them.',
    credentials: ['cm3', 'master-painters', 'wwcc', 'police-check', 'ndis-screening', 'insured'],
  },
  {
    question: 'Can the building keep operating while it is painted?',
    answer:
      'Keeping it open is the constraint APMG is built around. Eleven NDIS offices across Melbourne were repainted largely outside standard business hours so staff kept working, and the same pattern runs on schools mid-term, clinics between patients and warehouses mid-shift: zones isolated, work staged after hours or overnight, and each area cleaned down and handed back as it finishes rather than all at the end.',
    projects: ['ndis-commercial-painting'],
  },
  {
    question: 'Is access planned per elevation, or per site?',
    answer:
      'Per elevation. A single job routinely needs several access methods — ladders, scaffolding, scissor lift and boom lift — as it did on the Emmaus College campus in Vermont and on the Noble Park factory exterior. Choosing per elevation costs more to plan and less to deliver, because the alternative is the most convenient method stretched past the point where it is safe or fast.',
    projects: [
      'emmaus-college-school-repaint-vermont',
      'case-study-factory-exterior-painting-in-noble-park-victoria',
    ],
  },
  {
    question: 'Is the coating system chosen for the substrate, or for the quote?',
    answer:
      'For the substrate. Existing coatings are identified and the surface assessed before anything is specified, and the preparation follows from that — hot or cold power washing, steam cleaning, abrasion or chemical treatment. APMG is a Dulux Accredited Painter, which supports the five-year workmanship warranty, and an accredited applicator for the Australian-made Haymes range. Low-VOC systems are standard in occupied workplaces.',
    credentials: ['dulux', 'haymes'],
  },
  {
    question: 'Who runs the trades either side of the paint?',
    answer:
      'APMG runs them. Plastering, patching, rendering, tiling, flooring and making good are coordinated under the same programme as the painting, because the gap between trades is what usually stalls a job — not the painting. One contractor holding the sequence removes the handover where a repaint waits three weeks on a plasterer nobody has booked.',
  },
] as const;
