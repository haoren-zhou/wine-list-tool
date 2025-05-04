import React, { useState } from 'react';

function Filters () {
    // TODO: implement filters
    // 1. Filter by rating (minimum rating) -> useState (min_rating float) ratingThreshold
    // 2. Filter by price (maximum price) -> useState (max_price int) priceThreshold
    // 3. select by wine type -> useState (All, ...types) typeFilter
    // 4. Filter by format (750ml, 150ml, etc.) -> useState (All, ...formats) formatFilter
    // 5. Sort by (rating, price) sortBy -> priceAsc, priceDesc, ratingAsc, ratingDesc
    const [minRating, setMinRating] = useState(4.0);
    const [maxPrice, setMaxPrice] = useState(1500);
    return (
      <div className='text-white width-full mb-4 grid grid-rows-2 grid-cols-12 gap-2'>
        <div className='col-span-full md:col-span-6'>
            <label htmlFor='ratingThreshold'>Min. Rating</label>
            <span className='float-right'>{Number(minRating).toFixed(1)}</span>
            <input type="range" min="3.0" max="5.0" defaultValue="4.0" step="0.1" id='ratingThreshold' className='w-full' onInput={(e) => {setMinRating(e.target.value)}} />
        </div>
        <div className='col-span-full md:col-span-6'>
            <label htmlFor='priceThreshold'>Max. Price ($)</label>
            <span className='float-right'>{maxPrice == 999999 ? "-" : maxPrice}</span>
            <input type="range" min="0" max="3005" defaultValue="1500" step="5" id='priceThreshold' className='w-full' onInput={(e) => {e.target.value == 3005 ? setMaxPrice(999999) : setMaxPrice(e.target.value)}} />
        </div>
        <div className='col-span-full md:col-span-4'>
          <label htmlFor='typeFilter'>Wine Type</label>
          <select className="w-full bg-gray-800 px-4 py-2.5 pr-8 rounded leading-tight" id='typeFilter'>
            <option>test</option>
            <option>asdg</option>
          </select>
        </div>
        <div className='col-span-full md:col-span-4'>
          <label htmlFor='formatFilter'>Format</label>
          <select className="w-full bg-gray-800 px-4 py-2.5 pr-8 rounded leading-tight" id='formatFilter'>
            <option>test</option>
            <option>asdg</option>
          </select>
        </div>
        <div className='col-span-full md:col-span-4'>
          <label htmlFor='sortByFilter'>Sort By</label>
          <select className="w-full bg-gray-800 px-4 py-2.5 pr-8 rounded leading-tight" id='sortByFilter'>
            <option>test</option>
            <option>asdg</option>
          </select>
        </div>
      </div>
    );
  }
  
  function WineList({ winelist }) {
    const [activeIndex, setActiveIndex] = useState(-1); // -1 if no card is open
    return (
      <div className='space-y-4'>
        {winelist.map((wine, index) => {
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
    return (
      <div>
        <Filters />
        <WineList winelist={winelist}/>
      </div>
    )
  };

  export default FilterableWineList;