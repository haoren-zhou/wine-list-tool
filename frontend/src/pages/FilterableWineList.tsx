import { useEffect, useMemo, useState } from 'react';
import type { FilterOptions } from '../components/Filters';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';
import WineList from '../components/WineList';
import type { Wine } from '../types';

interface FilterableWineListProps {
  initialWinelist: Wine[];
}

function FilterableWineList({ initialWinelist }: FilterableWineListProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    minRating: 4.0,
    maxPrice: 1500,
    typeFilter: '',
    formatFilter: 0,
    sortBy: 'default',
  });
  const [activeKey, setActiveKey] = useState<string>('none'); // none if no card is open

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const wineTypes: string[] = [
    ...new Set(initialWinelist.map((wine) => wine.type_name)),
  ];
  const wineFormats: number[] = [
    ...new Set(initialWinelist.map((wine) => wine.volume)),
  ].sort((a, b) => {
    return a - b; // sort formats by volume ascending
  });

  const processedWinelist: Wine[] = useMemo(() => {
    let filtered = initialWinelist.filter(
      (wineDetails) =>
        wineDetails.rating_average >= filters.minRating &&
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
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    // If there's an active card, check if it's still in the filtered list
    if (activeKey !== 'none') {
      const isCardStillVisible = paginatedWinelist.some((wine) => {
        const key = `${wine.wine_name}-${wine.vintage}-${wine.volume}`;
        return key === activeKey;
      });

      // If the active card is no longer visible, close it
      if (!isCardStillVisible) {
        setActiveKey('none');
      }
    }
  }, [paginatedWinelist, activeKey]);

  return (
    <div>
      <Filters
        wineTypes={wineTypes}
        wineFormats={wineFormats}
        filters={filters}
        setFilters={setFilters}
      />
      <WineList
        winelist={paginatedWinelist}
        activeKey={activeKey}
        setActiveKey={setActiveKey}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default FilterableWineList;
