import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle, DenunciaCiudadana, ForoPregunta } from '../types';
import { useDemoData } from '../context/DemoDataContext';
import { CONFIG, NEWS_CATEGORIES, DENUNCIA_CATEGORIES, REGIONES_PERU } from '../config/constants';
import { timeAgo, formatNumber } from '../utils/format';
import { resolveImageUrl } from '../utils/googleDrive';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import EncuestaGrid from '../components/encuesta/EncuestaGrid';
import ResultBars from '../components/charts/ResultBars';

type PortalSection =
  | 'todas' | 'local' | 'regional' | 'policial' | 'politica'
  | 'cultural' | 'espectaculos' | 'internacional' | 'economia'
  | 'denuncia' | 'foro' | 'encuestas' | 'candidatos' | 'pueblo' | 'publicidad';

interface SidebarItem {
  id: PortalSection;
  label: string;
  icon: string;
  group: 'noticias' | 'especial';
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'todas', label: 'Todas', icon: '📰', group: 'noticias' },
  { id: 'local', label: 'Local', icon: '📍', group: 'noticias' },
  { id: 'regional', label: 'Regional', icon: '🏘️', group: 'noticias' },
  { id: 'policial', label: 'Policial', icon: '🚔', group: 'noticias' },
  { id: 'politica', label: 'Política', icon: '🏛️', group: 'noticias' },
  { id: 'cultural', label: 'Cultural', icon: '🎭', group: 'noticias' },
  { id: 'espectaculos', label: 'Espectáculos', icon: '🎬', group: 'noticias' },
  { id: 'internacional', label: 'Internacional', icon: '🌎', group: 'noticias' },
  { id: 'economia', label: 'Economía', icon: '💰', group: 'noticias' },
  { id: 'denuncia', label: 'Denuncia Ciudadana', icon: '🔴', group: 'especial' },
  { id: 'foro', label: 'Foro del Día', icon: '💬', group: 'especial' },
  { id: 'encuestas', label: 'Encuestas y Opinión', icon: '📊', group: 'especial' },
  { id: 'candidatos', label: 'Candidatos', icon: '👤', group: 'especial' },
  { id: 'pueblo', label: 'El Pueblo Vota', icon: '✋', group: 'especial' },
  { id: 'publicidad', label: 'Publicidad', icon: '📢', group: 'especial' },
];

const SECTION_TO_CATEGORY: Record<string, string> = {
  local: 'Local', regional: 'Regional', policial: 'Policial',
  politica: 'Política', cultural: 'Cultural', espectaculos: 'Espectáculos',
  internacional: 'Internacional', economia: 'Economía',
  candidatos: 'Candidatos', publicidad: 'Publicidad',
};

