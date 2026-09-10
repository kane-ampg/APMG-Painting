import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { projects } from '@/content/projects';
import { sectors } from '@/content/sectors';
import { services } from '@/content/services';
import { getAdminPage, getAdminPages, mediaUsage, staticPagePaths } from '@/lib/admin/pages';
import { labelFor, labels } from '@/lib/admin/labels';
import { fieldsFor } from '@/lib/content/form-fields';
import { collections } from '@/lib/content/schemas';
import { accreditations } from '@/lib/site';

const siteRoot = path.join(process.cwd(), 'app', '(site)');

/** Every route under app/(site) whose segments are all static. */
function staticRoutes(dir = siteRoot, prefix = '/'): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      // A dynamic segment has no single URL, so it cannot have one page entry.
      if (entry.startsWith('[') || entry.startsWith('@') || entry.startsWith('_')) continue;
      const segment = entry.startsWith('(') ? prefix : `${prefix}${entry}/`;
      found.push(...staticRoutes(full, segment));
    } else if (entry === 'page.tsx') {
      found.push(prefix);
    }
  }
  return found;
}

describe('the page map', () => {
  it('has an entry for every static public route', async () => {
    const pages = await getAdminPages();
    const mapped = new Set(pages.map((page) => page.path));
    for (const route of staticRoutes()) {
      expect(mapped.has(route), `no editor page for ${route}`).toBe(true);
    }
  });

  it('lists exactly the routes the site actually has', async () => {
    const pages = await getAdminPages();
    const known = new Set<string>([
      ...staticPagePaths,
      ...projects.map((project) => `/projects/${project.slug}/`),
      ...sectors.map((sector) => sector.legacyPath),
    ]);
    for (const page of pages) {
      expect(known.has(page.path), `${page.path} is not a route on the site`).toBe(true);
    }
    // Nothing is listed twice: two cards to the same page is two answers to
    // "where do I change this?".
    expect(new Set(pages.map((page) => page.id)).size).toBe(pages.length);
  });

  it('derives a page for every project and every sector', async () => {
    const pages = await getAdminPages();
    for (const project of projects) {
      expect(pages.some((page) => page.path === `/projects/${project.slug}/`)).toBe(true);
    }
    for (const sector of sectors) {
      expect(pages.some((page) => page.path === sector.legacyPath)).toBe(true);
    }
  });

  it('puts the homepage sections in the order the page renders them', async () => {
    const home = await getAdminPage('home');
    expect(home?.sections.map((section) => section.heading)).toEqual([
      'Hero',
      'Accreditations strip',
      'The figures',
      'What we paint',
      'Where we work most',
      'How a job runs',
      'What actually makes the difference',
      'Recent projects',
      'Reviews',
      'Where we work across Melbourne',
      'About APMG Painting',
      'Before you enquire',
      'Call to action',
    ]);
    const services = home?.sections.find((section) => section.id === 'services');
    expect(services).toMatchObject({ kind: 'entries', collection: 'services' });
  });

  it('names every field a section offers', async () => {
    const pages = await getAdminPages();
    for (const page of pages) {
      for (const section of page.sections) {
        if (section.kind === 'fixed' || section.kind === 'settings') continue;
        const known = new Set(fieldsFor(section.collection).map((field) => field.name));
        for (const field of section.fields) {
          expect(known.has(field), `${page.id}/${section.id}: no such field ${field}`).toBe(true);
        }
      }
    }
  });
});

describe('field labels', () => {
  it('names every field of every collection, nested fields included', () => {
    for (const collection of collections) {
      for (const field of fieldsFor(collection)) {
        expect(labels[collection]?.[field.name], `${collection}.${field.name}`).toBeDefined();
        for (const child of field.children ?? []) {
          const key = `${field.name}.${child.name}`;
          expect(labels[collection]?.[key], `${collection}.${key}`).toBeDefined();
        }
      }
    }
  });

  it('never shows a code name', () => {
    for (const collection of collections) {
      for (const field of fieldsFor(collection)) {
        const { label } = labelFor(collection, field.name);
        expect(label).not.toMatch(/[a-z][A-Z]/);
        expect(label.toLowerCase()).not.toContain('slug');
        expect(label.toLowerCase()).not.toContain('json');
      }
    }
  });
});

describe('what a section offers is what the editor renders', () => {
  it('puts every field a section names into a group or into Advanced', async () => {
    const pages = await getAdminPages();
    for (const page of pages) {
      for (const section of page.sections) {
        if (section.kind === 'fixed' || section.kind === 'settings') continue;
        const advanced = section.kind === 'entry' ? (section.advanced ?? []) : [];
        const groups = section.kind === 'entry' ? section.groups : undefined;
        for (const field of section.fields) {
          // Without groups every non-advanced field is rendered in order, so
          // there is nothing to fall through. With groups, a field named by
          // the section but by no group would be silently invisible.
          const rendered =
            !groups ||
            advanced.includes(field) ||
            groups.some((group) => group.fields.includes(field));
          expect(rendered, `${page.id}/${section.id}: ${field} is never rendered`).toBe(true);
        }
      }
    }
  });
});

describe('mediaUsage', () => {
  it('names a page for a service card photograph and for an accreditation badge', async () => {
    const usage = await mediaUsage();

    const office = services.find((service) => service.slug === 'office-painting');
    const card = office?.image?.src;
    expect(card).toBeDefined();
    expect(usage.get(card as string)).toContainEqual(
      expect.objectContaining({ pageId: 'home' }),
    );

    const badge = accreditations.find((entry) => entry.logo)?.logo?.src;
    expect(badge).toBeDefined();
    expect(usage.get(badge as string)).toContainEqual(
      expect.objectContaining({ pageId: 'about-us' }),
    );
  });

  it('accounts for every image in the repository, so "not placed" is never a lie', async () => {
    const { listLocalMedia } = await import('@/lib/media/local-library');
    const [usage, rows] = await Promise.all([mediaUsage(), listLocalMedia()]);
    for (const row of rows) {
      expect((usage.get(row.public_url) ?? []).length, `${row.public_url} has no placement`)
        .toBeGreaterThan(0);
    }
  });
});
