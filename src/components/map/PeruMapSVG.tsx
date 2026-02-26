import { REGION_PATHS } from './regionPaths';
import type { RegionCode } from '../../types';

interface PeruMapSVGProps {
  selectedRegion: RegionCode | null;
  regionStats: Record<string, number>;
  onRegionClick: (region: RegionCode) => void;
  onRegionHover: (region: RegionCode | null, e?: React.MouseEvent) => void;
}

export default function PeruMapSVG({ selectedRegion, regionStats, onRegionClick, onRegionHover }: PeruMapSVGProps) {
  return (
    <svg id="peruMapSvg" className="mapa-svg" viewBox="0 0 800 1168" xmlns="http://www.w3.org/2000/svg">
      {(Object.entries(REGION_PATHS) as [RegionCode, string][]).map(([region, d]) => {
        const hasData = (regionStats[region] || 0) > 0;
        const isSelected = selectedRegion === region;
        const classNames = [
          'mapa-region',
          hasData ? 'has-encuestas' : '',
          isSelected ? 'selected' : '',
        ].filter(Boolean).join(' ');

        return (
          <path
            key={region}
            data-region={region}
            className={classNames}
            d={d}
            onClick={() => onRegionClick(region)}
            onMouseEnter={(e) => onRegionHover(region, e)}
            onMouseMove={(e) => onRegionHover(region, e)}
            onMouseLeave={() => onRegionHover(null)}
          />
        );
      })}
    </svg>
  );
}
