import { useState } from 'react';
import type { CandidateOption, Encuesta, ResultadoOpcion } from '../../types';
import { findCandidateData, getInitials } from '../../utils/helpers';
import { findPartyLogo, findSheetLogo } from '../../config/party-logos';

const CARDS_LIMIT = 10;

interface PollsterCardsProps {
  resultados: ResultadoOpcion[];
  encuesta?: Encuesta | null;
  allEncuestas?: Encuesta[];
  logosPartidos?: Record<string, string>;
}

function findLogoFromPresidente(partyName: string, allEncuestas: Encuesta[]): string {
  if (!partyName || !allEncuestas.length) return '';
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const needle = normalize(partyName);
  const presEncuestas = allEncuestas.filter(e => e.tipo_eleccion === 'PRESIDENTE');
  for (const enc of presEncuestas) {
    for (const opt of enc.opciones) {
      if (typeof opt === 'object' && opt.logo_partido_url) {
        if (normalize(opt.partido) === needle) return opt.logo_partido_url;
      }
    }
  }
  for (const enc of presEncuestas) {
    for (const opt of enc.opciones) {
      if (typeof opt === 'object' && opt.logo_partido_url) {
        const optParty = normalize(opt.partido);
        if (needle.includes(optParty) || optParty.includes(needle)) return opt.logo_partido_url;
      }
    }
  }
  return '';
}

export default function PollsterCards({ resultados, encuesta, allEncuestas = [], logosPartidos = {} }: PollsterCardsProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? resultados : resultados.slice(0, CARDS_LIMIT);
  const needsMore = resultados.length > CARDS_LIMIT;

  // Detect encuesta title for header
  const titulo = encuesta?.titulo || 'Resultados';
  const tipoEleccion = encuesta?.tipo_eleccion || '';
  const headerLabel = tipoEleccion === 'SENADORES' ? 'SENADORES'
    : tipoEleccion === 'DIPUTADOS' ? 'DIPUTADOS'
    : tipoEleccion === 'PRESIDENTE' ? 'PRESIDENTE'
    : tipoEleccion === 'PARLAMENTO_ANDINO' ? 'PARLAMENTO ANDINO'
    : tipoEleccion === 'MUNICIPAL' ? 'MUNICIPAL'
    : 'ENCUESTA';

  return (
    <div className="pollster-wrapper">
      {/* Header bar */}
      <div className="pollster-header">
        <span className="pollster-header-label">{headerLabel}</span>
        <span className="pollster-header-brand">EncuestaPe</span>
      </div>

      {/* Cards row */}
      <div className="pollster-cards-row">
        {visible.map((r, i) => {
          const candidate = encuesta ? findCandidateData(encuesta, r.opcion) : null;
          const party = candidate ? findPartyLogo(candidate.partido) : null;
          const partyName = candidate?.partido || '';
          const logoUrl =
            findSheetLogo(partyName, logosPartidos) ||
            (party?.abbr ? findSheetLogo(party.abbr, logosPartidos) : '') ||
            (party?.nombre ? findSheetLogo(party.nombre, logosPartidos) : '') ||
            findLogoFromPresidente(partyName, allEncuestas) ||
            party?.logo ||
            candidate?.logo_partido_url ||
            '';
          const isFirst = i === 0;

          return (
            <div className={`pollster-card ${isFirst ? 'pollster-card--first' : ''}`} key={r.opcion}>
              {/* Percentage badge */}
              <div className={`pollster-pct-badge ${isFirst ? 'pollster-pct-badge--first' : ''}`}>
                <span className="pollster-pct-value">{r.porcentaje}%</span>
              </div>

              {/* Photo */}
              <div className="pollster-photo">
                {candidate?.foto_url ? (
                  <PollsterPhoto url={candidate.foto_url} name={r.opcion} />
                ) : (
                  <span className="pollster-photo-placeholder">
                    {getInitials(r.opcion)}
                  </span>
                )}
              </div>

              {/* Name */}
              <div className="pollster-name">
                {formatShortName(r.opcion)}
              </div>

              {/* Party logo / Candidate number */}
              <div className="pollster-party">
                {logoUrl ? (
                  <PollsterLogo url={logoUrl} partido={partyName} abbr={party?.abbr} />
                ) : candidate?.numero ? (
                  <span className="pollster-party-numero">{candidate.numero}</span>
                ) : (
                  <span className="pollster-party-text">
                    {party?.abbr || partyName.substring(0, 6).toUpperCase() || '?'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {needsMore && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowAll(!showAll)}
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
          >
            {showAll ? 'Mostrar menos' : `Ver todos (${resultados.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

/** Format name: show last name + first name abbreviated */
function formatShortName(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length <= 2) return name.toUpperCase();
  // Take last two words as apellidos, first as nombre
  const lastName = parts[parts.length - 2] + ' ' + parts[parts.length - 1];
  return lastName.toUpperCase();
}

function PollsterPhoto({ url, name }: { url: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) return <span className="pollster-photo-placeholder">{getInitials(name)}</span>;
  return <img src={url} alt="" className="pollster-photo-img" onError={() => setErr(true)} />;
}

function PollsterLogo({ url, partido, abbr }: { url: string; partido: string; abbr?: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return <span className="pollster-party-text" title={partido}>{abbr || partido.substring(0, 5).toUpperCase()}</span>;
  }
  return <img src={url} alt={partido} title={partido} className="pollster-party-logo" onError={() => setErr(true)} />;
}
