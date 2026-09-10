import { cache } from 'react';
import { sectors } from '@/content/sectors';
import type { Collection } from '@/lib/content/schemas';
import { getPosts, getProjects, getServices, getSiteSettings } from '@/lib/content/source';
import type { MediaRef } from '@/lib/content/types';
import { imageSourcesIn } from '@/lib/media/local-library';
import { brandLogoPath } from '@/lib/schema';
import { accreditations, site } from '@/lib/site';

/**
 * The public site, as the editor sees it.
 *
 * Every public page is one entry here, and every entry lists the sections of
 * that page in the order they appear on it. The map is written by hand
 * against `app/(site)/**` rather than derived from the components, because a
 * section's *editability* is not something a component knows: three of the
 * homepage's sections read from collections, and the rest are copy that lives
 * in code. tests/unit/admin-pages.test.ts fails if a public route is added
 * without a page here.
 *
 * Sections are never added, removed or reordered by an editor (spec §5). This
 * file is the layout; the CMS only fills it in.
 */

export const FIXED_NOTE = 'Fixed copy — ask the developer to change this';

/** components/layout/footer.tsx places this; the header places brandLogoPath. */
const FOOTER_LOGO = '/images/brand/apmg-logo-white.webp';

/** The sectors a project can be filed under, named the way an editor knows them. */
export function sectorOptions(): { value: string; label: string }[] {
  return sectors.map((sector) => ({ value: sector.slug, label: sector.shortTitle }));
}

export type SectionFieldGroup = { heading: string; fields: readonly string[] };

export type PageSection =
  /**
   * Copy that lives in code. Shown so the editor sees the whole page.
   * `images` names any photograph the section places from the page's own
   * source, so the media library can still say where that file is used.
   */
  | { id: string; heading: string; kind: 'fixed'; detail: string; images?: readonly string[] }
  /** Several entries of one collection, each editable in place. */
  | {
      id: string;
      heading: string;
      kind: 'entries';
      collection: Collection;
      slugs: readonly string[];
      fields: readonly string[];
      detail?: string;
    }
  /** One entry, the whole page's subject. */
  | {
      id: string;
      heading: string;
      kind: 'entry';
      collection: Collection;
      slug: string;
      fields: readonly string[];
      groups?: readonly SectionFieldGroup[];
      advanced?: readonly string[];
      detail?: string;
    }
  /** Business details, edited in one place and shown on many pages. */
  | { id: string; heading: string; kind: 'settings'; fields: readonly string[]; detail?: string };

export type AdminPage = {
  id: string;
  title: string;
  path: string;
  hero?: MediaRef;
  sections: readonly PageSection[];
};

const SERVICE_CARD_FIELDS = ['image', 'title', 'summary', 'includes'] as const;
/**
 * What a project card actually shows an editor worth changing: the cover
 * photograph and the title. The suburd, the summary and the rest of the
 * gallery belong to the project's own page, where the whole case study is in
 * front of them.
 */
const PROJECT_CARD_FIELDS = ['images', 'title'] as const;

const CTA_SECTION: PageSection = {
  id: 'cta',
  heading: 'Call to action',
  kind: 'settings',
  fields: ['phone'],
  detail: 'The heading and wording are code. The phone number comes from the business details.',
};

const TRUST_BAR: PageSection = {
  id: 'trust-bar',
  heading: 'Accreditations strip',
  kind: 'fixed',
  detail: 'Master Painters Australia, Dulux Accredited Painter, Cm3 and Haymes.',
};

/** Every static public route, in the order the top bar and the list use. */
export const staticPagePaths = [
  '/',
  '/commercial/',
  '/office-painters/',
  '/trade-services/',
  '/about-us/',
  '/contact-us/',
  '/projects/',
  '/areas/',
  '/blog/',
] as const;

