import type { RegionCode } from '../../types';
import PeruMap from '../map/PeruMap';
import MapFilterPills from '../map/MapFilterPills';

interface MapSectionProps {
  selectedRegion: RegionCode | null;
  currentTipo: string;
  onRegionChange: (region: RegionCode | null) => void;
  onTipoChange: (tipo: string) => void;
}

export default function MapSection({ selectedRegion, currentTipo, onRegionChange, onTipoChange }: MapSectionProps) {
  return (
    <section className="section mapa-section" id="explorar">
      <div className="container">
        <h2 className="section-title">Explora por Region</h2>
        <p className="section-subtitle">Selecciona una region para ver sus encuestas</p>

        <MapFilterPills currentTipo={currentTipo} onTipoChange={onTipoChange} />

        <PeruMap
          onRegionChange={onRegionChange}
          selectedRegion={selectedRegion}
        />
      </div>
    </section>
  );
}
