import type { Wine } from '../types';

export function makeWine(overrides: Partial<Wine> = {}): Wine {
  return {
    enrichment_status: 'matched',
    wine_name: 'Original wine',
    vivino_match: 'Matched wine',
    rating_average: 4.2,
    rating_count: 100,
    vintage: 2020,
    price: 50,
    volume: 750,
    type_id: 1,
    style_id: 1,
    grapes: [1],
    type_name: 'Red',
    style_name: 'Bold',
    grapes_name: 'Merlot',
    match_coefficient: 0.9,
    ...overrides,
  };
}

export const partialWines: Wine[] = [
  makeWine(),
  makeWine({
    enrichment_status: 'unmatched',
    wine_name: 'Rare original',
    vivino_match: '',
    rating_average: 0,
    rating_count: 0,
    price: 5000,
    type_name: 'Other',
    style_name: 'N.A.',
    grapes_name: 'N.A.',
    match_coefficient: 0,
  }),
  makeWine({
    enrichment_status: 'lookup_failed',
    wine_name: 'Temporary original',
    vivino_match: '',
    rating_average: 0,
    rating_count: 0,
    type_name: 'Other',
    style_name: 'N.A.',
    grapes_name: 'N.A.',
    match_coefficient: 0,
  }),
];
