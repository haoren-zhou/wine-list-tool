import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { makeWine, partialWines } from '../test/wines';
import FilterableWineList from './FilterableWineList';

it('keeps every wine visible with distinct per-wine missing-rating statuses', () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 3 wines');
  expect(
    screen.getByRole('button', { name: /Rare original/ }),
  ).toHaveTextContent('Rating unavailable');
  expect(
    screen.getByRole('button', { name: /Temporary original/ }),
  ).toHaveTextContent('Lookup failed');
  expect(screen.getByLabelText('Min. Rating')).toHaveValue('0');
  expect(screen.getByLabelText('Maximum price amount')).toHaveValue(null);
});

it('only excludes unknown ratings for a positive minimum and resets every filter', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '0.1' },
  });
  expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 3 wines');
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
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'nothing' },
  });
  expect(screen.getByText(/No wines match these filters/)).toBeVisible();
  expect(screen.queryByLabelText('Per page')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 3 wines');
  expect(screen.getByLabelText('Wine Type')).toHaveValue('');
  expect(screen.getByLabelText('Format')).toHaveValue('0');
  expect(screen.getByLabelText('Sort By')).toHaveValue('default');
  expect(screen.getByRole('searchbox')).toHaveValue('');
  expect(screen.getByLabelText('Maximum price amount')).toHaveValue(null);
});

