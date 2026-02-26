import type { RegionCode } from '../../types';
import { REGIONES_PERU } from '../../config/constants';
import MapRegionItem from './MapRegionItem';

interface MapSidebarProps {
  selectedRegion: RegionCode | null;
  regionStats: Record<string, number>;
  onRegionClick: (region: RegionCode) => void;
}

export default function MapSidebar({ selectedRegion, regionStats, onRegionClick }: MapSidebarProps) {
  const sortedRegions = Object.entries(REGIONES_PERU)
    .filter(([key]) => key !== 'NACIONAL')
    .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre)) as [RegionCode, { nombre: string }][];

  const selectedName = selectedRegion && REGIONES_PERU[selectedRegion]
    ? REGIONES_PERU[selectedRegion].nombre
    : 'Todo el Peru';

  const selectedCount = selectedRegion ? (regionStats[selectedRegion] || 0) : 0;

  return (
    <div className="mapa-sidebar">
      <div className="mapa-info">
        <div className="mapa-info-title">{selectedName}</div>
        <div className="mapa-info-stats">
          {selectedRegion ? (
            selectedCount > 0
              ? <><span className="mono">{selectedCount}</span> encuesta{selectedCount !== 1 ? 's' : ''} activa{selectedCount !== 1 ? 's' : ''}</>
              : 'Sin encuestas activas por el momento'
          ) : (
            'Selecciona una region en el mapa'
          )}
        </div>
      </div>
      <div className="mapa-region-list">
        <div className="mapa-region-list-title">Regiones</div>
        <div>
          {sortedRegions.map(([key, data]) => (
            <MapRegionItem
              key={key}
              regionCode={key}
              name={data.nombre}
              count={regionStats[key] || 0}
              isActive={selectedRegion === key}
              onClick={() => onRegionClick(key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
