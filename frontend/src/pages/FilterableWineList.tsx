import { useEffect, useMemo, useRef, useState } from 'react';
import type { FilterOptions } from '../components/Filters';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import WineList from '../components/WineList';
import type { Wine } from '../types';
import { formatPrice, getWineKey, normalizeSearch } from '../utils/wine';

interface FilterableWineListProps {
  initialWinelist: Wine[];
}
const DEFAULT_FILTERS: FilterOptions = {
  minRating: 0,
  maxPrice: Infinity,
  typeFilter: '',
  formatFilter: 0,
  sortBy: 'default',
  query: '',
};

function FilterableWineList({ initialWinelist }: FilterableWineListProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterToggle = useRef<HTMLButtonElement>(null);
  const [activeKey, setActiveKey] = useState('none');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const wineTypes = useMemo(
    () => [...new Set(initialWinelist.map((wine) => wine.type_name))],
    [initialWinelist],
  );
  const wineFormats = useMemo(
    () =>
      [...new Set(initialWinelist.map((wine) => wine.volume))].sort(
        (a, b) => a - b,
      ),
    [initialWinelist],
  );

  const processedWinelist = useMemo(() => {
    const query = normalizeSearch(filters.query.trim());
    const filtered = initialWinelist.filter(
      (wine) =>
        (filters.minRating === 0 ||
          (wine.enrichment_status === 'matched' &&
            wine.rating_average >= filters.minRating)) &&
        wine.price <= filters.maxPrice &&
        (!filters.typeFilter || wine.type_name === filters.typeFilter) &&
        (!filters.formatFilter || wine.volume === filters.formatFilter) &&
        (!query ||
          normalizeSearch(`${wine.wine_name} ${wine.vivino_match}`).includes(
            query,
          )),
    );
    filtered.sort((a, b) => {
      if (filters.sortBy.startsWith('rating_')) {
        const aRated =
          a.enrichment_status === 'matched' && a.rating_average > 0;
        const bRated =
          b.enrichment_status === 'matched' && b.rating_average > 0;
        // An unavailable rating is not a zero-star rating, in either direction.
        if (aRated !== bRated) return aRated ? -1 : 1;
        if (!aRated) return 0;
        return filters.sortBy === 'rating_asc'
          ? a.rating_average - b.rating_average
          : b.rating_average - a.rating_average;
      }
      if (filters.sortBy === 'price_asc') return a.price - b.price;
      if (filters.sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });
    return filtered;
  }, [initialWinelist, filters]);

  const totalPages = Math.ceil(processedWinelist.length / itemsPerPage);
  const visiblePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedWinelist = useMemo(
    () =>
      processedWinelist.slice(
        (visiblePage - 1) * itemsPerPage,
        visiblePage * itemsPerPage,
      ),
    [processedWinelist, visiblePage, itemsPerPage],
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage, initialWinelist]);
  useEffect(() => {
    if (
      activeKey !== 'none' &&
      !paginatedWinelist.some((wine) => getWineKey(wine) === activeKey)
    )
      setActiveKey('none');
  }, [paginatedWinelist, activeKey]);

  const chips: { key: keyof FilterOptions; label: string }[] = [];
  if (filters.minRating > 0)
    chips.push({
      key: 'minRating',
      label: `${filters.minRating.toFixed(1)}+ stars`,
    });
  if (filters.maxPrice !== Infinity)
    chips.push({
      key: 'maxPrice',
      label: `Up to ${formatPrice(filters.maxPrice)}`,
    });
  if (filters.typeFilter)
    chips.push({ key: 'typeFilter', label: filters.typeFilter });
  if (filters.formatFilter)
    chips.push({ key: 'formatFilter', label: `${filters.formatFilter} ml` });
  const closeFilters = () => {
    setFiltersOpen(false);
    filterToggle.current?.focus();
  };
  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS });
    setActiveKey('none');
  };

  return (
    <div>
      {initialWinelist.length > 0 ? (
        <>
          <div className="list-toolbar">
            <label className="search-field">
              <span className="sr-only">Search</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                type="search"
                placeholder="Search"
                value={filters.query}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, query: e.target.value }))
                }
              />
            </label>
            <button
              type="button"
              className="button button-secondary filter-toggle"
              ref={filterToggle}
              aria-expanded={filtersOpen}
              aria-controls="wine-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filters{chips.length > 0 && ` · ${chips.length}`}{' '}
              <span aria-hidden="true">{filtersOpen ? '−' : '+'}</span>
            </button>
            <div className="sort-field">
              <label htmlFor="sortByFilter">Sort By</label>
              <select
                id="sortByFilter"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value }))
                }
              >
                <option value="default">List order</option>
                <option value="rating_desc">Highest rated</option>
                <option value="rating_asc">Lowest rated</option>
                <option value="price_asc">Lowest price</option>
                <option value="price_desc">Highest price</option>
              </select>
            </div>
          </div>
          <div
            id="wine-filters"
            className={`filter-panel${filtersOpen ? ' is-open' : ''}`}
            onKeyDown={(e) => {
              if (
                e.key === 'Escape' &&
                filterToggle.current?.getClientRects().length
              ) {
                e.preventDefault();
                closeFilters();
              }
            }}
          >
            <Filters
              wineTypes={wineTypes}
              wineFormats={wineFormats}
              filters={filters}
              setFilters={setFilters}
            />
            <button
              type="button"
              className="button button-primary apply-filters"
              onClick={closeFilters}
            >
              Show {processedWinelist.length} wines
            </button>
          </div>
          <div className="results-meta">
            <p role="status" aria-live="polite">
              Showing {processedWinelist.length} of {initialWinelist.length}{' '}
              wines
            </p>
            {(chips.length > 0 ||
              filters.query ||
              filters.sortBy !== 'default') &&
              processedWinelist.length > 0 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={resetFilters}
                >
                  Reset filters
                </button>
              )}
          </div>
          {chips.length > 0 && (
            <div className="filter-chips" aria-label="Active filters">
              {chips.map(({ key, label }) => (
                <button
                  type="button"
                  className="filter-chip"
                  key={key}
                  aria-label={`Remove ${label} filter`}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [key]: DEFAULT_FILTERS[key],
                    }))
                  }
                >
                  {label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
          {processedWinelist.length > 0 ? (
            <WineList
              winelist={paginatedWinelist}
              activeKey={activeKey}
              setActiveKey={setActiveKey}
            />
          ) : (
            <div className="empty-state">
              <h2>No wines match these filters.</h2>
              <p>Change or reset your filters.</p>
              <button
                type="button"
                className="button button-secondary"
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <h2>No wines were extracted from this file.</h2>
          <p>Try another PDF using “Upload another file” above.</p>
        </div>
      )}
      {processedWinelist.length > 0 && (
        <Pagination
          currentPage={visiblePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  );
}
export default FilterableWineList;
