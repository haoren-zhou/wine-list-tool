import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { makeWine, partialWines } from '../test/wines';
import FilterableWineList from './FilterableWineList';

it('shows all extracted wines by default with counts and distinct partial-result warnings', () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  expect(
    screen.getByText('Extracted: 3 · Matched: 1 · Visible: 3'),
  ).toBeVisible();
  expect(screen.getByText('Unmatched: 1 · Lookup failed: 1')).toBeVisible();
  expect(
    screen.getByText(/Partial results: all extracted wines are retained/),
  ).toBeVisible();
  expect(screen.getByText(/No Vivino match found for 1 wine/)).toBeVisible();
  expect(screen.getByText(/Temporary lookup failure for 1 wine/)).toBeVisible();
  expect(
    screen.getByRole('button', { name: /Rare original/ }),
  ).toHaveTextContent('Rating unavailable');
  expect(
    screen.getByRole('button', { name: /Temporary original/ }),
  ).toHaveTextContent('Rating unavailable');
  expect(screen.queryByText(/0 ★/)).not.toBeInTheDocument();
  expect(screen.getByLabelText('Min. Rating')).toHaveValue('0');
  expect(screen.getByText('No limit')).toBeVisible();
});

it('only excludes unknown ratings for a positive minimum and resets all filters', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '0.1' },
  });
  expect(
    screen.getByText('Extracted: 3 · Matched: 1 · Visible: 1'),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: /Rare original/ }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '0' },
  });
  expect(screen.getByRole('button', { name: /Rare original/ })).toBeVisible();
  fireEvent.change(screen.getByLabelText('Max. Price ($)'), {
    target: { value: '10' },
  });
  fireEvent.change(screen.getByLabelText('Wine Type'), {
    target: { value: 'Red' },
  });
  fireEvent.change(screen.getByLabelText('Format'), {
    target: { value: '750' },
  });
  fireEvent.change(screen.getByLabelText('Sort By'), {
    target: { value: 'price_desc' },
  });
  expect(screen.getByText(/No wines match these filters/)).toBeVisible();
  expect(screen.queryByLabelText('Per page')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(
    screen.getByText('Extracted: 3 · Matched: 1 · Visible: 3'),
  ).toBeVisible();
  expect(screen.getByLabelText('Wine Type')).toHaveValue('');
  expect(screen.getByLabelText('Format')).toHaveValue('0');
  expect(screen.getByLabelText('Sort By')).toHaveValue('default');
  expect(screen.getByText('No limit')).toBeVisible();
});

it('resets pagination on filter, page-size, reset and dataset changes', async () => {
  const wines = Array.from({ length: 30 }, (_, index) =>
    makeWine({
      wine_name: `Original ${index}`,
      vivino_match: `Match ${index}`,
    }),
  );
  const { rerender } = render(<FilterableWineList initialWinelist={wines} />);
  expect(screen.getByText(/Visible: 30/)).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Page 2 of 3')).toBeVisible();
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '4' },
  });
  expect(screen.getByText('Page 1 of 3')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  fireEvent.change(screen.getByLabelText('Per page'), {
    target: { value: '25' },
  });
  expect(screen.getByText('Page 1 of 2')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByText('Page 1 of 2')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  rerender(<FilterableWineList initialWinelist={partialWines} />);
  expect(screen.getByRole('button', { name: /Rare original/ })).toBeVisible();
});

it('exposes accordion state and hides collapsed details from the accessibility tree', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  const card = screen.getByRole('button', { name: /Matched wine/ });
  const details = document.getElementById(card.getAttribute('aria-controls')!)!;
  expect(card).toHaveAttribute('aria-expanded', 'false');
  expect(details).toHaveAttribute('hidden');
  expect(within(details).queryAllByRole('paragraph')).toHaveLength(0);
  card.focus();
  await userEvent.keyboard('{Enter}');
  expect(card).toHaveAttribute('aria-expanded', 'true');
  expect(details).not.toHaveAttribute('hidden');
  expect(within(details).getByText('Name on Wine List:')).toBeVisible();
  expect(within(details).getByText(/Original wine/)).toBeVisible();
  const unmatchedCard = screen.getByRole('button', { name: /Rare original/ });
  await userEvent.click(unmatchedCard);
  expect(card).toHaveAttribute('aria-expanded', 'false');
  expect(details).toHaveAttribute('hidden');
  const unmatchedDetails = document.getElementById(
    unmatchedCard.getAttribute('aria-controls')!,
  )!;
  expect(unmatchedDetails).not.toHaveTextContent('% match');
  await userEvent.click(unmatchedCard);
  expect(unmatchedDetails).toHaveAttribute('hidden');
});

it('closes an expanded card when filters remove it', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  await userEvent.click(screen.getByRole('button', { name: /Rare original/ }));
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '4' },
  });
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '0' },
  });
  expect(screen.getByRole('button', { name: /Rare original/ })).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

it('does not warn for fully matched results', () => {
  render(<FilterableWineList initialWinelist={[makeWine()]} />);
  expect(screen.queryByText(/Partial results/)).not.toBeInTheDocument();
});
