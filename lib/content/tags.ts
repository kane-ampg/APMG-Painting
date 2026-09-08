import type { Collection } from './schemas';

/** Cache tag per collection. Saves call updateTag(contentTag(c)). */
export function contentTag(collection: Collection): string {
  return `content:${collection}`;
}
