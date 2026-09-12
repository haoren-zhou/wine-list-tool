import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { MAX_PRICE_SLIDER_VALUE } from '../utils/constants';

export interface FilterOptions {
  minRating: number;
  maxPrice: number;
  typeFilter: string;
  formatFilter: number;
  sortBy: string;
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
  const handleMinRatingChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      minRating: parseFloat(e.target.value),
    }));
  };

  const handleMaxPriceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseFloat(e.target.value);
    setFilters((prevFilters) => ({
      ...prevFilters,
      // The max slider position represents "no price limit"
      maxPrice: sliderValue === MAX_PRICE_SLIDER_VALUE ? Infinity : sliderValue,
    }));
  };

  const handleTypeFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      typeFilter: e.target.value,
    }));
  };

  const handleFormatFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      formatFilter: Number(e.target.value),
    }));
  };

  const handleSortByChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      sortBy: e.target.value,
    }));
  };

  return (
    <div className="text-white width-full mb-4 grid grid-rows-2 grid-cols-12 gap-x-4 text-xs md:text-sm xl:text-base 2xl:text-lg">
      <div className="col-span-full md:col-span-6">
        <label className="font-semibold" htmlFor="ratingThreshold">
          Min. Rating
        </label>
        <span className="float-right">
          {filters.minRating === 0
            ? 'Any (including unrated)'
            : filters.minRating.toFixed(1)}
        </span>
        <input
          type="range"
          min="0"
          max="5.0"
          step="0.1"
          id="ratingThreshold"
          className="w-full"
          value={filters.minRating}
          onChange={handleMinRatingChange}
        />
      </div>
      <div className="col-span-full md:col-span-6">
        <label className="font-semibold" htmlFor="priceThreshold">
          Max. Price ($)
        </label>
        <span className="float-right">
          {filters.maxPrice === Infinity ? 'No limit' : filters.maxPrice}
        </span>
        <input
          type="range"
          min="0"
          max={MAX_PRICE_SLIDER_VALUE}
          step="5"
          id="priceThreshold"
          className="w-full"
          value={
            filters.maxPrice === Infinity
              ? MAX_PRICE_SLIDER_VALUE
              : filters.maxPrice
          }
          onChange={handleMaxPriceChange}
        />
      </div>
      <div className="col-span-full md:col-span-4 mt-1 md:mt-0">
        <label className="font-semibold" htmlFor="typeFilter">
          Wine Type
        </label>
        <select
          className="w-full bg-gray-800 px-2.5 py-2 pr-8 rounded leading-tight"
          id="typeFilter"
          value={filters.typeFilter}
          onChange={handleTypeFilterChange}
        >
          <option value="">All</option>
          {wineTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </div>
      <div className="col-span-full md:col-span-4 mt-1 md:mt-0">
        <label className="font-semibold" htmlFor="formatFilter">
          Format
        </label>
        <select
          className="w-full bg-gray-800 px-2.5 py-2 pr-8 rounded leading-tight"
          id="formatFilter"
          value={filters.formatFilter}
          onChange={handleFormatFilterChange}
        >
          <option value={0}>All</option>
          {wineFormats.map((format) => (
            <option key={format} value={format}>
              {format} ml
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-full md:col-span-4 mt-1 md:mt-0">
        <label className="font-semibold" htmlFor="sortByFilter">
          Sort By
        </label>
        <select
          className="w-full bg-gray-800 px-2.5 py-2 pr-8 rounded leading-tight"
          id="sortByFilter"
          value={filters.sortBy}
          onChange={handleSortByChange}
        >
          <option value="default">Default</option>
          <option value="rating_asc">Rating (Low to High)</option>
          <option value="rating_desc">Rating (High to Low)</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
        </select>
      </div>
    </div>
  );
}

export default Filters;
