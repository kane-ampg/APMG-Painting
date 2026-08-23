'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { mainNav } from './nav-data';

/**
 * Desktop navigation.
 *
 * Dropdowns open on hover for pointer users but are driven by a real disclosure
 * button underneath, so keyboard and touch users get the same menu without
 * depending on hover. Escape closes; blur outside the group closes.
 */
export function DesktopNav() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

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

  return (
    <nav ref={navRef} aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const isOpen = openLabel === item.label;

          if (!item.children) {
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  {item.label}
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
                onClick={() => setOpenLabel(isOpen ? null : item.label)}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                {item.label}
                <span aria-hidden="true" className="text-xs text-ink-muted">
                  ▾
                </span>
              </button>

              {isOpen && (
                <div className="absolute left-0 top-full z-40 w-64 pt-1">
                  <ul className="rounded-lg border border-paper-edge bg-white p-2 shadow-lg">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpenLabel(null)}
                          className="block rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          {child.label}
                          {child.description && (
                            <span className="block text-xs text-ink-muted">
                              {child.description}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