function homePage(services: { slug: string }[], featured: { slug: string }[]): AdminPage {
  return {
    id: 'home',
    title: 'Home',
    path: '/',
    hero: {
      src: '/images/hero/banner-poster.webp',
      alt: 'Melbourne from the air over Docklands, looking across the Yarra to the CBD skyline',
    },
    sections: [
      {
        id: 'hero',
        heading: 'Hero',
        kind: 'fixed',
        detail: 'Video banner, headline and the three figures beneath it.',
      },
      TRUST_BAR,
      {
        id: 'facts',
        heading: 'The figures',
        kind: 'fixed',
        detail: 'Years trading, experience, sectors and the warranty.',
      },
      {
        id: 'services',
        heading: 'What we paint',
        kind: 'entries',
        collection: 'services',
        slugs: services.map((service) => service.slug),
        fields: [...SERVICE_CARD_FIELDS],
        detail: 'One card per service. The first four items of the list show as chips on the card.',
      },
      {
        id: 'sectors',
        heading: 'Where we work most',
        kind: 'fixed',
        detail: 'The eight sector cards.',
      },
      { id: 'process', heading: 'How a job runs', kind: 'fixed', detail: 'The five stages.' },
      {
        id: 'approach',
        heading: 'What actually makes the difference',
        kind: 'fixed',
        detail: 'The Noble Park photograph and the six points beneath it.',
        images: ['/images/projects/noble-park-factory-02.webp'],
      },
      {
        id: 'featured-projects',
        heading: 'Recent projects',
        kind: 'entries',
        collection: 'projects',
        slugs: featured.map((project) => project.slug),
        fields: [...PROJECT_CARD_FIELDS],
        detail: 'The featured case studies. The first photograph of each is the card image.',
      },
      {
        id: 'reviews',
        heading: 'Reviews',
        kind: 'fixed',
        detail: 'Google reviews, shown with attribution.',
      },
      {
        id: 'areas',
        heading: 'Where we work across Melbourne',
        kind: 'fixed',
        detail: 'The suburb list.',
      },
      {
        id: 'about',
        heading: 'About APMG Painting',
        kind: 'fixed',
        detail: 'Three paragraphs about the business.',
      },
      {
        id: 'faqs',
        heading: 'Before you enquire',
        kind: 'fixed',
        detail: 'The homepage questions.',
      },
      CTA_SECTION,
    ],
  };
}

function commercialPage(featured: { slug: string }[]): AdminPage {
  return {
    id: 'commercial',
    title: 'Commercial painting',
    path: '/commercial/',
    hero: {
      src: '/images/work/ewp-tilt-panel-cutting-in.webp',
      alt: 'An APMG painter working from a boom lift, cutting the line between white and green tilt panels',
    },
    sections: [
      {
        id: 'hero',
        heading: 'Hero',
        kind: 'fixed',
        detail: 'Heading, introduction and the banner photograph.',
      },
      TRUST_BAR,
      {
        id: 'intro',
        heading: 'What commercial work actually involves',
        kind: 'fixed',
        detail: 'Three paragraphs.',
      },
      {
        id: 'process',
        heading: 'How a commercial project runs',
        kind: 'fixed',
        detail: 'The five stages.',
      },
      {
        id: 'sectors',
        heading: 'Sectors we work in',
        kind: 'fixed',
        detail: 'The eight sector cards.',
      },
      {
        id: 'case-studies',
        heading: 'Commercial case studies',
        kind: 'entries',
        collection: 'projects',
        slugs: featured.map((project) => project.slug),
        fields: [...PROJECT_CARD_FIELDS],
      },
      {
        id: 'faqs',
        heading: 'Commercial painting questions',
        kind: 'fixed',
        detail: 'The commercial questions.',
      },
      CTA_SECTION,
    ],
  };
}

function officePage(ndisSlug: string | undefined): AdminPage {
  return {
    id: 'office-painting',
    title: 'Office painting',
    path: '/office-painters/',
    hero: {
      src: '/images/work/office-roller-occupied.webp',
      alt: 'An APMG painter running a pole roller down an office wall beside occupied desks',
    },
    sections: [
      { id: 'hero', heading: 'Hero', kind: 'fixed', detail: 'Heading and introduction.' },
      TRUST_BAR,
      {
        id: 'office-service',
        heading: 'What we paint in an office',
        kind: 'entry',
        collection: 'services',
        slug: 'office-painting',
        fields: ['body', 'includes'],
        detail: 'The description and the "Includes" list beside it come from the office service.',
      },
      ...(ndisSlug
        ? [
            {
              id: 'office-at-scale',
              heading: 'Office work at scale',
              kind: 'entries' as const,
              collection: 'projects' as const,
              slugs: [ndisSlug],
              fields: [...PROJECT_CARD_FIELDS],
            },
          ]
        : []),
      {
        id: 'constraints',
        heading: 'What an office repaint has to work around',
        kind: 'fixed',
        detail: 'Four paragraphs on after-hours work, staging and occupied desks.',
      },
      {
        id: 'surfaces',
        heading: 'The surfaces in an office fit-out',
        kind: 'fixed',
        detail: 'Six cards.',
      },
      {
        id: 'faqs',
        heading: 'Office painting questions',
        kind: 'fixed',
        detail: 'The office questions.',
      },
      CTA_SECTION,
    ],
  };
}

