import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Encuesta } from '../types';
import { REGIONES_PERU } from '../config/constants';
import { useDemoData } from '../context/DemoDataContext';
import { formatNumber } from '../utils/format';
import type { RegionCode } from '../types';

type ElectionType = 'PRESIDENTE' | 'SENADORES' | 'DIPUTADOS' | 'PARLAMENTO_ANDINO';

const ELECTION_TYPES: { key: ElectionType; label: string; icon: string; desc: string }[] = [
  { key: 'PRESIDENTE', label: 'Presidente', icon: '🏛️', desc: 'Elige al próximo presidente del Perú' },
  { key: 'SENADORES', label: 'Senadores', icon: '🏢', desc: 'Vota por tu senador regional' },
  { key: 'DIPUTADOS', label: 'Diputados', icon: '📋', desc: 'Elige a tu diputado por región' },
  { key: 'PARLAMENTO_ANDINO', label: 'Parlamento Andino', icon: '🌎', desc: 'Representantes ante el Parlamento Andino' },
];

export default function ParticiparPage() {
  const { api } = useDemoData();
  const navigate = useNavigate();
  const [allEncuestas, setAllEncuestas] = useState<Encuesta[]>([]);
  const [selectedType, setSelectedType] = useState<ElectionType | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  useEffect(() => {
    api.getEncuestas().then(d => setAllEncuestas(d.encuestas));
  }, [api]);

  const activeEncuestas = allEncuestas.filter(e => e.estado === 'activa');

  // Get available regions for selected type
  const regionsForType = selectedType
    ? [...new Set(activeEncuestas.filter(e => e.tipo_eleccion === selectedType).map(e => e.region))]
    : [];

  const needsRegion = selectedType && selectedType !== 'PRESIDENTE' && selectedType !== 'PARLAMENTO_ANDINO' && regionsForType.length > 1;

  // Find target encuesta
  const targetEncuesta = selectedType
    ? activeEncuestas.find(e => {
        if (e.tipo_eleccion !== selectedType) return false;
        if (needsRegion && selectedRegion) return e.region === selectedRegion;
        if (!needsRegion) return true;
        return false;
      })
    : null;

  const handleVotar = () => {
    if (targetEncuesta) {
      navigate(`/votar/${targetEncuesta.id}`);
    }
  };

  // Count votes per type
  const getTypeVotes = (type: ElectionType) => {
    return activeEncuestas
      .filter(e => e.tipo_eleccion === type)
      .reduce((sum, e) => sum + (e.total_votos || 0), 0);
  };

  return (
    <div className="participar-page">
      <header className="votar-header">
        <div className="container">
          <Link to="/" className="navbar-logo">
            <img src="/assets/icon-white.svg" alt="" className="navbar-icon" />
            <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
              Encuesta<span style={{ color: 'var(--color-accent)' }}>Pe</span>
            </span>
          </Link>
          <Link to="/" className="votar-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Inicio
          </Link>
        </div>
      </header>

      <div className="participar-hero">
        <div className="container">
          <h1 className="participar-title">Elige tu encuesta</h1>
          <p className="participar-subtitle">Selecciona el tipo de elección y emite tu voto</p>
        </div>
      </div>

      <div className="container participar-content">
        {/* Step 1: Election Type */}
        <div className="participar-step">
          <div className="participar-step-label">
            <span className="participar-step-num">1</span>
            Tipo de elección
          </div>
          <div className="election-type-grid">
            {ELECTION_TYPES.map(t => {
              const votes = getTypeVotes(t.key);
              const isActive = activeEncuestas.some(e => e.tipo_eleccion === t.key);
              return (
                <button
                  key={t.key}
                  className={`election-type-card${selectedType === t.key ? ' selected' : ''}${!isActive ? ' disabled' : ''}`}
                  onClick={() => { if (isActive) { setSelectedType(t.key); setSelectedRegion(''); } }}
                  disabled={!isActive}
                >
                  <span className="election-type-icon">{t.icon}</span>
                  <span className="election-type-name">{t.label}</span>
                  <span className="election-type-desc">{t.desc}</span>
                  {votes > 0 && (
                    <span className="election-type-votes">{formatNumber(votes)} votos</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Region (if needed) */}
        {needsRegion && (
          <div className="participar-step">
            <div className="participar-step-label">
              <span className="participar-step-num">2</span>
              Selecciona tu región
            </div>
            <div className="region-grid">
              {regionsForType
                .filter(r => r !== 'NACIONAL')
                .sort((a, b) => {
                  const nameA = REGIONES_PERU[a as RegionCode]?.nombre || a;
                  const nameB = REGIONES_PERU[b as RegionCode]?.nombre || b;
                  return nameA.localeCompare(nameB);
                })
                .map(r => (
                  <button
                    key={r}
                    className={`region-btn${selectedRegion === r ? ' selected' : ''}`}
                    onClick={() => setSelectedRegion(r)}
                  >
                    {REGIONES_PERU[r as RegionCode]?.nombre || r}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {targetEncuesta && (
          <div className="participar-cta">
            <div className="participar-cta-info">
              <h3>{targetEncuesta.titulo}</h3>
              <p>{targetEncuesta.descripcion}</p>
              <span className="participar-cta-stats">
                {formatNumber(targetEncuesta.total_votos)} participantes
                {targetEncuesta.meta_votos > 0 && (
                  <> &middot; Meta: {formatNumber(targetEncuesta.meta_votos)}</>
                )}
              </span>
            </div>
            <button className="btn btn-primary btn-lg participar-cta-btn" onClick={handleVotar}>
              Votar ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
