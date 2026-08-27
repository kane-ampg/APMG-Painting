'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { mainNav } from './nav-data';
import { isCurrentPage, isSamePath, navActiveState } from '@/lib/nav/active';
import { cn } from '@/lib/utils';

/**
 * Desktop navigation.
 *
 * Dropdowns open on hover for pointer users but are driven by a real disclosure
 * button underneath, so keyboard and touch users get the same menu without
 * depending on hover. Escape closes; blur outside the group closes.
 *
 * The current page is marked three ways, because one is never enough:
 * `aria-current="page"` for assistive technology, a colour change, and a rule
 * under the label. The rule is what makes it legible to someone who cannot
 * separate the red from the black (WCAG 1.4.1 — colour is never the only cue).
 * The section a page belongs to is marked the same way but a shade quieter, and
 * without `aria-current`: only one item in a menu can be *the* current page.
 */
export function DesktopNav() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const menuId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenLabel(null);
    }
    function onPointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenLabel(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  /*
   * A dropdown left open across a navigation hangs over the page you just
   * asked for. Clicking a link inside one already closes it; this catches the
   * rest — the browser's back button, and a link somewhere else on the page.
   *
   * Adjusted during render rather than in an effect. React re-runs this
   * component before committing anything to the DOM, so the menu is never
   * painted open over the new page — which an effect, running after paint,
   * cannot promise.
   */
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpenLabel(null);
  }

  return (
    <nav ref={navRef} aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const isOpen = openLabel === item.label;
          const active = navActiveState(pathname, item);
          const panelId = `${menuId}-${item.href.replace(/[^a-z0-9]+/gi, '-')}`;

          const trigger = cn(
            'relative rounded-md px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
            active ? 'text-brand-700 hover:bg-brand-50' : 'text-ink hover:bg-paper-sunken',
          );

          const marker = active && (
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-3 bottom-0.5 h-0.5 rounded-full',
                active === 'page' ? 'bg-brand-600' : 'bg-brand-100',
              )}
            />
          );

          if (!item.children) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active === 'page' ? 'page' : undefined}
                  className={trigger}
                >
                  {item.label}
                  {marker}
                </Link>
              </li>
            );
          }

          return (
            <li
              key={item.href}
              className="relative"
              onMouseEnter={() => setOpenLabel(item.label)}
              onMouseLeave={() => setOpenLabel(null)}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-current={active === 'page' ? 'page' : undefined}
                onClick={() => setOpenLabel(isOpen ? null : item.label)}
                className={cn(trigger, 'flex items-center gap-1.5')}
              >
                {item.label}
                <span aria-hidden="true" className="text-xs text-ink-muted">
                  ▾
                </span>
                {marker}
              </button>

              {/* Always in the DOM, `hidden` when closed: a conditional
                  render kept every sector page, /office-painters/ and the
                  state hubs out of the server HTML, so the primary nav's
                  second level was invisible to crawlers. */}
              <div
                id={panelId}
                hidden={!isOpen}
                className="absolute left-0 top-full z-40 w-64 pt-1"
              >
                <ul className="rounded-lg border border-paper-edge bg-white p-2 shadow-lg">
                  {item.children.map((child) => {
                    const isCurrent = isCurrentPage(pathname, child.href);
                    // The "Overview" child is the same destination as the
                    // trigger above it, which already carries aria-current.
                    // Styled, so the open menu still shows where you are —
                    // but not announced twice.
                    const announce = isCurrent && !isSamePath(child.href, item.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpenLabel(null)}
                          aria-current={announce ? 'page' : undefined}
                          className={cn(
                            'block rounded-md px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
                            isCurrent
                              ? 'bg-brand-50 font-semibold text-brand-700'
                              : 'text-ink-soft hover:bg-paper-sunken hover:text-ink',
                          )}
                        >
                          {child.label}
                          {child.description && (
                            <span
                              className={cn(
                                'block text-xs',
                                isCurrent ? 'text-brand-700/80' : 'text-ink-muted',
                              )}
                            >
                              {child.description}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
