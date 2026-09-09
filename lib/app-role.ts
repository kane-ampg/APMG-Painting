/**
 * Which deployment this is (spec §8a). Read at build time by next.config.ts
 * and at runtime by the save actions. Anything other than the exact string
 * "editor" is the public site, so a typo can never expose the admin.
 */
export type AppRole = 'site' | 'editor';

export function appRole(): AppRole {
  return process.env.NEXT_PUBLIC_APP_ROLE === 'editor' ? 'editor' : 'site';
}

export function isEditor(): boolean {
  return appRole() === 'editor';
}
