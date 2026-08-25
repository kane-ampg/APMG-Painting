import type { StateKey } from '@/lib/locations/types';

export type Council = {
  name: string;
  state: StateKey;
  /** Dominant commercial building stock. Specific to this council. */
  buildingStock: string;
  /** The operational fact that changes how work is scoped here. */
  note: string;
};

/**
 * Authored once per council, inherited by every suburb in it.
 *
 * This is what makes 1,440 differentiated pages affordable: 45 pieces of real
 * writing instead of 1,440 name-swapped templates. Names match the dataset's
 * `lgaregion` verbatim, parenthesised disambiguators included.
 *
 * Two editorial rules govern this file.
 *
 * 1. No invented specifics. Where a council's planning behaviour is not known
 *    with confidence, the note describes what its building stock and geography
 *    reliably imply instead. A true general observation beats a false precise
 *    one, and a facilities manager will spot a fabricated planning rule.
 * 2. No claimed presence in Queensland. The business has no Queensland address,
 *    projects or phone number. Queensland entries describe the place and how
 *    work is scoped there, never a footprint in it.
 *
 * Ordered by locality count, heaviest first.
 */
export const COUNCILS: readonly Council[] = [
  {
    name: 'Brisbane',
    state: 'QLD',
    buildingStock:
      'Office towers and retail podiums through the CBD, converted brick-and-timber warehousing across Fortitude Valley, Newstead and West End, mid-rise commercial at Milton and Bowen Hills, and large industrial estates at Rocklea, Acacia Ridge, Wacol and Eagle Farm.',
    note: 'A single council covering an entire metropolitan area, so scope varies more within Brisbane than it does between most other councils. Pre-1947 commercial buildings in the inner suburbs sit under character controls that limit what can be altered, and the subtropical climate sets the programme: mould growth on shaded elevations is routine preparation work, and external stages get planned around the summer storm season.',
  },
  {
    name: 'Gold Coast',
    state: 'QLD',
    buildingStock:
      'High-rise strata towers and hotel podiums along the Surfers Paradise and Broadbeach beachfront, low-rise strata and motel frontage through the northern beaches, Southport and Robina office stock, and tilt-panel industrial at Yatala, Molendinar and Burleigh.',
    note: 'Salt-laden onshore wind is the governing exposure condition, so coating selection and preparation matter more than they do inland and maintenance intervals are shorter. Tower work generally means rope access or swing stage, and on strata buildings the programme is set by body corporate approval and levy cycles rather than by the calendar.',
  },
  {
    name: 'Sunshine Coast',
    state: 'QLD',
    buildingStock:
      'Low-rise offices and retail through Maroochydore and its new city centre precinct, hospital and health buildings at Birtinya and Kawana, tourism frontage at Mooloolaba and Caloundra, industrial estates at Kunda Park and Coolum, and timber shopfronts in the hinterland towns.',
    note: 'Building height is modest by comparison with the Gold Coast, so most external work is reachable from scissor and boom lifts rather than swing stage. Trade is strongly seasonal and hospitality repaints get pushed into the shoulder months, while hinterland sites see far higher rainfall than the coastal strip and lose more days to weather.',
  },
  {
    name: 'Scenic Rim',
    state: 'QLD',
    buildingStock:
      'Machinery and hay sheds, packing facilities and saleyards across the Fassifern and Beaudesert farming country, short main-street shopfront runs at Boonah, Beaudesert and Canungra, and tourism accommodation and cellar doors around Tamborine Mountain.',
    note: 'Rural and dispersed, with long distances between townships and very little commercial floor space in any one of them. Travel and mobilisation are a real share of the cost, plant has to be brought in rather than hired nearby, and a rural site cannot be assumed to have three-phase power, mains water or hardstand for a lift.',
  },
  {
    name: 'Moreton Bay',
    state: 'QLD',
    buildingStock:
      'Large-format retail centres and bulky-goods showrooms at North Lakes, Strathpine and Morayfield, newer distribution and light industrial through Brendale and Narangba, aged-care and health facilities, and older beachfront commercial and club buildings on the Redcliffe peninsula.',
    note: 'Most of the commercial stock went up within the last twenty-five years, so the work is planned maintenance recoating rather than remediation of failing older substrates. Brendale and Narangba tenancies run to shift patterns that leave narrow access windows, and the Redcliffe frontage carries salt exposure the inland half of the council does not.',
  },
  {
    name: 'Logan',
    state: 'QLD',
    buildingStock:
      'Tilt-panel distribution warehouses and factory units through Crestmead, Berrinba, Meadowbrook and the Stapylton corridor, suburban office and medical buildings at Springwood and Logan Central, and neighbourhood retail centres across the newer estates.',
    note: 'The industrial stock is overwhelmingly concrete tilt-panel built from the 1990s onward, so external recoating is a boom-lift and spray operation and the binding constraints are truck movements, dock availability and racking that does not come out. Internal work is mostly structural steel and high-bay soffits above live operations.',
  },
  {
    name: 'Ipswich',
    state: 'QLD',
    buildingStock:
      'Nineteenth-century two-storey masonry commercial frontage through the Ipswich CBD and Brisbane Street, substantial civic and institutional buildings, and newer tilt-panel industrial and distribution estates at Carole Park, Redbank and Swanbank.',
    note: 'One of the oldest commercial centres in the state, so CBD frontage carries render, masonry and joinery that needs repair before any coating goes on, and pre-1970 layers should be assumed to contain lead until tested. Low-lying frontage near the Bremer has been through repeated flooding, and ground-floor tenancies are often on their third or fourth fit-out.',
  },
  {
    name: 'Redland',
    state: 'QLD',
    buildingStock:
      'Neighbourhood retail centres and small offices at Cleveland, Capalaba and Victoria Point, marine and boat-building sheds around Raby Bay and Redland Bay, light industrial at Capalaba, and low-rise commercial and accommodation on the bay islands.',
    note: 'Several localities in this council sit on islands reached only by ferry or barge, so materials, plant and access equipment have to be booked onto barge runs and cannot be swapped out mid-job. Bay-front and marine buildings take constant salt exposure, and boatyard sites bring containment requirements of their own.',
  },
  {
    name: 'Noosa',
    state: 'QLD',
    buildingStock:
      'Hospitality and boutique retail frontage along Hastings Street, low-rise offices and strata accommodation at Noosa Junction and Noosaville, service and light industrial units in the Noosaville estates, and timber shopfronts at Cooroy, Pomona and the hinterland villages.',
    note: 'Height and design controls here are stricter than anywhere else on this coast, and colour is treated as part of that: muted, low-reflectance schemes that sit against bushland are the expectation rather than a preference, so colour selection can become a planning question. Hospitality trade is intensely seasonal and repaints get compressed into short closure windows.',
  },
  {
    name: 'Gympie',
    state: 'QLD',
    buildingStock:
      'Gold-era two-storey masonry shopfronts with street awnings along the Mary Street commercial strip, plus dairy, timber and machinery sheds, saleyards and small-town retail across the surrounding hinterland.',
    note: 'The main commercial streetscape is nineteenth-century masonry and rendered brickwork with verandah structures over the footpath, which makes access as much a traffic and pedestrian management problem as a painting one. The Mary River floods hard and often, and ground-floor tenancies on the low side of town get repainted on a far shorter cycle than the floors above them.',
  },
  {
    name: 'Somerset',
    state: 'QLD',
    buildingStock:
      'Meat and food processing plant, grain and machinery sheds, dairy infrastructure, showground and hall buildings, and brief main-street shopfront runs at Esk, Kilcoy, Lowood and Toogoolawah.',
    note: 'Food processing is the dominant industry, which means washdown-durable coatings, hygiene-appropriate systems in production areas and work programmed into plant shutdowns rather than around trading hours. Beyond those plants the shire is thinly settled farming country where a single job rarely justifies a second mobilisation.',
  },
  {
    name: 'Cardinia',
    state: 'VIC',
    buildingStock:
      'Newer industrial and large-format retail through Pakenham and Officer, childcare, medical and aged-care buildings across the growth estates, vegetable packing and cool-store facilities on the Koo Wee Rup flats, and small township retail at Emerald, Cockatoo and Bunyip.',
    note: 'Sharply split between a growth corridor where almost nothing is older than twenty-five years and a rural east where buildings are smaller, older and a long drive apart. In the corridor much of the work is defect and handover repainting inside developer warranty periods; in the hills, set-up on steep treed sites takes longer than the coating.',
  },
  {
    name: 'Brimbank',
    state: 'VIC',
    buildingStock:
      'Mid-century steel-framed manufacturing sheds through Sunshine, Braybrook and Tottenham, large modern distribution warehousing at Derrimut and Ravenhall, the Sunshine interwar retail strip and civic buildings, and hospital and education facilities at St Albans.',
    note: 'A long manufacturing history means much of the industrial stock predates 1990, with original galvanised sheet, structural steel and bonded asbestos-cement cladding still in service. That governs what preparation is permitted and how it has to be done, and it is the single biggest variable between an accurate price here and a guess.',
  },
  {
    name: 'Yarra Ranges',
    state: 'VIC',
    buildingStock:
      'Industrial and trade estates at Lilydale, Kilsyth and Bayswater North, showroom and bulky-goods frontage along the Maroondah Highway at Chirnside Park, hills township shopfronts with timber verandahs at Belgrave, Monbulk and Healesville, and winery and cellar-door buildings through the valley.',
    note: 'Two different jobs inside one council. The valley floor is conventional industrial and retail work; above it, hills sites are steep, treed and short of hardstand, so scaffold and lift placement drives the programme. Timber in a cool, wet, shaded setting fails earlier than the same detail on the plains, and remedial carpentry is usually part of the scope.',
  },
  {
    name: 'Nillumbik',
    state: 'VIC',
    buildingStock:
      'Small-scale retail and professional suites at Eltham, Diamond Creek and Hurstbridge, schools, community halls and sporting pavilions, winery and function buildings, and the mud-brick and timber-clad buildings the shire is known for.',
    note: 'Most of the shire is green wedge with very little commercial floor space, so the work is schools, community buildings and modest township frontage rather than offices or warehouses. Timber and earth-wall substrates need breathable systems and careful product selection, and sites are scattered along long, narrow, unlit rural roads.',
  },
  {
    name: 'Kingston (Vic.)',
    state: 'VIC',
    buildingStock:
      'Established industrial estates through Moorabbin, Braeside and Clayton South, the Moorabbin Airport business and bulky-goods park, Nepean Highway showroom frontage, and bayside retail strips at Mentone, Mordialloc and Chelsea.',
    note: 'The industrial belt is largely 1960s to 1980s brick and metal-clad units subdivided into multiple tenancies, so scope gets negotiated tenancy by tenancy around businesses that keep trading and share one driveway. Closer to the water, the retail strips take salt and wind on their western elevations and need shorter maintenance intervals.',
  },
  {
    name: 'Boroondara',
    state: 'VIC',
    buildingStock:
      'Victorian and interwar shopfront rows through Camberwell, Hawthorn, Kew and Balwyn, mid-rise office stock around Camberwell Junction, large independent school campuses, and consulting and medical suites converted from older buildings along Burwood and Whitehorse Roads.',
    note: 'One of the most heavily heritage-overlaid municipalities in metropolitan Melbourne. An exterior colour change on a contributory building can require a planning permit, and that has to sit in the programme from the start rather than be discovered once the scaffold is up. Footpath and lane occupation on the busier strips needs its own consent.',
  },
  {
    name: 'Frankston',
    state: 'VIC',
    buildingStock:
      'Frankston CBD offices and the hospital and health precinct, Nepean Highway retail and showrooms, established light industrial estates at Carrum Downs and Seaford, and foreshore hospitality and club buildings.',
    note: 'Carrum Downs and Seaford are owner-occupier light industrial where the operator is on site every day and work has to fit around production rather than the other way around. The CBD and foreshore buildings face open water to the west and take the full weather, which shows first on exposed parapets and window joinery.',
  },
  {
    name: 'Glen Eira',
    state: 'VIC',
    buildingStock:
      'Continuous strip retail along Glen Huntly, Centre and Hawthorn Roads, walk-up 1960s and 1970s brick offices and medical suites above shops, school and community facilities, and the buildings around the Caulfield racecourse and campus precinct.',
    note: 'There is almost no industrial land in this council, so nearly all work is street-front retail and small suites above it. That turns the programme into a traffic and pedestrian problem: footpath occupation, trading-hours restrictions and rear-lane access govern when anything can happen, and most of it runs early morning.',
  },
  {
    name: 'Casey',
    state: 'VIC',
    buildingStock:
      'Industrial and warehouse estates at Hallam and Lynbrook, the Fountain Gate large-format retail precinct, the Berwick health and education precinct, and a steady supply of new childcare, medical and town-centre buildings through Cranbourne and Clyde.',
    note: 'One of the most populous councils in the country and one of the youngest building stocks, with the great majority of commercial floor space built since 1990. Work is cyclical maintenance and tenancy repainting on sound modern substrates, and the constraint is usually a centre’s trading hours rather than the condition of the building.',
  },
  {
    name: 'Darebin',
    state: 'VIC',
    buildingStock:
      'Retail strips along High Street and Plenty Road, interwar brick factories converted to studio, office and hospitality use through Thornbury and Preston, the Preston Market surrounds, the Northland centre, and pockets of working light industrial at Reservoir.',
    note: 'A large share of the floor space here is former manufacturing brick reused as office and creative space, often with tenants in place and exposed masonry and structure serving as the finish. The main frontages are tram routes under clearway hours, so plant cannot simply sit at the kerb and external work runs outside those hours.',
  },
  {
    name: 'Moreland',
    state: 'VIC',
    buildingStock:
      'The Sydney Road retail spine, former textile and manufacturing warehouses in Brunswick now used as studios, offices and hospitality, Coburg civic and retail buildings, and light industrial strung along the Upfield rail corridor.',
    note: 'Sydney Road is narrow, tram-served and under clearway restrictions for much of the day, which makes access rather than area the binding constraint on any frontage job. Much of the brick warehouse stock has been painted over repeatedly, so existing coating history dictates the system far more than a colour preference does.',
  },
  {
    name: 'Monash',
    state: 'VIC',
    buildingStock:
      'Technology and research office parks around Clayton, Mulgrave and Notting Hill, laboratory and health buildings in the Clayton medical precinct, business-park offices along Ferntree Gully and Springvale Roads, the Oakleigh retail strip, and older light industrial at Clayton South.',
    note: 'A high proportion of the floor space is laboratory, clinical or technology tenancy where equipment cannot be shut down and air handling is shared between suites. Low-odour and low-VOC systems, staged zone isolation and out-of-hours application are the default expectation rather than an upgrade, and they change both method and duration.',
  },
  {
    name: 'Hume',
    state: 'VIC',
    buildingStock:
      'Very large freight and distribution warehousing through Somerton, Campbellfield and the airport corridor, older automotive and heavy manufacturing plant at Broadmeadows, airport-adjacent hotels and offices at Tullamarine, and the newer Craigieburn town centre.',
    note: 'Freight and airport-adjacent sites run around the clock, so access windows are short, site inductions are mandatory and escorted access is common. Warehouse interiors are large-span and high, which puts most internal work on boom lifts and spray rather than brush and roller, with forklift and truck traffic the main safety control.',
  },
  {
    name: 'Whitehorse',
    state: 'VIC',
    buildingStock:
      'The Box Hill office, hospital and education cluster holding the tallest commercial towers in Melbourne’s east, the Whitehorse Road showroom and bulky-goods belt through Nunawading and Forest Hill, light industrial at Blackburn, and the Deakin Burwood campus.',
    note: 'Box Hill is dense and vertical, so exterior work there means swing stage or rope access under building management, permit and after-hours rules a suburban job never carries. A few kilometres east the same council is single-storey showroom frontage trading seven days, with large glazing and constant customer movement.',
  },
  {
    name: 'Banyule',
    state: 'VIC',
    buildingStock:
      'The Heidelberg hospital and consulting-suite precinct, interwar retail frontage at Ivanhoe and Rosanna, the Greensborough town centre, education and business-park buildings at Bundoora, and post-war light industrial at Heidelberg West.',
    note: 'Health buildings dominate the commercial floor space, and hospital work is scoped around continuous operation: zone isolation, dust and odour control, staged handback and after-hours application belong in the base scope rather than arriving as variations. The older strip frontage nearby is narrow-fronted with rear-lane-only access.',
  },
  {
    name: 'Manningham',
    state: 'VIC',
    buildingStock:
      'Mid-rise office and mixed-use buildings on Doncaster Hill, the Westfield Doncaster centre, neighbourhood retail at Templestowe Village and Bulleen, medical suites along Doncaster Road, and timber township frontage at Warrandyte.',
    note: 'There is essentially no industrial land, so the stock is offices, retail and community buildings. Much of it sits on the steep ground above the Yarra, where establishing safe scaffold footings and getting a lift onto a sloping site regularly takes longer than the painting itself and has to be priced that way.',
  },
  {
    name: 'Port Phillip',
    state: 'VIC',
    buildingStock:
      'Victorian and Edwardian shopfront and hotel frontage through St Kilda, South Melbourne and Albert Park, converted brick warehousing at Port Melbourne and South Melbourne, the Fishermans Bend industrial and renewal precinct, and foreshore hospitality pavilions.',
    note: 'Heritage frontage and direct bay exposure in the same building. Salt-laden westerlies strip coatings off exposed parapets and joinery faster than on an inland equivalent, and those are frequently the same elevations carrying permit and colour constraints, so a specification here has to satisfy durability and approval at once.',
  },
  {
    name: 'Bayside (Vic.)',
    state: 'VIC',
    buildingStock:
      'Retail and professional-suite strips along Church Street Brighton, Bay Street and Hampton Street, mid-century modernist commercial and community buildings around Beaumaris, and foreshore yacht, surf and sporting club pavilions.',
    note: 'Almost entirely street-front retail and small suites with no industrial land at all, so work runs across trading hours on footpath permits and short daily set-ups. The foreshore band takes salt and unshaded UV, and the mid-century buildings around Beaumaris often retain original substrates and detailing that limit how aggressive preparation can be.',
  },
  {
    name: 'Whittlesea',
    state: 'VIC',
    buildingStock:
      'The Cooper Street and Thomastown industrial estates with their heavy food-handling and cold-storage tenancies, the wholesale market complex at Epping, the Northern Hospital precinct, and new town-centre and childcare buildings across Mernda, Doreen and South Morang.',
    note: 'Food and cold-storage tenancies set the standard here: hygiene-appropriate systems in production and chill areas, and work programmed into shutdowns because temperature and cleanliness cannot lapse for a coating. The northern growth estates are the opposite problem, brand-new stock where scope is defect rectification inside a warranty period.',
  },
  {
    name: 'Maroondah',
    state: 'VIC',
    buildingStock:
      'The Eastland retail precinct and the office buildings around Ringwood station, the Croydon town centre, light industrial estates at Croydon South and Bayswater North, and car dealerships and showrooms along the Maroondah Highway.',
    note: 'The industrial estates are 1970s and 1980s brick and metal-clad units on small lots with tight yards, so a lift often cannot be positioned without partly closing a neighbour’s access. That coordination sits with more parties than the client alone, and it is the usual reason a straightforward job here runs longer than expected.',
  },
  {
    name: 'Melbourne',
    state: 'VIC',
    buildingStock:
      'CBD office towers, lobbies and retail podiums, Docklands and Southbank high-rise, nineteenth-century masonry laneway buildings and corner hotels, the Parkville hospital and university precinct, and converted warehousing at Kensington and North Melbourne.',
    note: 'Inside the city the paint is rarely the hard part. Loading dock and lift bookings, building management inductions, hoarding and street occupation consents and strict after-hours noise limits decide what a shift can achieve, and the older frontages carry so many previous coating layers that adhesion testing is worth doing before anything is specified.',
  },
  {
    name: 'Yarra',
    state: 'VIC',
    buildingStock:
      'Victorian brick warehouses and factories converted to office and studio use through Cremorne, Collingwood and Abbotsford, the Smith, Brunswick and Swan Street retail strips, corner hotels, and the Richmond office cluster.',
    note: 'Dense inner-city fabric with narrow one-way streets, shared party walls and almost no on-site parking, so nearly every external job needs a footpath or lane occupation permit and an approved scaffold plan before materials are ordered. Rear elevations are frequently reachable only through a neighbouring property.',
  },
  {
    name: 'Moonee Valley',
    state: 'VIC',
    buildingStock:
      'Puckle Street and Mount Alexander Road retail and office frontage, showroom and bulky-goods buildings at Airport West and Niddrie, racecourse and showgrounds event buildings, medical suites around Essendon, and light industrial in the north of the council.',
    note: 'The large event venues here run to a fixed calendar, which means hard immovable completion dates and no option to carry work past a race or show date. Everything else is strip frontage on busy arterials where the working day is bounded by clearway hours and whatever kerbside space can be secured.',
  },
  {
    name: 'Maribyrnong',
    state: 'VIC',
    buildingStock:
      'Older brick commercial and civic buildings through central Footscray, the university and hospital precinct, logistics and transport sheds at Tottenham and West Footscray, the Highpoint retail centre, and small shopfront strips at Yarraville and Seddon.',
    note: 'West of the river the industrial stock sits in a heavy-transport corridor, and surfaces carry a film of road dust and diesel residue that has to be properly washed down before any system will hold. Yards stay in use by trucks throughout, so exclusion zones move daily instead of being set once and left.',
  },
  {
    name: 'Stonnington',
    state: 'VIC',
    buildingStock:
      'Chapel Street and High Street retail frontage, Victorian and Edwardian shopfronts with ornate parapets and cast-iron verandahs, professional and medical suites along Toorak and Malvern Roads, and boutique office buildings around South Yarra.',
    note: 'Heavily heritage-overlaid, and on the main retail streets a change of colour, signage or finish to a heritage frontage is often a planning matter before it is a painting one. Those strips also trade late into the evening, so preparation runs early morning, and the parapet detailing is slow hand-applied work that resists any shortcut.',
  },
  {
    name: 'Knox',
    state: 'VIC',
    buildingStock:
      'The Bayswater and Scoresby manufacturing estates of older factory units on small lots, the Knox Ozone and Westfield retail precinct, logistics and warehousing at Rowville, and Stud Road showroom frontage.',
    note: 'Bayswater is one of the denser surviving light-manufacturing pockets in metropolitan Melbourne, and most internal work happens in workshops that keep running. Containment and masking around machinery, stock and finished product is a larger part of the job than the coating, and overspray risk usually decides whether spray application is allowed at all.',
  },
  {
    name: 'Hobsons Bay',
    state: 'VIC',
    buildingStock:
      'Petrochemical, refining and heavy industrial plant around Altona and Brooklyn, container and logistics yards, the nineteenth-century Nelson Place commercial frontage and dockyard buildings at Williamstown, and the rail workshops at Newport.',
    note: 'Heavy industrial sites here carry permit-to-work systems, hot-work controls and confined-space entry, and induction can take longer than a small job itself. Exposure combines salt off the bay with industrial fallout, so on any external scope preparation typically outweighs application in both hours and cost.',
  },
  {
    name: 'Wyndham',
    state: 'VIC',
    buildingStock:
      'Large modern distribution warehousing through Laverton North, the Werribee town centre and hospital, neighbourhood retail and medical buildings at Point Cook and Williams Landing, and market-garden and packing infrastructure at Werribee South.',
    note: 'Laverton North is tilt-panel logistics at scale, where external recoating is a boom-lift and airless-spray operation over very large uninterrupted elevations and the real constraint is truck movement through the yard. Wind off the western plains is the other one: spray days are lost to it more often than to rain.',
  },
  {
    name: 'Murrindindi',
    state: 'VIC',
    buildingStock:
      'Small township main streets and community halls, timber-industry and sawmill sheds, agricultural machinery and hay sheds, tourism accommodation and cellar doors, and emergency-services and school buildings scattered through forested country.',
    note: 'Rural, forested and thinly populated, with long distances between the few commercial buildings that exist. A significant share of the stock was rebuilt after the 2009 fires and is unusually new for a shire of this kind, while the rest is weatherboard and steel in a cold, wet, heavily shaded setting that shortens every coating interval.',
  },
  {
    name: 'Greater Dandenong',
    state: 'VIC',
    buildingStock:
      'Tilt-slab warehousing and factory units across the Dandenong South estate, older brick-and-render showroom and workshop frontage along Princes Highway and Cheltenham Road, and the Dandenong and Springvale retail centres.',
    note: 'Victoria’s largest concentration of manufacturing floor space. Most work here is scoped around production that does not stop, so night and weekend access is normal rather than exceptional, and coating selection is driven by wash-down regimes, chemical splash and forklift impact rather than by appearance.',
  },
  {
    name: 'Mornington Peninsula',
    state: 'VIC',
    buildingStock:
      'Main Street Mornington and the Sorrento limestone commercial frontage, foreshore hospitality and accommodation, winery and cellar-door buildings through Red Hill and Merricks, the Hastings port and industrial area, and light industrial at Somerville and Mornington.',
    note: 'Trade is sharply seasonal, so hospitality and retail repainting gets pushed into winter, which is also the coldest and wettest part of the year and the worst time to be coating anything outside. Southern and western frontages take salt and driving rain head-on, and an unsuitable system there fails in a fraction of its rated life.',
  },
  {
    name: 'Baw Baw',
    state: 'VIC',
    buildingStock:
      'Dairy and vegetable processing plant, cool stores and packing sheds through the West Gippsland farming country, machinery and hay sheds, saleyard infrastructure, and short main-street retail runs in the townships.',
    note: 'Food and dairy processing anchors the local economy, which means washdown-durable systems, hygiene-appropriate finishes in production areas, and work scheduled around intake and processing cycles that cannot be paused. High rainfall and cold winters also compress the external painting season into a narrower window than metropolitan Melbourne gets.',
  },
  {
    name: 'Mitchell',
    state: 'VIC',
    buildingStock:
      'Nineteenth-century main-street shopfronts at Kilmore, Broadford and Seymour, agricultural and machinery sheds across the grazing country, transport and service buildings along the Hume corridor, and new town-centre and childcare buildings at Wallan and Beveridge.',
    note: 'The council splits along the freeway. Its southern end is absorbing metropolitan growth and the stock there is barely a decade old; the northern townships are verandahed masonry recoated many times over, where the existing layers need assessing first. The distance between the two ends is enough that one job rarely justifies two mobilisations.',
  },
  {
    name: 'Melton',
    state: 'VIC',
    buildingStock:
      'Very large new distribution and warehousing estates at Truganina and Ravenhall, the Caroline Springs and Woodgrove town centres, service and trade buildings along the Western Freeway corridor, and the older Melton main street.',
    note: 'One of the fastest-growing councils in the country, and the commercial stock reflects it: mostly under twenty years old, mostly concrete tilt-panel, and mostly still on its first or second coating. Work is dominated by very large plain elevations where rig-up efficiency and wind management matter more than intricate preparation.',
  },
] as const;

const byName = new Map(COUNCILS.map((c) => [c.name, c]));

export function getCouncil(name: string): Council | undefined {
  return byName.get(name);
}
