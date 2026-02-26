import { useState } from 'react';
import type { Encuesta, ResultadoOpcion } from '../../types';
import { getChartColors } from '../../utils/helpers';
import { findCandidateData, getInitials } from '../../utils/helpers';
import { formatNumber } from '../../utils/format';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const INITIAL_LIMIT = 15;

interface ResultBarsProps {
  resultados: ResultadoOpcion[];
  encuesta?: Encuesta | null;
}

export default function ResultBars({ resultados, encuesta }: ResultBarsProps) {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const [showAll, setShowAll] = useState(false);
  const colors = getChartColors(resultados.length);

  const needsTruncation = resultados.length > INITIAL_LIMIT;
  const visible = showAll ? resultados : resultados.slice(0, INITIAL_LIMIT);

  return (
    <div ref={sectionRef}>
      {visible.map((r, i) => {
        const candidate = encuesta ? findCandidateData(encuesta, r.opcion) : null;
        const hvUrl = candidate?.url_hoja_vida;

        return (
          <div className="result-bar-item" key={r.opcion}>
            <div className="result-bar-label">
              <span className="result-bar-name">
                {candidate && (
                  <div className="result-bar-identity">
                    <CandidateAvatar fotoUrl={candidate.foto_url} name={r.opcion} />
                    {candidate.logo_partido_url && (
                      <PartyLogo logoUrl={candidate.logo_partido_url} partido={candidate.partido} />
                    )}
                  </div>
                )}
                <span className="result-bar-info">
                  <span className="result-bar-candidate-line">
                    {candidate?.numero != null && (
                      <span className="result-bar-numero">N.° {candidate.numero}</span>
                    )}
                    {r.opcion}
                    {hvUrl && (
                      <a href={hvUrl} target="_blank" rel="noopener noreferrer" className="result-bar-hv"
                        title="Ver hoja de vida / fórmula presidencial"
                        onClick={e => e.stopPropagation()}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </span>
                  {candidate?.partido && (
                    <span className="result-bar-partido">{candidate.partido}</span>
                  )}
                </span>
              </span>
              <span className="result-bar-stats">
                <span className="result-bar-value">{r.porcentaje}%</span>
                <span className="result-bar-count">({formatNumber(r.cantidad)} votos)</span>
              </span>
            </div>
            <div className="result-bar-track">
              <div
                className="result-bar-fill"
                style={{
                  width: isVisible ? `${r.porcentaje}%` : '0%',
                  background: colors[i],
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>
        );
      })}

      {needsTruncation && (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowAll(!showAll)}
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            {showAll
              ? 'Mostrar menos'
              : `Ver todos (${resultados.length} candidatos)`
            }
          </button>
        </div>
      )}
    </div>
  );
}

function CandidateAvatar({ fotoUrl, name }: { fotoUrl: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  if (!fotoUrl || imgError) {
    return <span className="result-bar-initials">{initials}</span>;
  }

  return (
    <img
      src={fotoUrl}
      alt=""
      className="result-bar-avatar"
      onError={() => setImgError(true)}
    />
  );
}

function PartyLogo({ logoUrl, partido }: { logoUrl: string; partido: string }) {
  const [err, setErr] = useState(false);

  if (!logoUrl || err) {
    return (
      <span className="result-bar-party-badge" title={partido}>
        {partido.substring(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={partido}
      title={partido}
      className="result-bar-party-logo"
      onError={() => setErr(true)}
    />
  );
}
