import { TIPOS_ELECCION } from '../../config/constants';
import type { TipoEleccionCode } from '../../types';

interface MapFilterPillsProps {
  currentTipo: string;
  onTipoChange: (tipo: string) => void;
}

export default function MapFilterPills({ currentTipo, onTipoChange }: MapFilterPillsProps) {
  return (
    <div className="tipo-pills">
      <button
        className={`tipo-pill${currentTipo === 'TODOS' ? ' active' : ''}`}
        onClick={() => onTipoChange('TODOS')}
      >
        Todas
      </button>
      {(Object.entries(TIPOS_ELECCION) as [TipoEleccionCode, { nombre: string }][]).map(([key, data]) => {
        if (key === 'GENERAL') return null;
        return (
          <button
            key={key}
            className={`tipo-pill${currentTipo === key ? ' active' : ''}`}
            onClick={() => onTipoChange(key)}
          >
            {data.nombre}
          </button>
        );
      })}
    </div>
  );
}
