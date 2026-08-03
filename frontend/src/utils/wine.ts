import type { Wine } from '../types';

/** Builds the identity key for a wine, matching the backend dedup key. */
export function getWineKey(wine: Wine): string {
  return `${wine.wine_name}-${wine.vintage}-${wine.volume}`;
}
