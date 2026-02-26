import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Encuesta, ResultadosData } from '../../types';
import { useDemoData } from '../../context/DemoDataContext';
import { TIPOS_ELECCION, REGIONES_PERU } from '../../config/constants';
import ResultBars from '../charts/ResultBars';
import BarChart from '../charts/BarChart';
import DoughnutChart from '../charts/DoughnutChart';
import { formatNumber, formatDate, timeAgo } from '../../utils/format';
import { findCandidateData, getInitials, getChartColors } from '../../utils/helpers';
import { CONFIG } from '../../config/constants';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

type ViewMode = 'bars' | 'dashboard';

const CATEGORY_ICONS: Record<string, string> = {
  PRESIDENTE: '🏛️',
  SENADORES: '🏛️',
  DIPUTADOS: '📋',
  PARLAMENTO_ANDINO: '🌎',
  MUNICIPAL: '🏘️',
  GENERAL: '📊',
};

export default function ResultsSection() {
  const { api, data } = useDemoData();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [resultadosMap, setResultadosMap] = useState<Record<string, ResultadosData>>({});
  const [view, setView] = useState<ViewMode>('bars');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const activeEncuestas = useMemo(
    () => data.encuestas.filter(e => e.estado === 'activa'),
    [data.encuestas],
  );

  const currentId = activeEncuestas[selectedIdx]?.id;

  // Fetch results only for the currently selected encuesta
  const loadCurrentResult = async () => {
    if (!currentId) return;
    const res = await api.getResultados(currentId);
    if (res) setResultadosMap(prev => ({ ...prev, [currentId]: res }));
  };

  useEffect(() => { loadCurrentResult(); }, [currentId]);
  useAutoRefresh(loadCurrentResult, CONFIG.REFRESH_INTERVAL, !!currentId);

  // Group encuestas by tipo_eleccion
  const grouped = useMemo(() => {
    const map: Record<string, { label: string; items: { enc: Encuesta; globalIdx: number }[] }> = {};
    activeEncuestas.forEach((enc, i) => {
      const tipo = enc.tipo_eleccion;
      if (!map[tipo]) {
        map[tipo] = { label: TIPOS_ELECCION[tipo]?.nombre || tipo, items: [] };
      }
      map[tipo].items.push({ enc, globalIdx: i });
    });
    return map;
  }, [activeEncuestas]);

  const categories = Object.keys(grouped);

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  if (activeEncuestas.length === 0) return null;

  const idx = selectedIdx < activeEncuestas.length ? selectedIdx : 0;
  const encuesta = activeEncuestas[idx];
  const resultados = resultadosMap[encuesta.id];

  if (!resultados) return null;

  const colors = getChartColors(resultados.resultados.length);
  const progress = encuesta.meta_votos > 0
    ? ((resultados.total_votos / encuesta.meta_votos) * 100).toFixed(1)
    : '0';

  const currentItems = activeCategory && grouped[activeCategory] ? grouped[activeCategory].items : [];

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    // Auto-select first encuesta of this category
    const first = grouped[cat]?.items[0];
    if (first) setSelectedIdx(first.globalIdx);
  };

  return (
    <section className="section results-section" id="resultados">
      <div className="container">
        <div className="results-header">
          <h2 className="section-title">Resultados en tiempo real</h2>
          <span className="badge badge-live">EN VIVO</span>
        </div>

        {/* Category tabs */}
        <div className="results-categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`results-cat-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              <span className="results-cat-icon">{CATEGORY_ICONS[cat] || '📊'}</span>
              <span className="results-cat-label">{grouped[cat].label}</span>
              <span className="results-cat-count">{grouped[cat].items.length}</span>
            </button>
          ))}
        </div>

        {/* Sub-items (departments/regions) */}
        {currentItems.length > 1 && (
          <div className="results-subitems">
            {currentItems.map(({ enc, globalIdx }) => {
              const regionName = REGIONES_PERU[enc.region]?.nombre || enc.region;
              return (
                <button
                  key={enc.id}
                  className={`results-subitem${globalIdx === idx ? ' active' : ''}`}
                  onClick={() => setSelectedIdx(globalIdx)}
                >
                  {regionName}
                </button>
              );
            })}
          </div>
        )}

        {/* Current encuesta title */}
        <div className="results-current">
          <h3 className="results-current-title">{encuesta.titulo}</h3>
          <span className="results-current-region">
            {REGIONES_PERU[encuesta.region]?.nombre || encuesta.region}
          </span>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
          <button
            className={`btn btn-sm ${view === 'bars' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('bars')}
            style={view !== 'bars' ? { color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : {}}
          >
            Resultados
          </button>
          <button
            className={`btn btn-sm ${view === 'dashboard' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('dashboard')}
            style={view !== 'dashboard' ? { color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : {}}
          >
            Dashboard
          </button>
        </div>

        {/* === BARS VIEW === */}
        {view === 'bars' && (
          <>
            <ResultBars resultados={resultados.resultados} encuesta={encuesta} />
            <div className="results-meta">
              <span>Total: <span className="total">{formatNumber(resultados.total_votos)}</span> participantes</span>
              <span>Última actualización: <span>{timeAgo(resultados.ultima_actualizacion)}</span></span>
            </div>
          </>
        )}

        {/* === DASHBOARD VIEW === */}
        {view === 'dashboard' && (
          <>
            <div className="results-grid">
              <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
                  Distribución de votos
                </h3>
                <div style={{ position: 'relative', height: Math.max(350, resultados.resultados.length * 40) }}>
                  <BarChart resultados={resultados.resultados} />
                </div>
              </div>
              <div>
                <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Proporción</h3>
                  <div style={{ position: 'relative', height: 250 }}>
                    <DoughnutChart resultados={resultados.resultados.slice(0, 10)} />
                  </div>
                </div>
                <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Información</h3>
                  <InfoRow label="Total participantes" value={formatNumber(resultados.total_votos)} mono />
                  <InfoRow label="Meta" value={formatNumber(encuesta.meta_votos)} mono />
                  <InfoRow label="Progreso" value={`${progress}%`} mono />
                  <InfoRow label="Inicio" value={formatDate(encuesta.fecha_inicio)} />
                  <InfoRow label="Cierre" value={encuesta.fecha_fin ? formatDate(encuesta.fecha_fin) : '—'} />
                  <InfoRow label="Actualización" value={timeAgo(resultados.ultima_actualizacion)} last />
                </div>
              </div>
            </div>

            {/* Detailed table */}
            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Tabla detallada</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Opción</th><th>Votos</th><th>Porcentaje</th><th>Barra</th></tr>
                  </thead>
                  <tbody>
                    {resultados.resultados.map((r, i) => {
                      const candidate = findCandidateData(encuesta, r.opcion);
                      return (
                        <tr key={r.opcion}>
                          <td className="mono" style={{ fontWeight: 700 }}>{i + 1}</td>
                          <td>
                            {candidate && <TableAvatar candidate={candidate} name={r.opcion} />}
                            {candidate?.numero != null && (
                              <span style={{ display: 'inline-block', background: 'var(--color-primary)', color: 'var(--color-accent)', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4, marginRight: 6, verticalAlign: 'middle' }}>N.° {candidate.numero}</span>
                            )}
                            {r.opcion}
                            {candidate?.url_hoja_vida && (
                              <a href={candidate.url_hoja_vida} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6, fontSize: '0.7rem', color: 'var(--color-secondary)', textDecoration: 'none', opacity: 0.7 }}
                                title="Hoja de vida">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            )}
                          </td>
                          <td className="mono" style={{ fontWeight: 700 }}>{formatNumber(r.cantidad)}</td>
                          <td className="mono">{r.porcentaje}%</td>
                          <td style={{ width: 150 }}>
                            <div className="progress-bar" style={{ height: 12 }}>
                              <div className="progress-bar-fill" style={{ width: `${r.porcentaje}%`, background: colors[i] }}></div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Share / CSV */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-primary btn-sm" onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'EncuestaPe — Resultados', url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Enlace copiado al portapapeles');
                }
              }}>Compartir</button>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }} onClick={() => {
                let csv = 'Opción,Votos,Porcentaje\n';
                resultados.resultados.forEach(r => {
                  csv += `"${r.opcion}",${r.cantidad},${r.porcentaje}%\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `resultados_${encuesta.id}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}>Descargar CSV</button>
            </div>
          </>
        )}

        {/* Link to full results page */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
          <Link to="/resultados" className="btn btn-primary">Ver más detallado</Link>
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value, mono, last }: { label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid var(--border-subtle)', fontSize: '0.9rem',
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }} className={mono ? 'mono' : ''}>{value}</span>
    </div>
  );
}

function TableAvatar({ candidate, name }: { candidate: { foto_url: string }; name: string }) {
  const [err, setErr] = useState(false);
  if (!candidate.foto_url || err) {
    return (
      <span style={{ display: 'inline-flex', width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-accent)', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, verticalAlign: 'middle', marginRight: 8 }}>
        {getInitials(name)}
      </span>
    );
  }
  return <img src={candidate.foto_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 8 }} onError={() => setErr(true)} />;
}