it('resets pagination on filter, page-size, reset and dataset changes', async () => {
  const wines = Array.from({ length: 30 }, (_, index) =>
    makeWine({
      wine_name: `Original ${index}`,
      vivino_match: `Match ${index}`,
    }),
  );
  const { rerender } = render(<FilterableWineList initialWinelist={wines} />);
  expect(screen.getByRole('status')).toHaveTextContent(
    'Showing 30 of 30 wines',
  );
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

it('uses the original name with always-visible vintage/format and accessible match details', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  const card = screen.getByRole('button', { name: /Original wine/ });
  for (const value of ['2020', 'Red', '750']) {
    expect(card).toHaveTextContent(value);
  }
  expect(card).not.toHaveTextContent('Matched wine');
  const details = document.getElementById(card.getAttribute('aria-controls')!)!;
  expect(card).toHaveAttribute('aria-expanded', 'false');
  expect(details).not.toBeVisible();
  expect(within(details).queryAllByRole('definition')).toHaveLength(0);
  card.focus();
  await userEvent.keyboard('{Enter}');
  expect(card).toHaveAttribute('aria-expanded', 'true');
  expect(within(details).getByText('Matched wine')).toBeVisible();
  expect(within(details).getByText('90%')).toBeVisible();
  const unmatchedCard = screen.getByRole('button', { name: /Rare original/ });
  await userEvent.click(unmatchedCard);
  expect(card).toHaveAttribute('aria-expanded', 'false');
  const unmatchedDetails = document.getElementById(
    unmatchedCard.getAttribute('aria-controls')!,
  )!;
  expect(
    within(unmatchedDetails).queryByText(/^\d+%$/),
  ).not.toBeInTheDocument();
  await userEvent.click(unmatchedCard);
  expect(unmatchedDetails).not.toBeVisible();
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

it('handles matched wines with no rating', () => {
  render(
    <FilterableWineList initialWinelist={[makeWine({ rating_average: 0 })]} />,
  );
  expect(
    screen.getByRole('button', { name: /Original wine/ }),
  ).toHaveTextContent('No rating listed');
});

it('searches original and matched names without requiring accents, and resets pagination', async () => {
  const wines = [
    makeWine({ wine_name: 'Château Test', vivino_match: 'Domaine Étoile' }),
    ...Array.from({ length: 12 }, (_, i) =>
      makeWine({ wine_name: `Another ${i}` }),
    ),
  ];
  render(<FilterableWineList initialWinelist={wines} />);
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  const search = screen.getByRole('searchbox', { name: /search/i });
  await userEvent.type(search, ' chateau ');
  expect(screen.getByRole('button', { name: /Château Test/ })).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 13 wines');
  await userEvent.clear(screen.getByRole('searchbox'));
  await userEvent.type(screen.getByRole('searchbox'), 'ETOILE');
  expect(screen.getByRole('button', { name: /Château Test/ })).toBeVisible();
});

it('uses integer budgets and supports expensive wines and no limit without a jumping slider scale', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  const budget = screen.getByLabelText('Maximum price amount');
  const slider = screen.getByLabelText('Max. Price ($)');
  expect(budget).toHaveAttribute('step', '1');
  expect(slider).toHaveAttribute('step', '1');
  fireEvent.change(budget, { target: { value: '49.95' } });
  expect(budget).toHaveValue(50);
  expect(slider).toHaveValue('50');
  expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 3 wines');
  fireEvent.change(slider, { target: { value: '48.123456789' } });
  expect(budget).toHaveValue(48);
  expect(screen.getByRole('status')).toHaveTextContent('Showing 0 of 3 wines');
  fireEvent.change(budget, { target: { value: '5000' } });
  expect(screen.getByRole('button', { name: /Rare original/ })).toBeVisible();
  const max = slider.getAttribute('max')!;
  expect(Number(max)).toBeGreaterThan(5000);
  fireEvent.change(slider, { target: { value: '4500' } });
  expect(slider).toHaveAttribute('max', max);
  expect(budget).toHaveValue(4500);
  fireEvent.change(slider, { target: { value: max } });
  expect(budget).toHaveValue(null);
  fireEvent.change(budget, { target: { value: '0' } });
  expect(screen.getByRole('status')).toHaveTextContent('Showing 0 of 3 wines');
  await userEvent.clear(budget);
  expect(screen.getByRole('status')).toHaveTextContent('Showing 3 of 3 wines');
});

it('preserves decimal keystrokes until blur or Enter instead of appending digits to a rounded value', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  const budget = screen.getByLabelText('Maximum price amount');
  await userEvent.type(budget, '49.95');
  expect(budget).toHaveValue(49.95);
  expect(screen.getByLabelText('Max. Price ($)')).toHaveValue('50');
  await userEvent.tab();
  expect(budget).toHaveValue(50);
  await userEvent.clear(budget);
  await userEvent.type(budget, '68.123456789');
  await userEvent.keyboard('{Enter}');
  expect(budget).toHaveValue(68);
  expect(budget).toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(budget).toHaveValue(null);
});

it('removes individual filter chips without clearing the other filters', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  fireEvent.change(screen.getByLabelText('Wine Type'), {
    target: { value: 'Red' },
  });
  fireEvent.change(screen.getByLabelText('Maximum price amount'), {
    target: { value: '100' },
  });
  expect(
    screen.getByRole('button', { name: /Filters · 2/ }),
  ).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Remove Red filter' }),
  );
  expect(screen.getByLabelText('Wine Type')).toHaveValue('');
  expect(screen.getByLabelText('Maximum price amount')).toHaveValue(100);
  expect(screen.getByRole('status')).toHaveTextContent('Showing 2 of 3 wines');
});

it('opens the mobile filter disclosure and returns focus when closing it', async () => {
  render(<FilterableWineList initialWinelist={partialWines} />);
  const toggle = screen.getByRole('button', { name: 'Filters' });
  const panel = document.getElementById(toggle.getAttribute('aria-controls')!)!;
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await userEvent.click(
    within(panel).getByRole('button', { name: 'Show 3 wines' }),
  );
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveFocus();
});

it.each(['rating_asc', 'rating_desc'])(
  'keeps unavailable ratings last when sorting by %s',
  (sort) => {
    render(
      <FilterableWineList
        initialWinelist={[partialWines[1], partialWines[0], partialWines[2]]}
      />,
    );
    fireEvent.change(screen.getByLabelText('Sort By'), {
      target: { value: sort },
    });
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Original wine');
    expect(rows[1]).toHaveTextContent('Rare original');
    expect(rows[2]).toHaveTextContent('Temporary original');
  },
);
