import type { Faq } from '@/lib/content/types';

/**
 * FAQs.
 *
 * Split by audience so the commercial and residential journeys answer the
 * questions their own visitors actually ask. Only answers that reflect what
 * APMG demonstrably does are included — nothing here asserts a credential or a
 * guarantee that has not been verified.
 */
export const faqs: readonly Faq[] = [
  // --- Commercial -------------------------------------------------------
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

  // --- Residential ------------------------------------------------------
  {
    question: 'How long will my house take?',
    answer:
      'It depends on the size of the property, the condition of the surfaces and how much preparation is needed. We give you an expected duration with your quote, after we have seen the property.',
    audience: 'residential',
  },
  {
    question: 'Do I need to move out?',
    answer:
      'For most interior work, no. We stage the job room by room and protect flooring, furniture and fittings as we go, so you keep using the rest of the house.',
    audience: 'residential',
  },
  {
    question: 'Can you help with colour selection?',
    answer:
      'Yes. Matching new paint to existing decor is where most colour decisions go wrong, so we walk through the selection with you rather than handing over a chart.',
    audience: 'residential',
  },
  {
    question: 'What preparation is included?',
    answer:
      'Preparation is the part that decides how the finish holds up — filling, sanding, sealing and masking are included as standard, and the specific preparation for your surfaces is set out in your quote.',
    audience: 'residential',
  },

  // --- Both -------------------------------------------------------------
  {
    question: 'Which areas of Melbourne do you cover?',
    answer:
      'We work across metropolitan Melbourne from our base at Chirnside Park. If you are unsure whether your property is within range, call and ask — it is a quicker answer than a form.',
    audience: 'both',
  },
] as const;

export function faqsFor(audience: 'residential' | 'commercial'): Faq[] {
  return faqs.filter((f) => f.audience === audience || f.audience === 'both');
}
