import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Encuesta, CandidateOption } from '../types';
import { useDemoData } from '../context/DemoDataContext';
import { formatNumber } from '../utils/format';

function isCandidateOption(o: unknown): o is CandidateOption {
  return typeof o === 'object' && o !== null && 'nombre' in o;
}

function PollCard({ encuesta, onVotar }: { encuesta: Encuesta; onVotar: () => void }) {
  const candidates = encuesta.opciones.filter(isCandidateOption);

  return (
    <div className="poll-card">
      <div className="poll-card-header">
        <span className="poll-card-num">📊</span>
        <h2 className="poll-card-title">{encuesta.titulo}</h2>
        <p className="poll-card-desc">{encuesta.descripcion}</p>
        {encuesta.total_votos > 0 && (
          <span className="poll-card-votes">{formatNumber(encuesta.total_votos)} participantes</span>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="poll-candidates">
          {candidates.map((c, i) => (
            <div key={i} className="poll-candidate">
              <div className="poll-candidate-photo">
                {c.foto_url ? (
                  <img src={c.foto_url} alt={c.nombre} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="poll-candidate-avatar">{c.nombre.charAt(0)}</div>
                )}
              </div>
              <span className="poll-candidate-name">{c.nombre}</span>
              {c.partido && <span className="poll-candidate-party">{c.partido}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="poll-card-actions">
        <button className="btn btn-primary btn-lg poll-vote-btn" onClick={onVotar}>
          Votar ahora →
        </button>
        <Link to={`/resultados/${encuesta.id}`} className="poll-results-link">
          Ver resultados
        </Link>
      </div>
    </div>
  );
}

export default function ParticiparPage() {
  const { api } = useDemoData();
  const navigate = useNavigate();
  const [allEncuestas, setAllEncuestas] = useState<Encuesta[]>([]);

  useEffect(() => {
    api.getEncuestas().then(d => setAllEncuestas(d.encuestas));
  }, [api]);

  const activeEncuestas = allEncuestas.filter(e => e.estado === 'activa');

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
          <h1 className="participar-title">Encuestas activas</h1>
          <p className="participar-subtitle">Selecciona una encuesta y emite tu voto</p>
        </div>
      </div>

      <div className="container participar-content">
        {activeEncuestas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '1.25rem' }}>No hay encuestas activas en este momento.</p>
          </div>
        ) : (
          <div className="polls-grid">
            {activeEncuestas.map(enc => (
              <PollCard
                key={enc.id}
                encuesta={enc}
                onVotar={() => navigate(`/votar/${enc.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
