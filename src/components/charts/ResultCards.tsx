import { useState } from 'react';
import type { CandidateOption, Encuesta, ResultadoOpcion } from '../../types';
import { findCandidateData, getInitials, getChartColors } from '../../utils/helpers';
import { formatNumber } from '../../utils/format';
import { findPartyLogo } from '../../config/party-logos';

const CARDS_LIMIT = 12;

interface ResultCardsProps {
  resultados: ResultadoOpcion[];
  encuesta?: Encuesta | null;
  allEncuestas?: Encuesta[];
}

/**
 * Busca el logo_partido_url de un partido en todas las encuestas disponibles
 * (especialmente la presidencial donde los logos ya están correctos).
 */
/**
 * Busca el logo de un partido SOLO en la encuesta de Presidente
 * (donde los logos están correctos). Usa contains matching para
 * variantes de nombre (ej: "AHORA NACION - AN" contiene "Ahora Nacion").
 */
function findLogoFromPresidente(partyName: string, allEncuestas: Encuesta[]): string {
  if (!partyName || !allEncuestas.length) return '';

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const needle = normalize(partyName);

  // Only look in Presidente encuestas
  const presEncuestas = allEncuestas.filter(e => e.tipo_eleccion === 'PRESIDENTE');

  // Exact match first
  for (const enc of presEncuestas) {
    for (const opt of enc.opciones) {
      if (typeof opt === 'object' && opt.logo_partido_url) {
        if (normalize(opt.partido) === needle) return opt.logo_partido_url;
      }
    }
  }

  // Contains match
  for (const enc of presEncuestas) {
    for (const opt of enc.opciones) {
      if (typeof opt === 'object' && opt.logo_partido_url) {
        const optParty = normalize(opt.partido);
        if (needle.includes(optParty) || optParty.includes(needle)) {
          return opt.logo_partido_url;
        }
      }
    }
  }
  return '';
}

export default function ResultCards({ resultados, encuesta, allEncuestas = [] }: ResultCardsProps) {
  const [showAll, setShowAll] = useState(false);
  const colors = getChartColors(resultados.length);
  const maxPct = resultados.length > 0 ? parseFloat(resultados[0].porcentaje) : 1;

  const visible = showAll ? resultados : resultados.slice(0, CARDS_LIMIT);
  const needsMore = resultados.length > CARDS_LIMIT;

  return (
    <div className="result-cards-wrapper">
      <div className="result-cards-grid">
        {visible.map((r, i) => {
          const candidate = encuesta ? findCandidateData(encuesta, r.opcion) : null;
          const party = candidate ? findPartyLogo(candidate.partido) : null;
          const partyName = candidate?.partido || '';

          // Resolve logo: 1) from Presidente (correct), 2) dictionary, 3) candidate's own (may be wrong)
          const logoUrl =
            findLogoFromPresidente(partyName, allEncuestas) ||
            party?.logo ||
            candidate?.logo_partido_url ||
            '';

          const partyColor = party?.color || colors[i];
          const pct = parseFloat(r.porcentaje);
          const barWidth = maxPct > 0 ? (pct / maxPct) * 100 : 0;

          const rank = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
          const isCandidate = !!candidate;

          return (
            <div className={`rc-card ${rank}`} key={r.opcion}>
              {/* Rank number + Name */}
              <div className="rc-name">
                <span className="rc-rank">#{i + 1}</span>
                {formatName(r.opcion)}
              </div>

              {/* Photo area */}
              <div className="rc-photo">
                {candidate?.foto_url ? (
                  <CandPhoto url={candidate.foto_url} name={r.opcion} />
                ) : (
                  <span className="rc-placeholder">
                    {getInitials(r.opcion)}
                  </span>
                )}

                {/* Number badge */}
                {candidate?.numero != null && (
                  <span className="rc-num-badge">N.°{candidate.numero}</span>
                )}

                {/* Party logo */}
                {isCandidate && (
                  <div className="rc-party-logo-wrap">
                    {logoUrl ? (
                      <PartyLogoImg url={logoUrl} partido={partyName} abbr={party?.abbr} color={partyColor} />
                    ) : (
                      <span className="rc-party-abbr" style={{ color: partyColor }}>
                        {party?.abbr || partyName.substring(0, 4).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Mini progress bar */}
              <div className="rc-mini-bar">
                <div className="rc-mini-bar-fill" style={{ width: `${barWidth}%`, background: partyColor }} />
              </div>

              {/* Party name */}
              <div className="rc-partido-name">{partyName || '—'}</div>

              {/* Footer with percentage */}
              <div className={`rc-footer ${rank}`}>
                <div className="rc-pct">{r.porcentaje}%</div>
                <div className="rc-votes">{formatNumber(r.cantidad)} votos</div>
              </div>
            </div>
          );
        })}
      </div>

      {needsMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowAll(!showAll)}
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${resultados.length} candidatos)`}
          </button>
        </div>
      )}
    </div>
  );
}

function formatName(name: string): string {
  const parts = name.split(' ');
  if (parts.length <= 2) return name;
  const mid = Math.ceil(parts.length / 2);
  return parts.slice(0, mid).join(' ') + '\n' + parts.slice(mid).join(' ');
}

function CandPhoto({ url, name }: { url: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) return <span className="rc-placeholder">{getInitials(name)}</span>;
  return <img src={url} alt="" className="rc-photo-img" onError={() => setErr(true)} />;
}

function PartyLogoImg({ url, partido, abbr, color }: { url: string; partido: string; abbr?: string; color: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <span className="rc-party-abbr" style={{ color }} title={partido}>
        {abbr || partido.substring(0, 4).toUpperCase()}
      </span>
    );
  }
  return <img src={url} alt={partido} title={partido} className="rc-party-logo-img" onError={() => setErr(true)} />;
}
