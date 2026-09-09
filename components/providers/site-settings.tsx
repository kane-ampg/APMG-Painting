'use client';

import { createContext, useContext } from 'react';
import type { SiteSettings } from '@/lib/content/types';

/**
 * Business details for client components.
 *
 * A client component cannot await `getSiteSettings()` and must never import
 * the database, so the root layout resolves the settings once on the server
 * and hands them down through here. The context is the only sanctioned route:
 * a client component reading `lib/site`'s defaults directly would keep
 * showing the old phone number after an editor changed it.
 */
const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

/** Client components read business details from here, never from lib/site. */
export function useSiteSettings(): SiteSettings {
  const value = useContext(SiteSettingsContext);
  if (!value) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return value;
}
