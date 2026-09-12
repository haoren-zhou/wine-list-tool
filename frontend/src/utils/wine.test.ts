import { expect, it } from 'vitest';
import { formatPrice } from './wine';

it.each([
  [0, '$0'],
  [85, '$85'],
  [45.5, '$45.50'],
  [49.95, '$49.95'],
  [5000, '$5,000'],
])('formats price %s as %s', (price, expected) => {
  expect(formatPrice(price)).toBe(expected);
});
