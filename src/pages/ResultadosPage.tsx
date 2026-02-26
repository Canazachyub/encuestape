import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Encuesta, ResultadosData } from '../types';
import { REGIONES_PERU, TIPOS_ELECCION, CONFIG } from '../config/constants';
import { useDemoData } from '../context/DemoDataContext';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formatNumber, formatDate, timeAgo } from '../utils/format';
import { findCandidateData, getInitials, getChartColors } from '../utils/helpers';
import Navbar from '../components/layout/Navbar';
import MobileMenu from '../components/layout/MobileMenu';
import Footer from '../components/layout/Footer';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import type { RegionCode, TipoEleccionCode } from '../types';

export default function ResultadosPage() {
  const { id: requestedId } = useParams<{ id: string }>();
  const { api, data } = useDemoData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [regionFilter, setRegionFilter] = useState('TODOS');
  const [tipoFilter, setTipoFilter] = useState('TODOS');
  const [encuestasList, setEncuestasList] = useState<Encuesta[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [encuesta, setEncuesta] = useState<Encuesta | null>(null);
  const [resultados, setResultados] = useState<ResultadosData | null>(null);

  // Load encuestas list
  useEffect(() => {
    const loadList = async () => {
      const filtered = await api.getEncuestasByFilter(regionFilter, tipoFilter);
      setEncuestasList(filtered.encuestas);
      if (filtered.encuestas.length > 0) {
        const startId = requestedId || filtered.encuestas[0].id;
        const hasId = filtered.encuestas.some(e => e.id === startId);
        setSelectedId(hasId ? startId : filtered.encuestas[0].id);
      }
    };
    loadList();
  }, [api, regionFilter, tipoFilter, requestedId]);

  const loadResults = useCallback(async () => {
    if (!selectedId) return;
    const allEnc = await api.getEncuestas();
    const enc = allEnc.encuestas.find(e => e.id === selectedId);
    setEncuesta(enc || null);
    const res = await api.getResultados(selectedId);
    setResultados(res);
  }, [api, selectedId]);

  useEffect(() => { loadResults(); }, [loadResults]);
  useAutoRefresh(loadResults, CONFIG.REFRESH_INTERVAL);

  const downloadCSV = () => {
    if (!resultados) return;
    let csv = 'Opción,Votos,Porcentaje\n';
    resultados.resultados.forEach(r => {
      csv += `"${r.opcion}",${r.cantidad},${r.porcentaje}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${selectedId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'EncuestaPe — Resultados', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const colors = resultados ? getChartColors(resultados.resultados.length) : [];
  const progress = encuesta && encuesta.meta_votos > 0 && resultados
    ? ((resultados.total_votos / encuesta.meta_votos) * 100).toFixed(1) : '0';

  return (
    <div className="results-page">
      <Navbar fixed={false} onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Hero */}
      <section className="results-hero" style={{ background: 'var(--color-primary)', padding: 'var(--space-2xl) 0', color: 'var(--text-white)' }}>
        <div className="container">
          <div className="results-hero-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '2rem', color: 'var(--text-white)' }}>Centro de Resultados</h1>
              <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Datos actualizados en tiempo real</p>
            </div>
            <span className="badge badge-live" style={{ fontSize: '0.85rem', padding: '6px 16px' }}>EN VIVO</span>
          </div>
        </div>
      </section>

      {/* Controls */}
      <div className="container">
        <div className="results-controls" style={{ padding: 'var(--space-lg) 0', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            style={{ padding: '10px 16px', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', background: 'var(--bg-white)', minWidth: 250 }}>
            <option value="TODOS">Todas las regiones</option>
            {(Object.entries(REGIONES_PERU) as [RegionCode, { nombre: string }][])
              .filter(([k]) => k !== 'NACIONAL')
              .map(([k, d]) => <option key={k} value={k}>{d.nombre}</option>)}
          </select>
          <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
            style={{ padding: '10px 16px', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', background: 'var(--bg-white)', minWidth: 250 }}>
            <option value="TODOS">Todos los tipos</option>
            {(Object.entries(TIPOS_ELECCION) as [TipoEleccionCode, { nombre: string }][]).map(([k, d]) => (
              <option key={k} value={k}>{d.nombre}</option>
            ))}
          </select>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ padding: '10px 16px', border: '1.5px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', background: 'var(--bg-white)', minWidth: 250 }}>
            {encuestasList.map(enc => {
              const regionName = REGIONES_PERU[enc.region]?.nombre || '';
              return (
                <option key={enc.id} value={enc.id}>
                  {enc.titulo} ({enc.estado}){regionName && enc.region !== 'NACIONAL' ? ` — ${regionName}` : ''}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main */}
      <div className="container" style={{ padding: 'var(--space-xl) 0 var(--space-4xl)' }}>
        {resultados && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }} className="results-grid">
              <div className="results-chart-card" style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
                  {encuesta?.titulo || 'Distribución de votos'}
                </h3>
                <div style={{ position: 'relative', height: 350 }}>
                  <BarChart resultados={resultados.resultados} />
                </div>
              </div>
              <div>
                <div className="results-chart-card" style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)', marginBottom: 'var(--space-lg)' }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-md)' }}>Proporción</h3>
                  <div style={{ position: 'relative', height: 250 }}>
                    <DoughnutChart resultados={resultados.resultados} />
                  </div>
                </div>
                <div className="info-card" style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Información</h3>
                  <InfoRow label="Total participantes" value={formatNumber(resultados.total_votos)} mono />
                  <InfoRow label="Meta" value={encuesta ? formatNumber(encuesta.meta_votos) : '—'} mono />
                  <InfoRow label="Progreso" value={`${progress}%`} mono />
                  <InfoRow label="Inicio" value={encuesta ? formatDate(encuesta.fecha_inicio) : '—'} />
                  <InfoRow label="Cierre" value={encuesta?.fecha_fin ? formatDate(encuesta.fecha_fin) : '—'} />
                  <InfoRow label="Actualización" value={timeAgo(resultados.ultima_actualizacion)} last />
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Tabla detallada</h3>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Opción</th><th>Votos</th><th>Porcentaje</th><th>Barra</th></tr>
                  </thead>
                  <tbody>
                    {resultados.resultados.map((r, i) => {
                      const candidate = encuesta ? findCandidateData(encuesta, r.opcion) : null;
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

            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', marginTop: 'var(--space-xl)' }}>
              <button className="btn btn-primary btn-sm" onClick={handleShare}>Compartir</button>
              <button className="btn btn-outline btn-sm" onClick={downloadCSV} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>Descargar CSV</button>
            </div>
          </>
        )}
      </div>

      <Footer minimal />
    </div>
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
