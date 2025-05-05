import React, { useState } from 'react';

function Filters ({winelist, minRating, setMinRating, maxPrice, setMaxPrice, setTypeFilter, setFormatFilter}) {
    // TODO: implement filters
    // 1. Filter by rating (minimum rating) -> useState (min_rating float) ratingThreshold
    // 2. Filter by price (maximum price) -> useState (max_price int) priceThreshold
    // 3. select by wine type -> useState (All, ...types) typeFilter
    // 4. Filter by format (750ml, 150ml, etc.) -> useState (All, ...formats) formatFilter
    // 5. Sort by (rating, price) sortBy -> priceAsc, priceDesc, ratingAsc, ratingDesc
    
    const wineTypes = [...new Set(winelist.map(wine => wine.type_name))];
    const formats = [...new Set(winelist.map(wine => wine.volume))];
    return (
      <div className='text-white width-full mb-4 grid grid-rows-2 grid-cols-12 gap-x-4'>
        <div className='col-span-full md:col-span-6'>
            <label className="font-semibold" htmlFor='ratingThreshold'>Min. Rating</label>
            <span className='float-right'>{Number(minRating).toFixed(1)}</span>
            <input type="range" min="3.0" max="5.0" defaultValue="4.0" step="0.1" id='ratingThreshold' className='w-full' onInput={(e) => {setMinRating(e.target.value)}} />
        </div>
        <div className='col-span-full md:col-span-6'>
            <label className="font-semibold" htmlFor='priceThreshold'>Max. Price ($)</label>
            <span className='float-right'>{maxPrice == 999999 ? "-" : maxPrice}</span>
            <input type="range" min="0" max="3005" defaultValue="1500" step="5" id='priceThreshold' className='w-full' onInput={(e) => {e.target.value == 3005 ? setMaxPrice(999999) : setMaxPrice(e.target.value)}} />
        </div>
        <div className='col-span-full md:col-span-4'>
          <label className="font-semibold" htmlFor='typeFilter'>Wine Type</label>
          <select className="w-full bg-gray-800 px-4 py-2.5 pr-8 rounded leading-tight" id='typeFilter' defaultValue="" onChange={(e) => {setTypeFilter(e.target.value)}}>
            <option value="">All</option>
            {
              wineTypes.map((type, index) => 
                <option key={index}>{type}</option>
              )
            }
          </select>
        </div>
        <div className='col-span-full md:col-span-4'>
          <label className="font-semibold" htmlFor='formatFilter'>Format</label>
          <select className="w-full bg-gray-800 px-4 py-2.5 pr-8 rounded leading-tight" id='formatFilter' defaultValue="0" onChange={(e) => {setFormatFilter(Number(e.target.value))}}>
          <option value={0}>All</option>
            {
              formats.map((format, index) => 
                <option key={index} value={format}>{format} ml</option>
              )
            }
          </select>
        </div>
        <div className='col-span-full md:col-span-4'>
          <label className="font-semibold" htmlFor='sortByFilter'>Sort By</label>
          <select className="w-full bg-gray-800 px-4 py-2.5 pr-8 rounded leading-tight" id='sortByFilter'>
            <option>test</option>
            <option>asdg</option>
          </select>
        </div>
      </div>
    );
  }
  
  function WineList({ winelist, minRating, maxPrice, typeFilter, formatFilter }) {
    const [activeIndex, setActiveIndex] = useState(-1); // -1 if no card is open
    function checkFilters(wineDetails) {
      return (typeFilter ? wineDetails.type_name == typeFilter : true) && (formatFilter ? wineDetails.volume == formatFilter : true);
    }
    const filteredWinelist = winelist.filter(
      wineDetails => wineDetails.rating_average >= minRating && wineDetails.price <= maxPrice && checkFilters(wineDetails)
    );
    return (
      <div className='space-y-4'>
        {filteredWinelist.map((wine, index) => {
          return (
            <WineCard 
              wine={wine}
              isActive={activeIndex === index}
              onToggle={() => setActiveIndex(activeIndex === index? -1 : index)}
              key={index}
            />
          );
        })}
      </div>
    );
  }
  
  function WineCard({ wine, isActive, onToggle }) {
    return (
      <>
        <details open={isActive} className='rounded-md marker:content-none'>
          <summary className='p-4 bg-gray-700 cursor-pointer' onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}>
            <div className='flex items-center justify-between text-white'>
              <div className='font-semibold text-sm md:text-base xl:text-lg 2xl:text-xl'>{wine.vivino_match}</div>
              <div className='font-medium text-right text-xs md:text-sm xl:text-base 2xl:text-lg'>{wine.rating_average} &#9733; ({wine.rating_count} reviews) &middot; {wine.type_name} &middot; ${wine.price}</div>
            </div>
          </summary>
          <div className='p-4 bg-gray-600 text-gray-200 text-xs md:text-sm xl:text-base 2xl:text-lg'>
            <p><strong>Name on Wine List:</strong> {wine.wine_name} {wine.vintage}</p>
            <p><strong>Style:</strong> {wine.style_name}</p>
            <p><strong>Grapes:</strong> {wine.grapes_name}</p>
            <p><strong>Volume:</strong> {wine.volume}</p>
          </div>
        </details>
      </>
    );
  }
  
  function FilterableWineList ({ winelist }) {
    const [minRating, setMinRating] = useState(4.0);
    const [maxPrice, setMaxPrice] = useState(1500);
    const [typeFilter, setTypeFilter] = useState("");
    const [formatFilter, setFormatFilter] = useState(0);
    return (
      <div>
        <Filters winelist={winelist} {...{minRating, setMinRating, maxPrice, setMaxPrice, setTypeFilter, setFormatFilter}}/>
        <WineList winelist={winelist} {...{minRating, maxPrice, typeFilter, formatFilter}}/>
      </div>
    )
  };

  export default FilterableWineList;