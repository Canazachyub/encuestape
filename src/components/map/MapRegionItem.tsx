interface MapRegionItemProps {
  regionCode: string;
  name: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export default function MapRegionItem({ name, count, isActive, onClick }: MapRegionItemProps) {
  const className = [
    'mapa-region-item',
    isActive ? 'active' : '',
    count > 0 ? 'has-data' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className} onClick={onClick}>
      <span className="mapa-region-item-name">{name}</span>
      <span className="mapa-region-item-count">{count}</span>
    </div>
  );
}
