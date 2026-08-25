import type { Audience, Faq } from '@/lib/content/types';

/**
 * FAQs.
 *
 * Commercial only. Only answers that reflect what APMG demonstrably does are
 * included — nothing here asserts a credential or a guarantee that has not
 * been verified.
 */
export const faqs: readonly Faq[] = [
  {
    question: 'Can you work outside our operating hours?',
    answer:
      'Yes. Most commercial programmes we run are staged around the site rather than the other way round — after hours, overnight, in term breaks, or zone by zone during the day. The repaint of eleven NDIS offices across Melbourne was largely completed outside standard business hours so staff could keep working.',
    audience: 'commercial',
  },
  {
    question: 'What documentation do you provide before starting?',
    answer:
      'Safe Work Method Statements, insurance certificates and site-specific compliance documentation are prepared before work begins, and we hold a pre-start meeting to confirm requirements and safety expectations for each site.',
    audience: 'commercial',
  },
  {
    question: 'Do you quote per site or per programme?',
    answer:
      'Either. For multi-site work we provide an itemised breakdown covering labour, materials and scheduling per location, so budget holders can see where the cost sits rather than receiving a single figure.',
    audience: 'commercial',
  },
  {
    question: 'How do you handle access on multi-level or large-format buildings?',
    answer:
      'Access is planned per elevation and per area rather than site-wide. Depending on the building that means ladders, scaffolding, scissor lifts or a boom lift — often several on the same job, as on the Emmaus College campus and the Noble Park factory exterior.',
    audience: 'commercial',
  },
  {
    question: 'Will you attend site before quoting?',
    answer:
      'For commercial work, yes. A site assessment is how scope, access constraints and operating-hours limitations get established before a number is put on the job.',
    audience: 'commercial',
  },

  {
    question: 'Which areas of Melbourne do you cover?',
    answer:
      'We work across metropolitan Melbourne from our base at Bayswater North. If you are unsure whether your property is within range, call and ask — it is a quicker answer than a form.',
    audience: 'commercial',
  },
] as const;

/**
 * Office-specific FAQs.
 *
 * Kept out of the `commercial` set because the questions a facilities manager
 * asks about a workplace repaint are narrower than the ones a school or a
 * factory asks, and /office-painters/ targets its own query.
 */
export const officeFaqs: readonly Faq[] = [
  {
    question: 'Can you paint the office after hours so nobody has to move out?',
    answer:
      'That is how most office programmes run. Work happens overnight or across a weekend, and each area is cleaned down and returned before the next working day. Where a full after-hours programme is not practical, the floor is split into zones and staff are relocated one zone at a time rather than the whole floor being emptied.',
    audience: 'commercial',
  },
  {
    question: 'What happens to computers, monitors and cabling?',
    answer:
      'Equipment is either moved clear by your team or covered and worked around, and that decision is made before the programme starts because it changes the sequence. Data cabling, floor boxes and comms rooms are treated as exclusion zones unless your IT team says otherwise. The practical advice is to have desks cleared of loose items — the equipment itself is straightforward, the personal effects are what slow a floor down.',
    audience: 'commercial',
  },
  {
    question: 'Will the office smell of paint when staff come back?',
    answer:
      'Low-VOC systems are standard for occupied workplaces and they reduce it substantially, but ventilation is what actually clears a floor. Programmes are built so that coated areas get a ventilation window before staff return, which is one of the reasons weekend work is common for larger floors.',
    audience: 'commercial',
  },
  {
    question: 'Can you paint acoustic tile ceilings and exposed services?',
    answer:
      'Ceiling grid and exposed services can be sprayed. Acoustic tiles themselves are a judgement call: coating them can reduce their acoustic performance, so on a floor where that matters the usual answer is to replace tiles rather than paint them, and to coat the grid instead. It is worth deciding that before the quote rather than after.',
    audience: 'commercial',
  },
  {
    question: 'How long does an office floor take?',
    answer:
      'The driver is how much of the floor can be released at once, not the floor area. A single open floor released entirely over a weekend moves quickly; the same area released as four zones across four weekends takes four times as long in elapsed weeks for the same amount of work. Both are priced at the site assessment so the trade-off is visible before you choose.',
    audience: 'commercial',
  },
] as const;

