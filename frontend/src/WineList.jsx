import React from 'react';

function WineList({ winelist, activeIndex, setActiveIndex }) {
    return (
      <div className='space-y-4'>
        {winelist.length ?
            winelist.map((wine, index) => {
            return (
                <WineCard 
                wine={wine}
                isActive={activeIndex === index}
                onToggle={() => setActiveIndex(activeIndex === index? -1 : index)}
                key={index}
                />
            );
            }) : 
            <div className='flex items-center justify-center text-white'>
                <p className='font-semibold text-sm md:text-base xl:text-lg 2xl:text-xl'>No Matches Found!</p>
            </div>
        }
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

export default WineList;