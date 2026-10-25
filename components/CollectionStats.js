import useApi from '../hooks/useApi';

export function eth(value) {
  if (value === null || value === undefined) return '---';
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: 3 }) + 'Ξ';
}

function Stat({ label, children, className = '' }) {
  return (
    <div className={`mr-8 mb-2 ${className}`}>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-lg">{children}</p>
    </div>
  );
}

// Listed / Floor / Last Sale / vPhree Volume row. `summary` comes from the collection stats APIs.
// Volume is hidden on mobile (see .stat-desktop-only in globals.css) to keep the row on one line.
const CollectionStats = ({ summary }) => (
  <div className="collection-desc collection-stats flex flex-wrap">
    <Stat label="Listed">{summary ? summary.listedCount : '---'}</Stat>
    <Stat label="Floor">{eth(summary?.floor)}</Stat>
    <Stat label="Last Sale">{eth(summary?.lastSale?.price)}</Stat>
    <Stat label="vPhree Volume" className="stat-desktop-only">{eth(summary?.volume)}</Stat>
  </div>
);

// Self-contained stats row for a market page: fetches its collection's stats.
export const CollectionStatsCard = ({ collection }) => {
  const { data } = useApi(`/api/collections/${collection}/stats`);

  return (
    <div className="mb-6">
      <CollectionStats summary={data}/>
    </div>
  );
};

export default CollectionStats;
