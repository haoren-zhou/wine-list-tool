import { useEffect, useMemo, useState } from 'react';
import type { FilterOptions } from '../components/Filters';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import WineList from '../components/WineList';
import type { Wine } from '../types';
import { getWineKey } from '../utils/wine';

interface FilterableWineListProps {
  initialWinelist: Wine[];
}

const DEFAULT_FILTERS: FilterOptions = {
  minRating: 0,
  maxPrice: Infinity,
  typeFilter: '',
  formatFilter: 0,
  sortBy: 'default',
};

function FilterableWineList({ initialWinelist }: FilterableWineListProps) {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [activeKey, setActiveKey] = useState<string>('none'); // none if no card is open

  // pagination
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

  const processedWinelist: Wine[] = useMemo(() => {
    const filtered = initialWinelist.filter(
      (wineDetails) =>
        (filters.minRating === 0 ||
          (wineDetails.enrichment_status === 'matched' &&
            wineDetails.rating_average >= filters.minRating)) &&
        wineDetails.price <= filters.maxPrice &&
        (filters.typeFilter
          ? wineDetails.type_name === filters.typeFilter
          : true) &&
        (filters.formatFilter
          ? wineDetails.volume === filters.formatFilter
          : true),
    );

    // Apply sorting
    if (filters.sortBy !== 'default') {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'rating_asc':
            return a.rating_average - b.rating_average;
          case 'rating_desc':
            return b.rating_average - a.rating_average;
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [initialWinelist, filters]);

  // pagination logic
  const totalPages = Math.ceil(processedWinelist.length / itemsPerPage);
  const paginatedWinelist = useMemo(() => {
    return processedWinelist.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [processedWinelist, currentPage, itemsPerPage]);

  useEffect(() => {
    // Reset to page 1 whenever filters or page size change
    setCurrentPage(1);
  }, [filters, itemsPerPage, initialWinelist]);

  useEffect(() => {
    // If there's an active card, check if it's still in the filtered list
    if (activeKey !== 'none') {
      const isCardStillVisible = paginatedWinelist.some(
        (wine) => getWineKey(wine) === activeKey,
      );

      // If the active card is no longer visible, close it
      if (!isCardStillVisible) {
        setActiveKey('none');
      }
    }
  }, [paginatedWinelist, activeKey]);

  const matchedCount = initialWinelist.filter(
    (wine) => wine.enrichment_status === 'matched',
  ).length;
  const unmatchedCount = initialWinelist.filter(
    (wine) => wine.enrichment_status === 'unmatched',
  ).length;
  const failedCount = initialWinelist.filter(
    (wine) => wine.enrichment_status === 'lookup_failed',
  ).length;

  return (
    <div>
      <div role="status" className="mb-4 text-white">
        <p>
          Extracted: {initialWinelist.length} · Matched: {matchedCount} ·
          Visible: {processedWinelist.length}
        </p>
        <p>
          Unmatched: {unmatchedCount} · Lookup failed: {failedCount}
        </p>
        {(unmatchedCount > 0 || failedCount > 0) && (
          <p>Partial results: all extracted wines are retained.</p>
        )}
        {unmatchedCount > 0 && (
          <p>
            No Vivino match found for {unmatchedCount} wine(s). Original names
            are shown without ratings.
          </p>
        )}
        {failedCount > 0 && (
          <p>
            Temporary lookup failure for {failedCount} wine(s). Ratings are
            unavailable; try uploading again later.
          </p>
        )}
      </div>
      <Filters
        wineTypes={wineTypes}
        wineFormats={wineFormats}
        filters={filters}
        setFilters={setFilters}
      />
      <button
        type="button"
        className="mb-4 px-4 py-2 bg-gray-700 text-white rounded-md cursor-pointer"
        onClick={() => {
          setFilters({ ...DEFAULT_FILTERS });
          setActiveKey('none');
        }}
      >
        Reset filters
      </button>
      {initialWinelist.length === 0 ? (
        <p className="text-white">
          No wines were extracted from this file. Try another PDF.
        </p>
      ) : (
        <WineList
          winelist={paginatedWinelist}
          activeKey={activeKey}
          setActiveKey={setActiveKey}
        />
      )}
      {processedWinelist.length > 0 && (
        <Pagination
          currentPage={currentPage}
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
