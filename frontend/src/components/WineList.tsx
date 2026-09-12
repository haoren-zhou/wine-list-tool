import type { Dispatch, SetStateAction } from 'react';
import { useId } from 'react';
import type { Wine } from '../types';
import { formatPrice, getWineKey } from '../utils/wine';

interface WineListProps {
  winelist: Wine[];
  activeKey: string;
  setActiveKey: Dispatch<SetStateAction<string>>;
}

function WineList({ winelist, activeKey, setActiveKey }: WineListProps) {
  return (
    <div className="wine-list">
      <div className="wine-columns" aria-hidden="true">
        <span>Wine</span>
        <span>Vivino rating</span>
        <span>Price</span>
        <span />
      </div>
      <ul>
        {winelist.map((wine) => {
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
        })}
      </ul>
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
  const rated = matched && wine.rating_average > 0;
  const typeColor = [
    'Red',
    'White',
    'Rosé',
    'Sparkling',
    'Dessert',
    'Fortified',
  ].includes(wine.type_name)
    ? wine.type_name.toLowerCase()
    : 'other';
  return (
    <li className={`wine-card${isActive ? ' is-expanded' : ''}`}>
      <button
        type="button"
        className="wine-row"
        onClick={onToggle}
        aria-expanded={isActive}
        aria-controls={detailsId}
      >
        <span className="wine-identity">
          <span className="wine-name">{wine.wine_name}</span>
          <span className="wine-meta">
            <span className={`wine-dot type-${typeColor}`} aria-hidden="true" />
            {wine.vintage ?? 'Vintage not listed'} · {wine.type_name} ·{' '}
            {wine.volume} ml
          </span>
        </span>
        <span className="wine-rating">
          {rated ? (
            <>
              <span className="rating-value">
                {wine.rating_average.toFixed(1)}{' '}
                <span className="star" aria-hidden="true">
                  ★
                </span>
                <span className="sr-only">stars on Vivino</span>
              </span>
              <span className="rating-caption">
                {wine.rating_count.toLocaleString('en-US')} reviews
              </span>
            </>
          ) : (
            <>
              <span className="unrated">Rating unavailable</span>
              <span
                className={`rating-caption${wine.enrichment_status === 'lookup_failed' ? ' lookup-warning' : ''}`}
              >
                {wine.enrichment_status === 'lookup_failed'
                  ? 'Lookup failed'
                  : matched
                    ? 'No rating listed'
                    : 'No Vivino match'}
              </span>
            </>
          )}
        </span>
        <span className="wine-price">
          <span className="sr-only">Price </span>
          {formatPrice(wine.price)}
        </span>
        <svg
          className="chevron"
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      <div id={detailsId} hidden={!isActive} className="wine-details">
        <dl>
          <div>
            <dt>Style</dt>
            <dd>{wine.style_name}</dd>
          </div>
          <div>
            <dt>Grapes</dt>
            <dd>{wine.grapes_name}</dd>
          </div>
          {matched && (
            <>
              <div>
                <dt>Vivino match</dt>
                <dd>{wine.vivino_match || 'Not available'}</dd>
              </div>
              <div>
                <dt>Name similarity</dt>
                <dd>
                  <span
                    className="similarity-score"
                    title="Dice similarity: shared character pairs in the two names, ignoring case and punctuation."
                  >
                    {(wine.match_coefficient * 100).toFixed(0)}%
                  </span>
                </dd>
              </div>
            </>
          )}
          {!matched && (
            <div className="unmatched-note">
              <dt>Rating information</dt>
              <dd>
                {wine.enrichment_status === 'lookup_failed'
                  ? 'The rating service was unavailable. Try uploading again later.'
                  : 'We couldn’t find a Vivino match. The name and price come from your PDF.'}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </li>
  );
}
export default WineList;
