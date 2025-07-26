import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Wine } from '../types';

interface WineListProps {
  winelist: Wine[];
  activeKey: string;
  setActiveKey: Dispatch<SetStateAction<string>>;
}

function WineList({ winelist, activeKey, setActiveKey }: WineListProps) {
  return (
    <div className="space-y-4">
      {winelist.length ? (
        winelist.map((wine) => {
          const key = `${wine.wine_name}-${wine.vintage}-${wine.volume}`;
          const isActive = activeKey === key;
          return (
            <WineCard
              wine={wine}
              isActive={isActive}
              onToggle={() => setActiveKey(isActive ? 'none' : key)}
              key={key}
            />
          );
        })
      ) : (
        <div className="flex items-center justify-center text-white">
          <p className="font-semibold text-sm md:text-base xl:text-lg 2xl:text-xl">
            No Matches Found!
          </p>
        </div>
      )}
    </div>
  );
}

interface WineCardProps {
  wine: Wine;
  isActive: boolean;
  onToggle: () => void;
}

function WineCard({ wine, isActive, onToggle }: WineCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState('0px');

  useEffect(() => {
    // Set the height of the content for the animation
    if (contentRef.current) {
      setContentHeight(
        isActive ? `${contentRef.current.scrollHeight}px` : '0px',
      );
    }
  }, [isActive]);

  return (
    <div className="bg-gray-700 rounded-md overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between text-white">
          <div className="font-semibold text-sm md:text-base xl:text-lg 2xl:text-xl">
            {wine.vivino_match}
          </div>
          <div className="font-medium text-right text-xs md:text-sm xl:text-base 2xl:text-lg">
            {wine.rating_average} &#9733; ({wine.rating_count} reviews) &middot;{' '}
            {wine.type_name} &middot; ${wine.price}
          </div>
        </div>
      </div>
      <div
        ref={contentRef}
        style={{
          maxHeight: `${contentHeight}`,
          transition: 'max-height 0.3s ease-in-out',
        }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-gray-600 text-gray-200 text-xs md:text-sm xl:text-base 2xl:text-lg">
          <p>
            <strong>Name on Wine List:</strong> {wine.wine_name} {wine.vintage}
          </p>
          <p>
            <strong>Style:</strong> {wine.style_name}
          </p>
          <p>
            <strong>Grapes:</strong> {wine.grapes_name}
          </p>
          <p>
            <strong>Volume:</strong> {wine.volume}
          </p>
        </div>
      </div>
    </div>
  );
}

export default WineList;
