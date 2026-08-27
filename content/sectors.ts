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
      'Painting for Melbourne schools, colleges and childcare centres. Staged around term dates and live campuses by personnel holding Working with Children Checks.',
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
    body: [
      'Schools wear out at hand height. Corridors, hall walls, door frames and locker runs take constant contact all day, and the finish that survives it is a washable, scrubbable system rather than a flat wall paint chosen on colour alone. Specifying by wear zone — durable systems at contact height, standard finishes above — is usually what decides whether a repaint still looks like a repaint three years later.',
      'A two-week term break is about ten working days once access, set-up and pack-down are counted. That is enough for a classroom block or a wing of corridors; it is not enough for a full campus exterior. Larger scopes are normally split across consecutive breaks with each stage handed back complete, so the school never returns to a half-finished building.',
      'Buildings put up before the 1970s can carry lead-based paint under later coats. Where the age of the building makes that plausible, the existing coating is assessed before any sanding or scraping starts, and preparation is planned so dust is contained rather than released across a site children use. That containment is a scheduling question as much as a safety one, because it takes time that has to be in the programme.',
      'Outdoor structures are a separate specification. Play equipment, shade posts, ball walls and line marking face UV, impact and cleaning that interior systems are not built for, and they usually need a protective system rather than a decorative one. Court and playground line marking is also a wear item on its own cycle, not something that renews with the walls.',
    ],
    faqs: [
      {
        question: 'Can painting happen during term time?',
        answer:
          'Some of it. Classroom interiors and anything generating dust or odour are normally sequenced into term breaks. External elevations, fence lines and areas that can be fully isolated from student movement can often run during term with the zone fenced and handed back each day. The split is decided at the site assessment rather than assumed.',
        audience: 'commercial',
      },
      {
        question: 'How do you handle older buildings that may have lead paint?',
        answer:
          'The existing coating is assessed before preparation begins wherever the building’s age makes lead-based paint plausible. If it is present, preparation is planned around containment — controlled removal, sheeting, and waste handled rather than swept up — and that containment time is built into the programme instead of discovered halfway through it.',
        audience: 'commercial',
      },
      {
        question: 'What finish is used in classrooms and corridors?',
        answer:
          'Washable, scrubbable systems in the areas that take contact, which in practice means corridors, hall walls, door frames and anything at hand height. Ceilings and high wall areas do not take the same wear and do not need the same system, so specifying a whole room to the highest grade usually spends money where it will not show.',
        audience: 'commercial',
      },
      {
        question: 'How far ahead should a school book a repaint?',
        answer:
          'Far enough that the scope is agreed before the break rather than during it. The working window is fixed by the calendar, so the site assessment, the written scope and any lead paint assessment need to be finished in advance. The break itself is for painting, not for deciding what is being painted.',
        audience: 'commercial',
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
    body: [
      'Infection control sets the method before anything else does. Preparation that generates dust has to be contained to the work area, the containment has to hold while the rest of the facility keeps operating, and the sequence has to be agreed with whoever owns the facility’s infection prevention plan. In practice that means smaller work zones, more set-up per square metre, and a programme that looks slower on paper than a commercial office of the same floor area.',
      'Coating selection is driven by turnaround rather than appearance. Low-odour, low-VOC systems exist so a consulting room can go back into use quickly, and the number that actually matters is not the drying time but the time until the surface can be cleaned with the disinfectants the facility uses. A surface that is touch-dry is not necessarily ready to be wiped down with a hospital-grade product.',
      'Clinical surfaces are cleaned far more aggressively than domestic ones. Systems specified for these areas need to tolerate repeated disinfection without chalking, yellowing or losing film integrity, particularly at door frames, bed-head walls, corridor rails and anywhere trolleys make contact. Antimicrobial additives are sometimes specified, and it is worth being precise about what they do: they inhibit growth on the coating film itself. They do not replace cleaning and should never be quoted as though they do.',
      'The sequence is built around room availability, not around the building. Consulting rooms, treatment rooms and waiting areas each free up at different times, so the programme is typically a rolling one — a room prepared, coated, cured and handed back before the next is opened — rather than a floor closed for a fortnight.',
    ],
    faqs: [
      {
        question: 'Can you work while the clinic is seeing patients?',
        answer:
          'Usually yes, room by room. The facility nominates which rooms are free and when, and each one is prepared, coated and handed back before the next is opened up. Corridors and waiting areas are more often done after hours, because they cannot be isolated from patient movement while in use.',
        audience: 'commercial',
      },
      {
        question: 'What coatings are suitable for clinical areas?',
        answer:
          'Low-odour, low-VOC systems that tolerate repeated disinfection. The selection is made against the products your facility actually cleans with, because a finish that holds up to a domestic cleaner may chalk or yellow under a hospital-grade disinfectant.',
        audience: 'commercial',
      },
      {
        question: 'How soon can a room be used again after painting?',
        answer:
          'It depends on the system, and the useful question is not when it is dry but when it can be cleaned. Touch-dry can be a matter of hours; full cure, which is what determines when a surface can take disinfection without damage, takes longer. Both figures are given with the quote for the specific system being used.',
        audience: 'commercial',
      },
      {
        question: 'Do you work to our infection control requirements?',
        answer:
          'Yes — the facility’s plan governs the method. Containment, access routes, waste handling and the sequence of handovers are agreed against it before work starts rather than negotiated on site. Personnel working on healthcare sites hold current police checks.',
        audience: 'commercial',
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
    body: [
      'Colour is a clinical consideration in aged care, not only a decorative one. Residents with low vision or dementia rely on luminance contrast to read a space — the difference in lightness between a floor and a wall, a wall and a door frame, a handrail and the surface behind it. A scheme that looks calm on a sample board can remove the very contrast a resident uses to find a doorway, so the contrast between adjacent surfaces is worth checking before the colours are signed off rather than after.',
      'Odour matters more here than almost anywhere else, because residents frequently cannot relocate while an area is worked on. Low-odour systems reduce the problem but do not remove it, so the programme controls the rest of it — small zones, deliberate ventilation, and the strongest-smelling stages timed away from meals and sleep.',
      'Access routes are the constraint that shapes the whole sequence. Residents need level, unobstructed, well-lit paths to their rooms, to dining and to bathrooms at every point in the works. That means drop sheets that do not become trip hazards, no trailing leads across corridors, and equipment stored out of circulation rather than pushed to one side overnight.',
      'Communication is part of the scope. Staff need to know which areas are affected and when so they can prepare residents and answer families, and that is easier to provide as a written stage-by-stage programme up front than as daily updates once the work is already underway.',
    ],
    faqs: [
      {
        question: 'Do residents need to move out?',
        answer:
          'No. The programme is built around residents staying in place: small zones, progressive handover, and level access to rooms, dining and bathrooms maintained throughout. Individual rooms are coordinated with staff so a resident is out of their room only while that room is being worked on.',
        audience: 'commercial',
      },
      {
        question: 'How is paint odour managed?',
        answer:
          'Low-odour systems are specified where residents cannot relocate, and the programme handles the rest — small work zones, deliberate ventilation, and the strongest-smelling stages timed away from meals and sleep.',
        audience: 'commercial',
      },
      {
        question: 'Does colour choice affect residents?',
        answer:
          'Yes, more than most people expect. Luminance contrast between adjacent surfaces — floor to wall, wall to door frame, handrail to wall — is what residents with low vision or dementia use to read a space. It is worth checking a scheme for that contrast before sign-off, because a low-contrast palette can make a corridor genuinely harder to navigate.',
        audience: 'commercial',
      },
      {
        question: 'How much notice do you give before starting an area?',
        answer:
          'A written stage-by-stage programme is provided before work begins, so staff can prepare residents and answer families rather than fielding questions as the work arrives. Personnel working on aged care sites hold current police checks.',
        audience: 'commercial',
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
    body: [
      'A strata quote has a different job from a domestic one: it has to survive a committee meeting. That means scope itemised by area and by system, inclusions and exclusions stated rather than implied, and any unknowns carried as a clearly labelled provisional sum instead of buried in a rate. A single total figure almost always sends the decision back for another round of questions, which costs the building a month.',
      'Exterior repaint cycles are a maintenance-plan question before they are a painting question. Most owners corporations fund exterior works from a sinking or maintenance fund built against an expected cycle, and the real decision is usually whether the building is being repainted on schedule or because a failure has already started. The two lead to different scopes: a scheduled recoat is largely preparation and coating, while a remedial one carries render repair, sealant replacement and rust treatment that need pricing separately.',
      'The common property boundary decides who pays. Lobbies, corridors, stairwells, car parks and the building envelope are normally common property; the inside face of a lot normally is not, and balconies vary by plan. Establishing that line before quoting avoids the situation where works stop because an owner and the committee disagree about who commissioned them.',
      'Residents are the programme’s hardest constraint. Common areas are the routes people use to get home, so they are staged rather than closed, and anything affecting balconies, entries or car park access needs dated notice the manager can circulate. A programme that is right on paper and arrives unannounced generates more complaints than one that takes a week longer.',
    ],
    faqs: [
      {
        question: 'What does a committee need in a painting quote?',
        answer:
          'Scope itemised by area and by coating system so options can be compared like for like, inclusions and exclusions written out, and any unknowns carried as a labelled provisional sum. The aim is a document that can be approved at one meeting rather than returned with questions.',
        audience: 'commercial',
      },
      {
        question: 'Who pays — the owners corporation or the individual owner?',
        answer:
          'It follows the common property boundary in the plan. Lobbies, corridors, stairwells, car parks and the building envelope are normally common property. The inside face of a lot normally is not, and balconies vary by plan. That line is established before quoting, not after works have started.',
        audience: 'commercial',
      },
      {
        question: 'How often should a strata building be repainted externally?',
        answer:
          'It depends on exposure, substrate and the last system used far more than on a fixed number of years. Bayside and west-facing elevations weather faster than sheltered ones. The more useful trigger is condition — chalking, cracking, failed sealant or exposed render — which is why an assessment before budgeting beats a calendar date.',
        audience: 'commercial',
      },
      {
        question: 'How much disruption should residents expect?',
        answer:
          'Common areas are staged rather than closed, so residents keep access throughout. Dated notice is provided in advance for the manager to circulate, covering any period that affects balconies, entries or car park access.',
        audience: 'commercial',
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
    body: [
      'The overnight window is shorter than it sounds. An eight-hour close is realistically five to six hours of work once protection is laid, the space is cleared and everything is packed down and cleaned before open. What fits in that window is decided by drying and recoat times as much as by area, which is why fast-recoat systems are often specified for retail even where a slower product would give a marginally better film.',
      'Centre-managed tenancies come with their own administration. Contractor inductions, after-hours access permits, dock and lift bookings, and in some centres hot works permits all need to be arranged before the first night rather than on it. A tenancy that can be painted in three nights can easily take three weeks to start if that paperwork begins late.',
      'Shopfronts are a coordination job. Painting sits between the shopfitter, the electrician and the signage installer, and the order matters — signage fixed before the fascia is coated leaves a cut line that will always be visible. Agreeing the sequence with the other trades up front is usually worth more to the finish than any product decision.',
      'Retail surfaces take punishment at specific heights. Fitting-room walls, counter fronts, door returns and anything a trolley or a stock cage passes get damaged in the same places in every tenancy, so specifying a harder-wearing system in those zones and a standard one elsewhere gets more life out of the same budget.',
    ],
    faqs: [
      {
        question: 'Can you work overnight so we do not lose trading hours?',
        answer:
          'Yes, and for most retail tenancies that is the default. The floor is protected, worked and cleaned down so it is ready to trade in the morning. The scope for each night is set by recoat times, so the programme is planned around what can be finished and made presentable, not just what can be started.',
        audience: 'commercial',
      },
      {
        question: 'How much can be done in one night?',
        answer:
          'Realistically five to six hours of work in an eight-hour close, once protection and pack-down are counted. The limiting factor is usually drying and recoat time rather than floor area, which is why fast-recoat systems are commonly specified for retail.',
        audience: 'commercial',
      },
      {
        question: 'Do you handle shopping centre inductions and permits?',
        answer:
          'Yes. Inductions, after-hours access permits and dock or lift bookings are arranged before the programme starts. Starting that paperwork late is the most common reason a short retail job takes weeks to begin.',
        audience: 'commercial',
      },
      {
        question: 'How do you coordinate with our shopfitter and signage installer?',
        answer:
          'By agreeing the sequence before anyone starts. Painting has to land in the right place between fit-out and signage — signage fixed before a fascia is coated leaves a visible cut line — so the order is settled at the site assessment.',
        audience: 'commercial',
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
    body: [
      'A venue programme is built backwards from service. The available window is whatever sits between close and setup, and for most venues that is a small-hours block rather than a full day, so scopes are broken into pieces that can each be finished and cleaned within one window. Where a full closure is possible it is almost always cheaper per square metre, which makes it worth pricing both ways before assuming the venue has to stay open.',
      'Kitchens and serveries are a different specification from the front of house. Surfaces there face heat, steam, grease and daily washdown, and need systems that tolerate that rather than a durable interior wall paint. Those areas also have to be cleaned down and formally handed back before food handling resumes, which takes time that belongs in the programme.',
      'Front of house has moved to dark, saturated colours and exposed painted services: black ceilings, ductwork, conduit and structure. Both are more demanding than they look. Deep colours need more coats to reach an even film and show every preparation defect under the low, raking light most venues use, and spraying exposed services means masking everything that is staying, which is usually the larger part of the labour.',
      'External areas carry the venue’s first impression and weather fastest. Al fresco structures, fixed umbrella frames, entry doors and signage surrounds take UV and rain the interior never sees, and they usually sit on a shorter recoat cycle than the rooms behind them.',
    ],
    faqs: [
      {
        question: 'Do we have to close to be painted?',
        answer:
          'Not necessarily, but it is worth pricing both ways. Working around service means small windows between close and setup, which suits a room-by-room scope. A short full closure is almost always cheaper per square metre, so the right answer depends on what a lost trading day costs against the difference in the quote.',
        audience: 'commercial',
      },
      {
        question: 'What is used in the kitchen and servery?',
        answer:
          'Systems specified for heat, steam, grease and daily washdown rather than a standard durable interior paint. Those areas are also isolated, cleaned down and handed back before food handling resumes, and that handover time is written into the programme.',
        audience: 'commercial',
      },
      {
        question: 'Why do dark colours cost more?',
        answer:
          'They need more coats to reach an even film, and they show preparation defects that a light colour hides, particularly under the low, raking lighting most venues use. The extra cost sits in the preparation and the additional coat rather than in the paint.',
        audience: 'commercial',
      },
      {
        question: 'Can you paint exposed ceilings, ductwork and services?',
        answer:
          'Yes, and it is usually sprayed. The work in it is the masking: everything staying has to be protected before anything is applied, and on an exposed-services ceiling that masking is generally a larger part of the labour than the coating.',
        audience: 'commercial',
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
    body: [
      'The fixture list sets the window before anything else does. Most leisure facilities have an off-season or a between-competition period that is the only realistic time for large-surface work, and that window is fixed — it does not move if a scope turns out larger than expected. Scoping accurately matters more here than in almost any other sector, because there is no option to run a week over.',
      'The surfaces are large, high and awkward. Gymnasium ceilings, stadium walls, clubroom exteriors and internal structural steel need access planned area by area rather than one method for the whole building, and the access equipment is frequently the largest single line in the quote. It also determines the sequence, because a scissor lift cannot be in two halls at once.',
      'Wet areas are the part that fails first. Change rooms, shower blocks and poolside surfaces face constant moisture, chlorine or salt and aggressive cleaning, and a standard interior system will not hold there. These areas need moisture-tolerant systems, properly prepared substrates, and attention to where water actually sits — skirtings, junctions and the underside of fixtures.',
      'Line marking runs on its own cycle. Court markings, run-off zones and safety colours wear at a different rate from the walls around them, and they are usually specified, priced and renewed separately rather than assumed to be part of a repaint.',
    ],
    faqs: [
      {
        question: 'When can work happen if the facility cannot close?',
        answer:
          'Off-season windows and between-fixture periods for anything large or high, and evenings or early mornings for smaller zones that can be isolated from member access. Because the window is fixed by the fixture list, the scope has to be accurate before it starts.',
        audience: 'commercial',
      },
      {
        question: 'How do you reach gymnasium ceilings and stadium walls?',
        answer:
          'Access is planned per area rather than per building — scaffolding, scissor lift or EWP depending on the space, the floor loading and what is stored in it. On facilities of this scale access equipment is often the largest single line in the quote, and it also drives the sequence.',
        audience: 'commercial',
      },
      {
        question: 'What is used in change rooms and wet areas?',
        answer:
          'Moisture-tolerant systems over properly prepared substrates. Standard interior paint fails quickly against constant moisture, chlorine or salt and commercial cleaning, and the failure usually starts at skirtings, junctions and under fixtures where water sits.',
        audience: 'commercial',
      },
      {
        question: 'Is line marking included in a repaint?',
        answer:
          'Not by default. Court markings, run-off zones and safety colours wear on a different cycle from the surrounding walls, so they are specified and priced separately rather than assumed into a wall repaint.',
        audience: 'commercial',
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
    body: [
      'Identifying the substrate and the existing coating comes before any specification. Concrete tilt panel, cement render, Colorbond and structural steel behave differently and fail differently, and an older site is frequently carrying two or three previous systems, some of which will not accept a modern topcoat. Coating over an unidentified existing film is the single most common cause of an industrial repaint failing early.',
      'Preparation is matched to what the assessment finds rather than to a default. Hot or cold pressure washing removes contamination and chalk, steam cleaning handles grease, and abrasion or chemical treatment is used where a film has to be keyed or removed. On steel, the standard of preparation determines how long the system lasts more than the product specified over it does.',
      'On industrial substrates the coating is usually doing a protective job rather than a decorative one. Steelwork is being protected from corrosion, concrete from water ingress and carbonation, cladding from UV degradation. That changes what a quote should be compared on — film build and system, not colour and coat count. Melbourne sites near the bay also sit in a more aggressive exposure than inland equivalents, and the specification should reflect it.',
      'Live operations shape the programme more than the painting does. Production runs, dispatch schedules, forklift and truck movement and roof access permits all constrain when an area can be worked, and large-format exteriors are usually staged elevation by elevation so one face is always clear for operations.',
    ],
    faqs: [
      {
        question: 'Can you paint over the existing coating?',
        answer:
          'Only once it has been identified. Older industrial sites frequently carry several previous systems and some will not accept a modern topcoat. Coating over an unidentified film is the most common reason an industrial repaint fails early, so the existing system is assessed before anything is specified.',
        audience: 'commercial',
      },
      {
        question: 'What preparation do industrial substrates need?',
        answer:
          'Whatever the assessment calls for: hot or cold pressure washing for contamination and chalk, steam cleaning for grease, abrasion or chemical treatment where a film needs keying or removing. On steel the standard of preparation determines the life of the system more than the product applied over it does.',
        audience: 'commercial',
      },
      {
        question: 'How should I compare industrial painting quotes?',
        answer:
          'On the system and film build rather than on colour and coat count. A protective specification is doing a measurable job — corrosion protection on steel, water and carbonation resistance on concrete, UV stability on cladding — and two quotes with the same number of coats can be specifying very different levels of protection.',
        audience: 'commercial',
      },
      {
        question: 'Can the facility keep operating?',
        answer:
          'Generally yes. Large-format exteriors are staged elevation by elevation so one face stays clear for operations, and the programme is built around production runs, dispatch and vehicle movement rather than around the painting sequence.',
        audience: 'commercial',
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
