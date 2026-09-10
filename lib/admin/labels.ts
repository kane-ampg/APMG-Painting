/**
 * What an editor calls each field.
 *
 * Nothing in the editor may show a code name. Every field an editor can see
 * is named here, keyed by collection and then by field path — nested fields
 * use a dotted path (`address.street`), because a field only knows its own
 * key. `labelFor` falls back to a humanised key so a field added to a schema
 * without a label here still reads as English rather than as code, but that
 * is a safety net, not the plan: tests/unit/admin-pages.test.ts fails when a
 * schema field has no entry.
 */

export type FieldLabel = { label: string; help?: string };

type LabelMap = Record<string, FieldLabel>;

const projects: LabelMap = {
  slug: {
    label: 'Web address',
    help: 'The last part of the link, e.g. /projects/emmaus-college/. Changing it changes the link.',
  },
  title: { label: 'Project title' },
  clientOrPropertyType: {
    label: 'Client or property type',
    help: 'Shown in the details panel beside the write-up.',
  },
  location: { label: 'Suburb', help: 'Shown above the title on the project card and page.' },
  sectorSlug: { label: 'Sector', help: 'Which sector page lists this project as evidence.' },
  initialCondition: { label: 'Condition before we started' },
  challenge: {
    label: 'The challenge',
    help: 'One paragraph. Also used as the summary under the title on project cards.',
  },
  scopeOfWork: { label: 'Scope of work' },
  preparation: { label: 'Preparation' },
  coatingSystem: { label: 'Coating system' },
  accessAndSafety: { label: 'Access and safety' },
  schedulingConstraints: { label: 'Site constraints' },
  duration: { label: 'How long it took' },
  images: {
    label: 'Photographs',
    help: 'The first photograph is the cover used on cards and at the top of the page.',
  },
  outcome: { label: 'Outcome' },
  testimonial: { label: 'Testimonial' },
  'testimonial.quote': { label: 'What they said' },
  'testimonial.attribution': { label: 'Who said it' },
  'testimonial.role': { label: 'Their role' },
  'testimonial.organisation': { label: 'Their organisation' },
  relatedServiceSlugs: { label: 'Related services' },
  relatedLocationSlugs: { label: 'Nearby suburbs' },
  isFeatured: {
    label: 'Show as a featured case study',
    help: 'Featured projects appear on the homepage and at the top of the projects page.',
  },
};

const services: LabelMap = {
  slug: { label: 'Web address', help: 'Used in links to this service. Changing it changes them.' },
  title: { label: 'Service title' },
  shortTitle: { label: 'Short name', help: 'Used in menus and narrow spaces.' },
  audience: { label: 'Audience' },
  summary: { label: 'Summary', help: 'One or two sentences, shown on the service card.' },
  body: { label: 'Full description', help: 'One paragraph per item.' },
  includes: { label: 'What it includes', help: 'The first four appear as chips on the card.' },
  image: { label: 'Card photograph' },
};

const posts: LabelMap = {
  slug: { label: 'Web address', help: 'The last part of the link, e.g. /blog/how-we-quote/.' },
  title: { label: 'Headline' },
  excerpt: { label: 'Summary', help: 'Shown on the blog index and used as the sharing text.' },
  body: { label: 'Article', help: 'Plain text. Markdown gives you headings, lists and links.' },
  cover: { label: 'Cover photograph' },
  publishedAt: { label: 'Published on' },
  updatedAt: { label: 'Last updated' },
  author: { label: 'Author' },
  tags: { label: 'Tags' },
  metaTitle: { label: 'Search result title', help: 'What Google shows as the blue link.' },
  metaDescription: { label: 'Search result description' },
};

const settings: LabelMap = {
  phone: {
    label: 'Phone number',
    help: 'Shown in the header, the footer and every call to action.',
  },
  email: { label: 'Email address' },
  address: { label: 'Street address' },
  'address.street': { label: 'Street' },
  'address.suburb': { label: 'Suburb' },
  'address.state': { label: 'State' },
  'address.postcode': { label: 'Postcode' },
  'address.country': { label: 'Country' },
  'address.effectiveFrom': {
    label: 'Occupied from',
    help: 'Leave empty if we are already there. A date here tells the site the move is coming.',
  },
  abn: { label: 'ABN' },
  coords: { label: 'Map coordinates' },
  'coords.latitude': { label: 'Latitude' },
  'coords.longitude': { label: 'Longitude' },
  openingHours: {
    label: 'Opening hours',
    help: 'Leave empty rather than guessing — invented hours send people to a closed office.',
  },
  'openingHours.days': { label: 'Days', help: 'One day per line, e.g. Monday.' },
  'openingHours.opens': { label: 'Opens', help: '24-hour time, e.g. 07:00.' },
  'openingHours.closes': { label: 'Closes', help: '24-hour time, e.g. 17:00.' },
  serviceAreaPrimary: { label: 'Main service area' },
  social: { label: 'Social profiles' },
  'social.instagram': { label: 'Instagram' },
  'social.facebook': { label: 'Facebook' },
  'social.google': { label: 'Google Business Profile' },
};

const pages: LabelMap = {
  slug: { label: 'Web address' },
  title: { label: 'Page heading' },
  lede: { label: 'Introduction', help: 'The paragraph under the heading.' },
  formHeading: { label: 'Form heading' },
  formIntro: { label: 'Form introduction' },
  metaTitle: { label: 'Search result title', help: 'What Google shows as the blue link.' },
  metaDescription: { label: 'Search result description' },
};

export const labels: Record<string, LabelMap> = { projects, services, posts, settings, pages };

/**
 * Fields an editor rarely touches, and that break links or listings when they
 * are touched carelessly. They sit in a collapsed group at the bottom of the
 * form rather than being hidden, because an editor who does need one has
 * nowhere else to go.
 */
export const advancedFields: Record<string, readonly string[]> = {
  projects: ['slug', 'sectorSlug', 'relatedServiceSlugs', 'relatedLocationSlugs', 'isFeatured'],
  services: ['slug', 'audience'],
  posts: ['slug', 'tags', 'publishedAt', 'updatedAt'],
  settings: ['coords'],
  pages: [],
};

/** "metaDescription" -> "Meta description". Never leaves a code name on screen. */
export function humanise(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .toLowerCase()
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function labelFor(collection: string, path: string): FieldLabel {
  return labels[collection]?.[path] ?? { label: humanise(path.split('.').pop() ?? path) };
}

export function isAdvanced(collection: string, name: string): boolean {
  return (advancedFields[collection] ?? []).includes(name);
}