const tradePage: AdminPage = {
  id: 'trade-services',
  title: 'Trade services',
  path: '/trade-services/',
  hero: {
    src: '/images/work/office-partition-cutting-in.webp',
    alt: 'An APMG painter cutting in above a glazed partition in an open-plan office',
  },
  sections: [
    {
      id: 'hero',
      heading: 'Hero',
      kind: 'fixed',
      detail: 'Heading, introduction and the banner photograph.',
    },
    {
      id: 'programme',
      heading: 'Painting on a construction programme',
      kind: 'entry',
      collection: 'services',
      slug: 'builders-and-head-contractors',
      fields: ['body'],
      detail: 'The opening paragraphs come from the builders and head contractors service.',
    },
    {
      id: 'media-band',
      heading: 'Making good',
      kind: 'fixed',
      detail: 'The full-width photograph and its caption.',
      images: ['/images/work/fitout-reveal-making-good.webp'],
    },
    {
      id: 'sequence',
      heading: 'How painting sits in the sequence',
      kind: 'fixed',
      detail: 'Where painting falls in a construction programme, in prose.',
    },
    {
      id: 'faqs',
      heading: 'Builder and head contractor questions',
      kind: 'fixed',
      detail: 'The trade questions.',
    },
    CTA_SECTION,
  ],
};

const aboutPage: AdminPage = {
  id: 'about-us',
  title: 'About us',
  path: '/about-us/',
  hero: {
    src: '/images/hero/about-hero.webp',
    alt: 'APMG Painting crew working on a commercial site in Melbourne',
  },
  sections: [
    {
      id: 'hero',
      heading: 'Hero',
      kind: 'fixed',
      detail: 'Heading, introduction and the banner photograph.',
    },
    TRUST_BAR,
    {
      id: 'story',
      heading: 'How the business started',
      kind: 'fixed',
      detail: 'The founding date, the team and how the work is run.',
    },
    {
      id: 'accreditations',
      heading: 'Accreditations and checks',
      kind: 'fixed',
      detail: 'The credential list.',
    },
    {
      id: 'where-we-are',
      heading: 'Where we are',
      kind: 'settings',
      fields: ['address', 'phone', 'abn'],
      detail: 'The address, phone number and ABN stated on this page.',
    },
    CTA_SECTION,
  ],
};

const contactPage: AdminPage = {
  id: 'contact-us',
  title: 'Contact us',
  path: '/contact-us/',
  sections: [
    {
      id: 'heading',
      heading: 'Heading and introduction',
      kind: 'entry',
      collection: 'pages',
      slug: 'contact-us',
      fields: ['title', 'lede', 'formHeading', 'formIntro', 'metaTitle', 'metaDescription'],
      groups: [
        { heading: 'Top of the page', fields: ['title', 'lede'] },
        { heading: 'Enquiry form', fields: ['formHeading', 'formIntro'] },
        { heading: 'Search result', fields: ['metaTitle', 'metaDescription'] },
      ],
    },
    {
      id: 'contact-details',
      heading: 'Contact details',
      kind: 'settings',
      fields: ['phone', 'email', 'address', 'openingHours'],
      detail: 'The phone, email, address and hours listed under the introduction.',
    },
    {
      id: 'form',
      heading: 'Enquiry form',
      kind: 'fixed',
      detail: 'The form fields and their validation are code.',
    },
  ],
};

function projectsIndexPage(all: { slug: string }[], featured: { slug: string }[]): AdminPage {
  const thin = all.filter((project) => !featured.some((f) => f.slug === project.slug));
  return {
    id: 'projects',
    title: 'Projects',
    path: '/projects/',
    sections: [
      {
        id: 'intro',
        heading: 'Heading and introduction',
        kind: 'fixed',
        detail: '"Projects", and a sentence on what a case study covers.',
      },
      {
        id: 'documented',
        heading: 'Documented case studies',
        kind: 'entries',
        collection: 'projects',
        slugs: featured.map((project) => project.slug),
        fields: [...PROJECT_CARD_FIELDS],
      },
      ...(thin.length > 0
        ? [
            {
              id: 'further',
              heading: 'Further projects',
              kind: 'entries' as const,
              collection: 'projects' as const,
              slugs: thin.map((project) => project.slug),
              fields: [...PROJECT_CARD_FIELDS],
            },
          ]
        : []),
      CTA_SECTION,
    ],
  };
}

