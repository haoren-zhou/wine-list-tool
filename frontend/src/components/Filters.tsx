import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { MAX_PRICE_SLIDER_VALUE } from '../utils/constants';
import { formatPrice } from '../utils/wine';

export interface FilterOptions {
  minRating: number;
  maxPrice: number;
  typeFilter: string;
  formatFilter: number;
  sortBy: string;
  query: string;
}

interface FiltersProps {
  wineTypes: string[];
  wineFormats: number[];
  filters: FilterOptions;
  setFilters: Dispatch<SetStateAction<FilterOptions>>;
}

function Filters({
  wineTypes,
  wineFormats,
  filters,
  setFilters,
}: FiltersProps) {
  // Expand for typed budgets, but keep the scale stable while dragging.
  const [sliderMax, setSliderMax] = useState(MAX_PRICE_SLIDER_VALUE);
  // Preserve keystrokes while editing; show the whole-dollar budget on blur.
  const [budgetText, setBudgetText] = useState<string | null>(null);
  const budgetValue =
    filters.maxPrice === Infinity ? '' : String(filters.maxPrice);
  return (
    <div className="filter-fields">
      <div className="filter-field">
        <div className="field-heading">
          <label htmlFor="ratingThreshold">Min. Rating</label>
          <span>
            {filters.minRating === 0 ? 'Any' : filters.minRating.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="5"
          step="0.1"
          id="ratingThreshold"
          value={filters.minRating}
          aria-valuetext={
            filters.minRating === 0
              ? 'Any, including unrated'
              : `${filters.minRating} stars`
          }
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              minRating: Number(e.target.value),
            }))
          }
        />
      </div>
      <div className="filter-field">
        <div className="field-heading">
          <label htmlFor="priceThreshold">Max. Price ($)</label>
          <input
            className="budget-input"
            type="number"
            min="0"
            step="1"
            aria-label="Maximum price amount"
            placeholder="No limit"
            value={budgetText ?? budgetValue}
            onFocus={() => setBudgetText(budgetValue)}
            onBlur={() => setBudgetText(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setBudgetText(budgetValue);
            }}
            onChange={(e) => {
              if (budgetText !== null) setBudgetText(e.target.value);
              if (e.target.value === '')
                setFilters((prev) => ({ ...prev, maxPrice: Infinity }));
              else if (
                Number.isFinite(e.target.valueAsNumber) &&
                e.target.valueAsNumber >= 0
              ) {
                const amount = Math.round(e.target.valueAsNumber);
                setSliderMax((previous) =>
                  Math.max(previous, Math.ceil(amount / 5) * 5 + 5),
                );
                setFilters((prev) => ({ ...prev, maxPrice: amount }));
              }
            }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={sliderMax}
          step="1"
          id="priceThreshold"
          value={filters.maxPrice === Infinity ? sliderMax : filters.maxPrice}
          aria-valuetext={
            filters.maxPrice === Infinity
              ? 'No price limit'
              : formatPrice(filters.maxPrice)
          }
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              maxPrice:
                Math.round(Number(e.target.value)) === sliderMax
                  ? Infinity
                  : Math.round(Number(e.target.value)),
            }))
          }
        />
      </div>
      <div className="filter-field">
        <label htmlFor="typeFilter">Wine Type</label>
        <select
          id="typeFilter"
          value={filters.typeFilter}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, typeFilter: e.target.value }))
          }
        >
          <option value="">All types</option>
          {wineTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="formatFilter">Format</label>
        <select
          id="formatFilter"
          value={filters.formatFilter}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              formatFilter: Number(e.target.value),
            }))
          }
        >
          <option value={0}>All formats</option>
          {wineFormats.map((format) => (
            <option key={format} value={format}>
              {format} ml
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Filters;
