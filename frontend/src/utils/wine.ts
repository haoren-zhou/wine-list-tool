import type { Wine } from '../types';

/** Builds the identity key for a wine, matching the backend dedup key. */
export function getWineKey(wine: Wine): string {
  return `${wine.wine_name}-${wine.vintage}-${wine.volume}`;
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
