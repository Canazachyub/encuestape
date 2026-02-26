import { Link } from 'react-router-dom';
import type { Encuesta } from '../../types';
import { REGIONES_PERU, TIPOS_ELECCION } from '../../config/constants';
import { formatNumber } from '../../utils/format';

interface EncuestaCardProps {
  encuesta: Encuesta;
}

export default function EncuestaCard({ encuesta }: EncuestaCardProps) {
  const progress = encuesta.meta_votos > 0
    ? Math.min(100, Math.round((encuesta.total_votos / encuesta.meta_votos) * 100))
    : 0;

  const isActive = encuesta.estado === 'activa';
  const badgeClass = isActive ? 'badge-active' : encuesta.estado === 'cerrada' ? 'badge-closed' : 'badge-upcoming';
  const badgeText = isActive ? 'Activa' : encuesta.estado === 'cerrada' ? 'Cerrada' : 'Próxima';
  const btnText = isActive ? 'Participar' : 'Ver resultados';
  const btnHref = isActive ? `/votar/${encuesta.id}` : `/resultados/${encuesta.id}`;

  const regionName = REGIONES_PERU[encuesta.region] ? REGIONES_PERU[encuesta.region].nombre : '';
  const tipoName = TIPOS_ELECCION[encuesta.tipo_eleccion] ? TIPOS_ELECCION[encuesta.tipo_eleccion].nombre : '';

  return (
    <div className="card encuesta-card">
      <div className="card-header">
        <span className="card-category">
          {tipoName || encuesta.categoria}
          {regionName && encuesta.region !== 'NACIONAL' && (
            <span className="card-region-badge">{regionName}</span>
          )}
        </span>
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </div>
      <h3 className="card-title">{encuesta.titulo}</h3>
      <p className="card-desc">{encuesta.descripcion}</p>
      <div className="card-progress">
        <div className="card-progress-info">
          <span><span className="mono">{formatNumber(encuesta.total_votos)}</span> / {formatNumber(encuesta.meta_votos)}</span>
          <span className="mono">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="card-footer">
        <Link to={btnHref} className={`btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm`}>
          {btnText} →
        </Link>
        <Link to={`/resultados/${encuesta.id}`} className="btn btn-outline btn-sm" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
          Resultados
        </Link>
      </div>
    </div>
  );
}
