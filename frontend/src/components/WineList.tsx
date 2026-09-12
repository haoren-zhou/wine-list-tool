import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import type { Wine } from '../types';
import { getWineKey } from '../utils/wine';

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
          const key = getWineKey(wine);
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
            No wines match these filters. Reset filters to see all extracted
            wines.
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
  const detailsId = useId();
  const matched = wine.enrichment_status === 'matched';

  return (
    <div className="bg-gray-700 rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full p-4 cursor-pointer text-left"
        onClick={onToggle}
        aria-expanded={isActive}
        aria-controls={detailsId}
      >
        <div className="flex items-center justify-between text-white">
          <div className="font-semibold text-sm md:text-base xl:text-lg 2xl:text-xl">
            {matched && wine.vivino_match ? wine.vivino_match : wine.wine_name}
          </div>
          <div className="font-medium text-right text-xs md:text-sm xl:text-base 2xl:text-lg">
            {matched && wine.rating_average > 0
              ? `${wine.rating_average} ★ (${wine.rating_count} reviews)`
              : 'Rating unavailable'}{' '}
            &middot; {wine.type_name} &middot; ${wine.price}
            {!matched && (
              <span className="block">
                {wine.enrichment_status === 'lookup_failed'
                  ? 'Temporary lookup failure'
                  : 'No Vivino match found'}
              </span>
            )}
          </div>
        </div>
      </button>
      <div id={detailsId} hidden={!isActive} className="overflow-hidden">
        <div className="p-4 bg-gray-600 text-gray-200 text-xs md:text-sm xl:text-base 2xl:text-lg">
          <p>
            <strong>Name on Wine List:</strong> {wine.wine_name}
            {matched &&
              ` (${(wine.match_coefficient * 100).toFixed(0)}% match)`}
          </p>
          <p>
            <strong>Style:</strong> {wine.style_name}
          </p>
          <p>
            <strong>Grapes:</strong> {wine.grapes_name}
          </p>
          <p>
            <strong>Vintage:</strong> {wine.vintage ?? 'N.A.'}
          </p>
          <p>
            <strong>Volume:</strong> {wine.volume} ml
          </p>
        </div>
      </div>
    </div>
  );
}

export default WineList;
