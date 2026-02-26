import { useCallback, useState } from 'react';
import type { RegionCode } from '../../types';
import { useDemoData } from '../../context/DemoDataContext';
import PeruMapSVG from './PeruMapSVG';
import MapTooltip from './MapTooltip';
import MapSidebar from './MapSidebar';

interface PeruMapProps {
  onRegionChange: (region: RegionCode | null) => void;
  selectedRegion: RegionCode | null;
}

export default function PeruMap({ onRegionChange, selectedRegion }: PeruMapProps) {
  const { api } = useDemoData();
  const regionStats = api.getRegionStats();

  const [tooltip, setTooltip] = useState<{
    region: RegionCode | null;
    position: { x: number; y: number };
    visible: boolean;
  }>({ region: null, position: { x: 0, y: 0 }, visible: false });

  const handleRegionClick = useCallback((region: RegionCode) => {
    onRegionChange(selectedRegion === region ? null : region);
  }, [selectedRegion, onRegionChange]);

  const handleRegionHover = useCallback((region: RegionCode | null, e?: React.MouseEvent) => {
    if (region && e) {
      setTooltip({ region, position: { x: e.clientX, y: e.clientY }, visible: true });
    } else {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  }, []);

  return (
    <div className="mapa-layout">
      <div className="mapa-container">
        <div id="peruMapContainer">
          <PeruMapSVG
            selectedRegion={selectedRegion}
            regionStats={regionStats}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
          />
        </div>
        <div className="mapa-legend">
          <span className="mapa-legend-item"><span className="mapa-legend-dot active"></span> Con encuestas</span>
          <span className="mapa-legend-item"><span className="mapa-legend-dot inactive"></span> Sin datos</span>
          <span className="mapa-legend-item"><span className="mapa-legend-dot selected"></span> Seleccionada</span>
        </div>
      </div>

      <MapSidebar
        selectedRegion={selectedRegion}
        regionStats={regionStats}
        onRegionClick={handleRegionClick}
      />

      <MapTooltip
        region={tooltip.region}
        regionStats={regionStats}
        position={tooltip.position}
        visible={tooltip.visible}
      />
    </div>
  );
}
