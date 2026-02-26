import type { RegionCode } from '../../types';
import { REGIONES_PERU } from '../../config/constants';

interface MapTooltipProps {
  region: RegionCode | null;
  regionStats: Record<string, number>;
  position: { x: number; y: number };
  visible: boolean;
}

export default function MapTooltip({ region, regionStats, position, visible }: MapTooltipProps) {
  if (!visible || !region) return null;

  const regionData = REGIONES_PERU[region];
  const count = regionStats[region] || 0;
  const name = regionData ? regionData.nombre : region;

  return (
    <div
      className="mapa-tooltip visible"
      style={{
        left: position.x + 14,
        top: position.y - 10,
        position: 'fixed',
      }}
    >
      {name}
      {count > 0 && (
        <span className="mapa-tooltip-count">
          {count} encuesta{count !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
