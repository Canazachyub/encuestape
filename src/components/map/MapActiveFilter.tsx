interface MapActiveFilterProps {
  label: string;
  visible: boolean;
  onClear: () => void;
}

export default function MapActiveFilter({ label, visible, onClear }: MapActiveFilterProps) {
  if (!visible) return null;

  return (
    <div className="mapa-active-filter visible">
      <span>Filtrando por:</span>
      <span className="mapa-active-filter-label">{label}</span>
      <button className="mapa-active-filter-clear" onClick={onClear}>
        Limpiar filtro
      </button>
    </div>
  );
}
