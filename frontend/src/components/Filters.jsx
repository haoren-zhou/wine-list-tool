import React from 'react';

function Filters ({ wineTypes, wineFormats, filters, setFilters }) {
  // TODO: implement filters
  // 1. Filter by rating (minimum rating) -> useState (min_rating float) ratingThreshold
  // 2. Filter by price (maximum price) -> useState (max_price int) priceThreshold
  // 3. select by wine type -> useState (All, ...types) typeFilter
  // 4. Filter by format (750ml, 150ml, etc.) -> useState (All, ...formats) formatFilter
  // 5. Sort by (rating, price) sortBy -> priceAsc, priceDesc, ratingAsc, ratingDesc

  const handleMinRatingChange = (e) => {
    setFilters(prevFilters => ({
        ...prevFilters,
        minRating: parseFloat(e.target.value)
    }));
  };
  const handleMaxPriceChange = (e) => {
    var newMaxPrice = parseFloat(e.target.value)
    newMaxPrice = newMaxPrice == 3005 ? Infinity : newMaxPrice
    setFilters(prevFilters => ({
        ...prevFilters,
        maxPrice: newMaxPrice
    }));
  };
  const handleTypeFilterChange = (e) => {
    setFilters(prevFilters => ({
        ...prevFilters,
        typeFilter: e.target.value
    }));
  };
  const handleFormatFilterChange = (e) => {
    setFilters(prevFilters => ({
        ...prevFilters,
        formatFilter: parseFloat(e.target.value)
    }));
  };
  const handleSortByChange = (e) => {
    setFilters(prevFilters => ({
        ...prevFilters,
        sortBy: e.target.value
    }));
  };


  return (
    <div className='text-white width-full mb-4 grid grid-rows-2 grid-cols-12 gap-x-4 text-xs md:text-sm xl:text-base 2xl:text-lg'>
      <div className='col-span-full md:col-span-6'>
          <label className="font-semibold" htmlFor='ratingThreshold'>Min. Rating</label>
          <span className='float-right'>{Number(filters.minRating).toFixed(1)}</span>
          <input type="range" min="3.0" max="5.0" defaultValue="4.0" step="0.1" id='ratingThreshold' className='w-full' onInput={handleMinRatingChange} />
      </div>
      <div className='col-span-full md:col-span-6'>
          <label className="font-semibold" htmlFor='priceThreshold'>Max. Price ($)</label>
          <span className='float-right'>{filters.maxPrice > 3000 ? "-" : filters.maxPrice}</span>
          <input type="range" min="0" max="3005" defaultValue="1500" step="5" id='priceThreshold' className='w-full' onInput={handleMaxPriceChange} />
      </div>
      <div className='col-span-full md:col-span-4 mt-1 md:mt-0'>
        <label className="font-semibold" htmlFor='typeFilter'>Wine Type</label>
        <select className="w-full bg-gray-800 px-2.5 py-2 pr-8 rounded leading-tight" id='typeFilter' defaultValue="" onChange={handleTypeFilterChange}>
          <option value="">All</option>
          {
            wineTypes.map((type, index) => 
              <option key={index}>{type}</option>
            )
          }
        </select>
      </div>
      <div className='col-span-full md:col-span-4 mt-1 md:mt-0'>
        <label className="font-semibold" htmlFor='formatFilter'>Format</label>
        <select className="w-full bg-gray-800 px-2.5 py-2 pr-8 rounded leading-tight" id='formatFilter' defaultValue="0" onChange={handleFormatFilterChange}>
        <option value={0}>All</option>
          {
            wineFormats.map((format, index) => 
              <option key={index} value={format}>{format} ml</option>
            )
          }
        </select>
      </div>
      <div className='col-span-full md:col-span-4 mt-1 md:mt-0'>
        <label className="font-semibold" htmlFor='sortByFilter'>Sort By</label>
        <select className="w-full bg-gray-800 px-2.5 py-2 pr-8 rounded leading-tight" id='sortByFilter' value={filters.sortBy} onChange={handleSortByChange}>
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