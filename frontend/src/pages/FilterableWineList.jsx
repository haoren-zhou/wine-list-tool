import React, { useState, useMemo, useEffect } from 'react';
import WineList from '../components/WineList';
import Filters from '../components/Filters';

function FilterableWineList ({ initialWinelist }) 
{
  const [filters, setFilters] = useState({
    minRating: 4.0,
    maxPrice: 1500,
    typeFilter: "",
    formatFilter: 0,
    sortBy: "default"
  });
  const [activeIndex, setActiveIndex] = useState(-1); // -1 if no card is open
  
  const wineTypes = [...new Set(initialWinelist.map(wine => wine.type_name))];
  const wineFormats = [...new Set(initialWinelist.map(wine => wine.volume))].sort((a, b) => {
    return a - b; // sort formats by volume ascending
  });

  const processedWinelist = useMemo(() => {
    let filtered = initialWinelist.filter(wineDetails =>
      (wineDetails.rating_average >= filters.minRating) &&
      (wineDetails.price <= filters.maxPrice) &&
      (filters.typeFilter ? wineDetails.type_name === filters.typeFilter : true) &&
      (filters.formatFilter ? wineDetails.volume === filters.formatFilter : true)
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

  useEffect(() => {
    // only reset if an item was actually active, to avoid unnecessary re-renders
    setActiveIndex(prevActiveIndex => {
      if (prevActiveIndex !== -1) {
        return -1; // reset to -1
      }
      return prevActiveIndex;
    });
  }, [processedWinelist]);

  return (
    <div>
      <Filters wineTypes={wineTypes} wineFormats={wineFormats} filters={filters} setFilters={setFilters}/>
      <WineList winelist={processedWinelist} activeIndex={activeIndex} setActiveIndex={setActiveIndex}/>
    </div>
  )
};

export default FilterableWineList;