export default function NoticiasPage() {
  const { data, updateData, api } = useDemoData();
  const [section, setSection] = useState<PortalSection>('todas');

  const published = useMemo(() =>
    data.noticias
      .filter(n => n.publicado)
      .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime()),
    [data.noticias]
  );

  const filtered = useMemo(() => {
    const cat = SECTION_TO_CATEGORY[section];
    if (!cat) return published;
    return published.filter(n => n.categoria === cat);
  }, [published, section]);

  const sectionTitle = SIDEBAR_ITEMS.find(s => s.id === section)?.label || 'Noticias';

  const noticiasCounts = useMemo(() => {
    const counts: Record<string, number> = { todas: published.length };
    published.forEach(n => {
      const key = Object.entries(SECTION_TO_CATEGORY).find(([, v]) => v === n.categoria)?.[0];
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [published]);

  return (
    <div className="noticias-portal">
      <Navbar fixed={false} />

      {/* Mobile tabs */}
      <div className="container">
        <div className="noticias-mobile-tabs">
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              className={`noticias-mobile-tab${section === item.id ? ' active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="noticias-layout">
        {/* Sidebar */}
        <aside className="noticias-sidebar">
          <div className="noticias-sidebar-title">Noticias</div>
          {SIDEBAR_ITEMS.filter(i => i.group === 'noticias').map(item => (
            <button
              key={item.id}
              className={`noticias-sidebar-item${section === item.id ? ' active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
              {noticiasCounts[item.id] != null && (
                <span className="sidebar-count">{noticiasCounts[item.id]}</span>
              )}
            </button>
          ))}
          <div className="noticias-sidebar-divider" />
          <div className="noticias-sidebar-title">Secciones Especiales</div>
          {SIDEBAR_ITEMS.filter(i => i.group === 'especial').map(item => (
            <button
              key={item.id}
              className={`noticias-sidebar-item${section === item.id ? ' active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="noticias-main">
          {/* News category sections */}
          {(section === 'todas' || SECTION_TO_CATEGORY[section]) && (
            <NewsGridSection
              title={sectionTitle}
              subtitle={section === 'todas' ? 'Lo último en política, elecciones y actualidad' : `Noticias de ${sectionTitle}`}
              articles={filtered}
            />
          )}

          {section === 'denuncia' && (
            <DenunciaSection
              denuncias={data.denuncias}
              updateData={updateData}
              api={api}
            />
          )}

          {section === 'foro' && (
            <ForoSection
              preguntas={data.foro}
              updateData={updateData}
              api={api}
            />
          )}

          {section === 'encuestas' && (
            <EncuestasSection
              encuestas={data.encuestas}
              opiniones={published.filter(n => n.categoria === 'Opinión')}
            />
          )}

          {section === 'pueblo' && (
            <PuebloVotaSection data={data} />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}

/* ========== News Grid ========== */
function NewsGridSection({ title, subtitle, articles }: {
  title: string; subtitle: string; articles: NewsArticle[];
}) {
  return (
    <>
      <div className="noticias-main-header">
        <h1 className="noticias-main-title">{title}</h1>
        <p className="noticias-main-subtitle">{subtitle}</p>
      </div>
      {articles.length === 0 ? (
        <div className="noticias-empty">
          <div className="noticias-empty-icon">📰</div>
          <p className="noticias-empty-text">No hay noticias en esta sección por el momento.</p>
        </div>
      ) : (
        <div className="noticias-grid">
          {articles.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const imgUrl = resolveImageUrl(article.imagen_url);
  return (
    <Link to={`/noticias/${article.id}`} className="noticias-card">
      <div className="noticias-card-img">
        {imgUrl ? (
          <img src={imgUrl} alt={article.titulo} loading="lazy" />
        ) : (
          <div className="noticias-card-placeholder">📰</div>
        )}
      </div>
      <div className="noticias-card-body">
        <span className={`noticias-card-badge${article.categoria === 'Publicidad' ? ' patrocinado' : ''}`}>
          {article.categoria === 'Publicidad' ? 'PATROCINADO' : article.categoria}
        </span>
        <h3 className="noticias-card-title">{article.titulo}</h3>
        <p className="noticias-card-excerpt">{article.extracto}</p>
        <div className="noticias-card-meta">
          <span>{article.autor}</span>
          <span className="meta-dot">·</span>
          <span>{timeAgo(article.fecha_publicacion)}</span>
        </div>
      </div>
    </Link>
  );
}

/* ========== Denuncia Ciudadana ========== */
function DenunciaSection({ denuncias, updateData, api }: {
  denuncias: DenunciaCiudadana[];
  updateData: (fn: (prev: any) => any) => void;
  api: any;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState(DENUNCIA_CATEGORIES[0]);
  const [region, setRegion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const publicadas = denuncias
    .filter(d => d.estado === 'publicada' || d.estado === 'revisada')
    .sort((a, b) => b.votos_apoyo - a.votos_apoyo);

  const [apoyados, setApoyados] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('ep_apoyos');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const handleSubmit = () => {
    if (!titulo.trim() || !descripcion.trim()) return;
    const newId = 'D' + String(denuncias.length + 1).padStart(2, '0');
    const nueva: DenunciaCiudadana = {
      id: newId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      categoria,
      region: region || 'No especificada',
      fecha: new Date().toISOString(),
      estado: 'pendiente',
      votos_apoyo: 0,
    };
    updateData(prev => ({ ...prev, denuncias: [...prev.denuncias, nueva] }));
    if (!CONFIG.DEMO_MODE) api.crearDenuncia({ titulo: nueva.titulo, descripcion: nueva.descripcion, categoria: nueva.categoria, region: nueva.region }).catch(console.error);
    setTitulo('');
    setDescripcion('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleApoyo = (id: string) => {
    if (apoyados.has(id)) return;
    updateData(prev => ({
      ...prev,
      denuncias: prev.denuncias.map((d: DenunciaCiudadana) =>
        d.id === id ? { ...d, votos_apoyo: d.votos_apoyo + 1 } : d
      ),
    }));
    if (!CONFIG.DEMO_MODE) api.apoyarDenuncia(id).catch(console.error);
    const next = new Set(apoyados).add(id);
    setApoyados(next);
    localStorage.setItem('ep_apoyos', JSON.stringify([...next]));
  };

  const regionEntries = Object.entries(REGIONES_PERU).filter(([k]) => k !== 'NACIONAL');

  return (
    <div className="denuncia-section">
      <div className="noticias-main-header">
        <h1 className="noticias-main-title">Denuncia Ciudadana</h1>
        <p className="noticias-main-subtitle">Portal anónimo para reportar problemas en tu comunidad</p>
      </div>

      <div className="denuncia-form">
        <h3>Enviar denuncia</h3>
        <p>Tu identidad es completamente anónima. Ningún dato personal es recolectado.</p>
        <div className="denuncia-anon-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          100% Anónimo
        </div>

        <div className="form-row">
          <label>Título de la denuncia</label>
          <input
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ej: Obra paralizada en mi barrio"
            maxLength={120}
          />
        </div>

        <div className="form-row">
          <label>Descripción detallada</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Describe el problema con el mayor detalle posible..."
            maxLength={800}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="form-row">
            <label>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)}>
              {DENUNCIA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Región / Ciudad</label>
            <select value={region} onChange={e => setRegion(e.target.value)}>
              <option value="">Seleccionar...</option>
              {regionEntries.map(([code, info]) => (
                <option key={code} value={info.nombre}>{info.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!titulo.trim() || !descripcion.trim()}
          >
            Enviar denuncia anónima
          </button>
          {submitted && (
            <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'center' }}>
              Denuncia enviada correctamente
            </span>
          )}
        </div>
      </div>

      <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
        Denuncias de la comunidad ({publicadas.length})
      </h3>

      <div className="denuncia-list">
        {publicadas.map(d => (
          <div key={d.id} className="denuncia-item">
            <div className="denuncia-item-header">
              <h4 className="denuncia-item-title">{d.titulo}</h4>
              <span className={`denuncia-item-badge ${d.estado}`}>{d.estado}</span>
            </div>
            <p className="denuncia-item-desc">{d.descripcion}</p>
            <div className="denuncia-item-footer">
              <button
                className={`denuncia-apoyo-btn${apoyados.has(d.id) ? ' voted' : ''}`}
                onClick={() => handleApoyo(d.id)}
              >
                👍 {d.votos_apoyo} apoyo{d.votos_apoyo !== 1 ? 's' : ''}
              </button>
              <span>{d.categoria}</span>
              <span>·</span>
              <span>{d.region}</span>
              <span>·</span>
              <span>{timeAgo(d.fecha)}</span>
            </div>
          </div>
        ))}
        {publicadas.length === 0 && (
          <div className="noticias-empty">
            <div className="noticias-empty-icon">🔴</div>
            <p className="noticias-empty-text">Aún no hay denuncias publicadas. Sé el primero en reportar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Foro Diario ========== */
function ForoSection({ preguntas, updateData, api }: {
  preguntas: ForoPregunta[];
  updateData: (fn: (prev: any) => any) => void;
  api: any;
}) {
  const [showHistory, setShowHistory] = useState(false);

  const activa = preguntas.find(p => p.activa);
  const anteriores = preguntas.filter(p => !p.activa).sort((a, b) =>
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  const [votedForoIds, setVotedForoIds] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('ep_foro_votes');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const handleVote = (preguntaId: string, opcionIdx: number) => {
    if (votedForoIds[preguntaId] != null) return;
    updateData(prev => ({
      ...prev,
      foro: prev.foro.map((p: ForoPregunta) => {
        if (p.id !== preguntaId) return p;
        const opciones = p.opciones.map((o, i) =>
          i === opcionIdx ? { ...o, votos: o.votos + 1 } : o
        );
        return { ...p, opciones, total_votos: p.total_votos + 1 };
      }),
    }));
    if (!CONFIG.DEMO_MODE) api.votarForo(preguntaId, opcionIdx).catch(console.error);
    const next = { ...votedForoIds, [preguntaId]: opcionIdx };
    setVotedForoIds(next);
    localStorage.setItem('ep_foro_votes', JSON.stringify(next));
  };

  return (
    <div className="foro-section">
      <div className="noticias-main-header">
        <h1 className="noticias-main-title">Foro del Día</h1>
        <p className="noticias-main-subtitle">Preguntas diarias que generan debate</p>
      </div>

      {activa ? (
        <ForoQuestionCard
          pregunta={activa}
          votedIdx={votedForoIds[activa.id]}
          onVote={(idx) => handleVote(activa.id, idx)}
          isActive
        />
      ) : (
        <div className="noticias-empty">
          <div className="noticias-empty-icon">💬</div>
          <p className="noticias-empty-text">No hay pregunta activa hoy. Vuelve pronto.</p>
        </div>
      )}

      {anteriores.length > 0 && (
        <>
          <button
            className="foro-history-toggle"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? '▼' : '▶'} Preguntas anteriores ({anteriores.length})
          </button>
          {showHistory && anteriores.map(p => (
            <ForoQuestionCard
              key={p.id}
              pregunta={p}
              votedIdx={votedForoIds[p.id]}
              onVote={(idx) => handleVote(p.id, idx)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function ForoQuestionCard({ pregunta, votedIdx, onVote, isActive }: {
  pregunta: ForoPregunta;
  votedIdx?: number;
  onVote: (idx: number) => void;
  isActive?: boolean;
}) {
  const hasVoted = votedIdx != null;
  return (
    <div className="foro-question-card">
      {isActive && (
        <div className="foro-question-label">💬 PREGUNTA DEL DÍA</div>
      )}
      <h2 className="foro-question-text">{pregunta.pregunta}</h2>
      <p className="foro-question-desc">{pregunta.descripcion}</p>
      <div className="foro-options">
        {pregunta.opciones.map((op, i) => {
          const pct = pregunta.total_votos > 0
            ? ((op.votos / pregunta.total_votos) * 100).toFixed(1)
            : '0';
          return (
            <div
              key={i}
              className={`foro-option${votedIdx === i ? ' voted' : ''}`}
              onClick={() => !hasVoted && onVote(i)}
              style={{ cursor: hasVoted ? 'default' : 'pointer' }}
            >
              {hasVoted && (
                <div className="foro-option-bar" style={{ width: `${pct}%` }} />
              )}
              <div className="foro-option-content">
                <span className="foro-option-text">{op.texto}</span>
                {hasVoted && <span className="foro-option-pct">{pct}%</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="foro-total">
        {formatNumber(pregunta.total_votos)} votos · {timeAgo(pregunta.fecha)}
      </div>
    </div>
  );
}

/* ========== Encuestas y Opinión ========== */
function EncuestasSection({ encuestas, opiniones }: {
  encuestas: any[]; opiniones: NewsArticle[];
}) {
  const activas = encuestas.filter(e => e.estado === 'activa');

  return (
    <>
      <div className="noticias-main-header">
        <h1 className="noticias-main-title">Encuestas y Opinión</h1>
        <p className="noticias-main-subtitle">Participa en las encuestas activas y lee análisis de opinión</p>
      </div>

      <Link to="/#encuestas" className="portal-encuestas-link">
        <span style={{ fontSize: '2rem' }}>📊</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {activas.length} encuesta{activas.length !== 1 ? 's' : ''} activa{activas.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Ir a las encuestas para votar
          </div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>→</span>
      </Link>

      {activas.length > 0 && (
        <EncuestaGrid encuestas={activas.slice(0, 6)} regionName={null} />
      )}

      {opiniones.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', margin: 'var(--space-xl) 0 var(--space-md)' }}>
            Artículos de Opinión
          </h3>
          <div className="noticias-grid">
            {opiniones.map(article => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ========== El Pueblo Vota ========== */
function PuebloVotaSection({ data }: { data: any }) {
  const activas = data.encuestas.filter((e: any) => e.estado === 'activa');
  const firstEncuesta = activas[0];
  const firstResults = firstEncuesta ? data.resultados[firstEncuesta.id] : null;

  return (
    <>
      <div className="noticias-main-header">
        <h1 className="noticias-main-title">El Pueblo Vota</h1>
        <p className="noticias-main-subtitle">Resultados en tiempo real de las encuestas ciudadanas</p>
      </div>

      {firstResults && (
        <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
            {firstEncuesta.titulo}
          </h3>
          <ResultBars resultados={firstResults.resultados} encuesta={firstEncuesta} />
          <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
            <Link to={`/votar/${firstEncuesta.id}`} className="btn btn-primary btn-sm">
              Participar en esta encuesta
            </Link>
          </div>
        </div>
      )}

      {activas.length > 1 && (
        <>
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
            Más encuestas activas
          </h3>
          <EncuestaGrid encuestas={activas.slice(1, 7)} regionName={null} />
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
        <Link to="/resultados" className="btn btn-outline" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
          Ver todos los resultados
        </Link>
      </div>
    </>
  );
}