const areasPage: AdminPage = {
  id: 'areas',
  title: 'Areas we service',
  path: '/areas/',
  sections: [
    {
      id: 'intro',
      heading: 'Heading and introduction',
      kind: 'fixed',
      detail: '"Areas we service", and the suburb we work out from.',
    },
    {
      id: 'suburbs',
      heading: 'The suburb list',
      kind: 'fixed',
      detail: 'Suburbs and their pages live in code.',
    },
    CTA_SECTION,
  ],
};

function blogIndexPage(posts: { slug: string }[]): AdminPage {
  return {
    id: 'blog',
    title: 'Blog',
    path: '/blog/',
    sections: [
      { id: 'intro', heading: 'Heading', kind: 'fixed', detail: '"Notes from the job".' },
      {
        id: 'posts',
        heading: 'Articles',
        kind: 'entries',
        collection: 'posts',
        slugs: posts.map((post) => post.slug),
        fields: ['cover', 'title', 'excerpt'],
        detail: 'Each article in full is edited from Blog in the top bar.',
      },
    ],
  };
}

/** The whole project, one page. Grouped the way the public page reads. */
const PROJECT_GROUPS: readonly SectionFieldGroup[] = [
  { heading: 'Heading', fields: ['title', 'location', 'clientOrPropertyType', 'duration'] },
  {
    heading: 'The write-up',
    fields: [
      'challenge',
      'initialCondition',
      'scopeOfWork',
      'preparation',
      'coatingSystem',
      'accessAndSafety',
      'schedulingConstraints',
      'outcome',
    ],
  },
  { heading: 'Photographs', fields: ['images'] },
  { heading: 'Testimonial', fields: ['testimonial'] },
];

function projectPage(project: {
  slug: string;
  title: string;
  images: readonly { src: string; alt: string }[];
}): AdminPage {
  const cover = project.images[0];
  return {
    id: `project-${project.slug}`,
    title: project.title,
    path: `/projects/${project.slug}/`,
    hero: cover ? { src: cover.src, alt: cover.alt } : undefined,
    sections: [
      {
        id: 'case-study',
        heading: 'The case study',
        kind: 'entry',
        collection: 'projects',
        slug: project.slug,
        fields: [
          'title',
          'location',
          'clientOrPropertyType',
          'duration',
          'challenge',
          'initialCondition',
          'scopeOfWork',
          'preparation',
          'coatingSystem',
          'accessAndSafety',
          'schedulingConstraints',
          'outcome',
          'images',
          'testimonial',
          'slug',
          'sectorSlug',
          'relatedServiceSlugs',
          'relatedLocationSlugs',
          'isFeatured',
        ],
        groups: PROJECT_GROUPS,
        advanced: [
          'slug',
          'sectorSlug',
          'relatedServiceSlugs',
          'relatedLocationSlugs',
          'isFeatured',
        ],
      },
      {
        id: 'related',
        heading: 'Related services and nearby suburbs',
        kind: 'fixed',
        detail: 'Built from the links in Advanced.',
      },
      CTA_SECTION,
    ],
  };
}

function sectorPage(
  sector: {
    slug: string;
    title: string;
    shortTitle: string;
    legacyPath: string;
    projectSlugs: readonly string[];
  },
  cover: { src: string; alt: string } | undefined,
): AdminPage {
  return {
    id: `sector-${sector.slug}`,
    title: sector.shortTitle,
    path: sector.legacyPath,
    hero: cover,
    sections: [
      { id: 'hero', heading: 'Hero', kind: 'fixed', detail: 'The sector title and introduction.' },
      TRUST_BAR,
      {
        id: 'considerations',
        heading: 'What shapes work in this sector',
        kind: 'fixed',
        detail: 'The access, compliance and scheduling constraints, one card each.',
      },
      {
        id: 'body',
        heading: 'What the work involves',
        kind: 'fixed',
        detail: 'Substrates, preparation and sequencing for this sector, at length.',
      },
      {
        id: 'evidence',
        heading: 'Evidence',
        kind: 'entries',
        collection: 'projects',
        slugs: sector.projectSlugs,
        fields: [...PROJECT_CARD_FIELDS],
        detail:
          'The projects tagged with this sector. Change the sector under Advanced on a project.',
      },
      {
        id: 'faqs',
        heading: `${sector.shortTitle} painting questions`,
        kind: 'fixed',
        detail: 'The questions written for this sector.',
      },
      { id: 'related', heading: 'Related', kind: 'fixed', detail: 'Links to the other sectors.' },
      CTA_SECTION,
    ],
  };
}