/**
 * Trade and property maintenance FAQs. The page targets a maintenance query
 * rather than a painting one, so the questions are about scope and
 * coordination rather than about coatings.
 */
export const tradeFaqs: readonly Faq[] = [
  {
    question: 'Why run these trades through the painter rather than separately?',
    answer:
      'Because the handover between trades is where programmes lose time. When a plasterer, a renderer and a painter are engaged separately, each one is only accountable for their own window, and a day lost at the front pushes everything behind it. Under one programme the sequence is a single responsibility, and the client has one number to call when it moves.',
    audience: 'commercial',
  },
  {
    question: 'What has to happen before a wall can be painted?',
    answer:
      'More than most scopes assume. Cracks need cutting out and filling rather than skimming, previous fixings and signage need removing and making good, damaged plaster needs patching and set, and anything previously bare or newly patched needs sealing so the topcoat does not flash. On a tenancy that has been through several fit-outs, that making good is frequently the largest item in the job.',
    audience: 'commercial',
  },
  {
    question: 'Can you quote the repairs separately from the painting?',
    answer:
      'Yes, and for most commercial scopes it is better that way. Repairs and coating are priced as separate lines so a budget holder can see what is remediation and what is finish, and can approve or defer them independently. Unknowns behind a wall are carried as a labelled provisional sum rather than absorbed into a rate.',
    audience: 'commercial',
  },
  {
    question: 'Do you find problems once the surface is opened up?',
    answer:
      'Sometimes, and it is better to expect it than to be surprised by it. Water damage, previous poor repairs, unstable render and rusted fixings are frequently hidden under a coating and only visible once preparation starts. That is why a scope carries provisional sums for the areas that cannot be assessed until they are opened, and why anything found is reported with a price before it is done rather than after.',
    audience: 'commercial',
  },
  {
    question: 'What is not included?',
    answer:
      'Licensed trades outside this scope — electrical, plumbing, structural and waterproofing to wet-area standard — are not carried out under this programme. Where a scope needs them they are identified at the site assessment so they can be engaged in the right order rather than discovered as a stoppage.',
    audience: 'commercial',
  },
] as const;

/**
 * Homepage FAQs.
 *
 * Deliberately a different set of questions from the two above. These are the
 * top-of-funnel ones — asked before a visitor has drilled into a specific
 * service — so the homepage carries its own FAQPage markup without
 * duplicating the commercial pages.
 *
 * Same rule as everywhere else: nothing here asserts a credential, a warranty
 * or a turnaround that has not been verified.
 */
export const homeFaqs: readonly Faq[] = [
  {
    question: 'Will you quote without seeing the site?',
    answer:
      'No. Preparation is the largest variable in a painting job and it cannot be assessed from a photograph or a floor area. Attending first is what stops a quote becoming a variation later.',
    audience: 'commercial',
  },
  {
    question: 'Can you work while the building stays open?',
    answer:
      'That is most of what we do. Schools mid-term, clinics between patients, offices during trading hours, warehouses mid-shift. Work is staged zone by zone or run after hours, areas are isolated and handed back progressively, and the programme is built around your hours rather than ours.',
    audience: 'commercial',
  },
  {
    question: 'Which parts of Melbourne do you cover?',
    answer:
      'Metropolitan Melbourne, worked from our base at Bayswater North. Our documented projects run from Vermont and Noble Park through to Brighton and Glen Iris, and multi-site programmes have covered offices across the metro area. If you are not sure whether you are in range, calling is a faster answer than a form.',
    audience: 'commercial',
  },
  {
    question: 'What paints and materials do you use?',
    answer:
      'Premium-grade systems including Dulux, selected for the substrate and the conditions rather than for the quote. On industrial substrates the existing coating is identified and the surface assessed before anything is specified — concrete, render, colorbond and structural steel each behave differently.',
    audience: 'commercial',
  },
  {
    question: 'Do you handle the work around the painting?',
    answer:
      'Usually, yes. Plastering, patching, rendering, tiling, flooring and making good are frequently needed before a coating can go on. Running them under one programme avoids the gap between trades that stalls a job.',
    audience: 'commercial',
  },
] as const;

export function faqsFor(audience: Audience): Faq[] {
  return faqs.filter((f) => f.audience === audience);
}