/**
 * The page map, resolved against today's content.
 *
 * Projects and sectors both produce a page each, so a project added in the
 * CMS gets an editor screen without anybody editing this file.
 */
export const getAdminPages = cache(async function getAdminPages(): Promise<AdminPage[]> {
  const [projects, services, posts] = await Promise.all([getProjects(), getServices(), getPosts()]);
  const featured = projects.filter((project) => project.isFeatured);
  const ndis = projects.find((project) => project.slug === 'ndis-commercial-painting');

  const coverFor = (slugs: readonly string[]) => {
    const project = projects.find((candidate) => slugs.includes(candidate.slug));
    const image = project?.images[0];
    return image ? { src: image.src, alt: image.alt } : undefined;
  };

  return [
    homePage(services, featured),
    commercialPage(featured),
    officePage(ndis?.slug),
    tradePage,
    aboutPage,
    contactPage,
    projectsIndexPage(projects, featured),
    areasPage,
    // Posts are edited from Blog in the top bar; the index page is listed so
    // the editor can see what it is made of.
    blogIndexPage(posts),
    ...projects.map((project) => projectPage(project)),
    ...sectors.map((sector) => sectorPage(sector, coverFor(sector.projectSlugs))),
  ];
});

export async function getAdminPage(id: string): Promise<AdminPage | undefined> {
  return (await getAdminPages()).find((page) => page.id === id);
}

/** One place an image appears, and where an editor goes to change it. */
export type MediaPlacement = { title: string; pageId?: string };

/**
 * Every placement of every image, so "Used on" can be trusted.
 *
 * An image the site places but this map missed would show as "Not placed on
 * any page yet", which is the one thing that answer must never mean. So every
 * source of an image is walked: each page's hero, project galleries, service
 * cards, post covers, the accreditation badges and the logos and any other
 * image named in lib/site.ts and the business details.
 *
 * A placement carries a page id where one honestly exists. The header and
 * footer logos have none — they are on every page — so they are named without
 * a link rather than pointed at an arbitrary page.
 */
export const mediaUsage = cache(async function mediaUsage(): Promise<
  Map<string, MediaPlacement[]>
> {
  const usage = new Map<string, MediaPlacement[]>();
  const add = (src: string, placement: MediaPlacement) => {
    if (!src) return;
    const existing = usage.get(src) ?? [];
    if (!existing.some((entry) => entry.title === placement.title)) existing.push(placement);
    usage.set(src, existing);
  };

  const [pages, projects, services, posts, settings] = await Promise.all([
    getAdminPages(),
    getProjects(),
    getServices(),
    getPosts(),
    getSiteSettings(),
  ]);

  for (const page of pages) {
    if (page.hero?.src) add(page.hero.src, { title: page.title, pageId: page.id });
    for (const section of page.sections) {
      if (section.kind !== 'fixed') continue;
      for (const src of section.images ?? []) {
        add(src, { title: `${page.title} — ${section.heading}`, pageId: page.id });
      }
    }
  }
  for (const project of projects) {
    for (const image of project.images) {
      add(image.src, { title: project.title, pageId: `project-${project.slug}` });
    }
  }
  // Service cards are rendered on the homepage; the office and trade pages
  // use the same entries' words, not their photographs.
  for (const service of services) {
    if (service.image) add(service.image.src, { title: `Home — ${service.title}`, pageId: 'home' });
  }
  for (const post of posts) {
    if (post.cover) add(post.cover.src, { title: `Blog — ${post.title}`, pageId: 'blog' });
  }
  for (const accreditation of accreditations) {
    if (accreditation.logo) {
      add(accreditation.logo.src, {
        title: `Accreditations — ${accreditation.label}`,
        pageId: 'about-us',
      });
    }
  }
  // The site chrome. These two belong to no single page — the header and the
  // footer put them on all of them — so they are named without a link rather
  // than pointed at an arbitrary page.
  add(brandLogoPath, { title: 'Header logo, on every page' });
  add(FOOTER_LOGO, { title: 'Footer logo, on every page' });
  // Anything else lib/site.ts or the business details name.
  for (const { src } of imageSourcesIn([site, settings])) {
    add(src, { title: 'Named in the business details' });
  }

  return usage;
});
