import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminDataResponse, CandidateOption, DenunciaCiudadana, Encuesta, EncuestaOption, ForoPregunta, ImageItem, NewsArticle, ResultadosData } from '../types';
import { CONFIG, REGIONES_PERU, TIPOS_ELECCION, NEWS_CATEGORIES, DENUNCIA_CATEGORIES, FORO_CATEGORIES } from '../config/constants';
import { useDemoData } from '../context/DemoDataContext';
import { useAuth } from '../context/AuthContext';
import { hashSHA256 } from '../utils/hash';
import { formatNumber, timeAgo } from '../utils/format';
import { getOptionName, findCandidateData, getInitials } from '../utils/helpers';
import BarChart from '../components/charts/BarChart';
import DoughnutChart from '../components/charts/DoughnutChart';
import LineChart from '../components/charts/LineChart';

type Section = 'dashboard' | 'encuestas' | 'resultados' | 'noticias' | 'imagenes' | 'denuncias' | 'foro' | 'config';

export default function AdminPage() {
  const { api, data, updateData } = useDemoData();
  const { isAuthenticated, login, logout } = useAuth();
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] = useState<AdminDataResponse | null>(null);
  const [selectedEncuesta, setSelectedEncuesta] = useState('');
  const [resultados, setResultados] = useState<ResultadosData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);

  // Login state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const loadAdminData = useCallback(async () => {
    const d = await api.getAdminData();
    setAdminData(d);
    if (d.encuestas.length > 0 && !selectedEncuesta) {
      setSelectedEncuesta(d.encuestas[0].id);
    }
  }, [api, selectedEncuesta]);

  useEffect(() => {
    if (isAuthenticated) loadAdminData();
  }, [isAuthenticated, loadAdminData]);

  const loadResultsForEncuesta = useCallback(async (id: string) => {
    const res = await api.getResultados(id);
    setResultados(res);
  }, [api]);

  useEffect(() => {
    if (selectedEncuesta) loadResultsForEncuesta(selectedEncuesta);
  }, [selectedEncuesta, loadResultsForEncuesta]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const passHash = await hashSHA256(loginPass);
      const result = await api.loginAdmin(loginUser, passHash);
      if (result.exito && result.token) {
        login(result.token);
      } else {
        setLoginError(result.mensaje || 'Credenciales inválidas.');
      }
    } catch {
      setLoginError('Error de conexión.');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const closeEncuesta = (id: string) => {
    if (!confirm('¿Cerrar esta encuesta? Ya no aceptará nuevos votos.')) return;
    updateData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const enc = next.encuestas.find((e: Encuesta) => e.id === id);
      if (enc) enc.estado = 'cerrada';
      return next;
    });
    if (!CONFIG.DEMO_MODE) api.cerrarEncuesta(id).catch(console.error);
    loadAdminData();
  };

  const exportCSV = () => {
    if (!resultados) return;
    let csv = 'Opción,Votos,Porcentaje\n';
    resultados.resultados.forEach(r => {
      csv += `"${r.opcion}",${r.cantidad},${r.porcentaje}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${selectedEncuesta}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <div className="login-card">
            <div className="login-logo">
              <img src="/assets/logo.svg" alt="EncuestaPe" />
              <h2>Panel de Administración</h2>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <input type="text" className="form-input" placeholder="admin" autoComplete="username" required value={loginUser} onChange={e => setLoginUser(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input type="password" className="form-input" placeholder="••••••••" autoComplete="current-password" required value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              {loginError && <div className="alert alert-error">{loginError}</div>}
              <button type="submit" className="btn btn-primary btn-block">Ingresar</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 'var(--space-md)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Demo: admin / admin</p>
          </div>
        </div>
      </div>
    );
  }

  const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
  const currentEnc = adminData?.encuestas.find(e => e.id === selectedEncuesta);

  // Demo votes per hour data
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const votesPerHour = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 5);

  return (
    <div className="admin-page">
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`admin-sidebar${sidebarOpen ? ' active' : ''}`}>
          <div className="sidebar-logo">
            <img src="/assets/icon-white.svg" alt="" className="navbar-icon" />
            <span>Encuesta<span className="pe">Pe</span></span>
          </div>
          <nav className="sidebar-nav">
            {(['dashboard', 'encuestas', 'resultados', 'noticias', 'imagenes', 'denuncias', 'foro', 'config'] as Section[]).map(s => (
              <a key={s} href="#" className={`sidebar-link${section === s ? ' active' : ''}`}
                onClick={e => { e.preventDefault(); setSection(s); setSidebarOpen(false); }}>
                <SidebarIcon section={s} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="sidebar-logout" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="admin-main">
          <div className="admin-topbar">
            <div className="flex" style={{ alignItems: 'center', gap: 'var(--space-md)' }}>
              <button className="admin-toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
              </button>
              <h1>{sectionTitle}</h1>
            </div>
            <Link to="/" className="btn btn-outline btn-sm" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>Ver sitio</Link>
          </div>

          {/* Dashboard */}
          {section === 'dashboard' && adminData && (
            <section className="admin-section active">
              <div className="kpi-grid">
                <div className="kpi-card"><div className="kpi-label">Total votos</div><div className="kpi-value">{formatNumber(adminData.estadisticas.total_votos)}</div></div>
                <div className="kpi-card"><div className="kpi-label">Total encuestas</div><div className="kpi-value">{adminData.estadisticas.total_encuestas}</div></div>
                <div className="kpi-card"><div className="kpi-label">Encuestas activas</div><div className="kpi-value">{adminData.encuestas.filter(e => e.estado === 'activa').length}</div></div>
                <div className="kpi-card"><div className="kpi-label">Regiones</div><div className="kpi-value">{adminData.estadisticas.regiones}</div></div>
              </div>

              <div className="chart-card">
                <h3>Votos recientes</h3>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Encuesta</th><th>Opción</th><th>Tiempo</th><th>Región</th></tr></thead>
                    <tbody>
                      {adminData.votos_recientes.map((v, i) => (
                        <tr key={i}>
                          <td><span className="badge badge-active" style={{ fontSize: '0.7rem' }}>{v.encuesta_id}</span></td>
                          <td>{v.opcion.length > 30 ? v.opcion.substring(0, 30) + '...' : v.opcion}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{timeAgo(v.timestamp)}</td>
                          <td>{v.region}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="chart-card">
                <h3>Votos por hora (hoy)</h3>
                <div className="chart-container">
                  <LineChart labels={hours} data={votesPerHour} />
                </div>
              </div>
            </section>
          )}

          {/* Encuestas */}
          {section === 'encuestas' && adminData && (
            <section className="admin-section active">
              <div className="admin-table-header">
                <h2>Gestión de Encuestas</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>+ Nueva encuesta</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ID</th><th>Título</th><th>Región</th><th>Tipo</th><th>Estado</th><th>Votos</th><th>Meta</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {adminData.encuestas.map(enc => {
                      const badgeClass = enc.estado === 'activa' ? 'badge-active' : enc.estado === 'cerrada' ? 'badge-closed' : 'badge-upcoming';
                      const regionName = REGIONES_PERU[enc.region]?.nombre || enc.region || '—';
                      const tipoName = TIPOS_ELECCION[enc.tipo_eleccion]?.nombre || enc.tipo_eleccion || '—';
                      return (
                        <tr key={enc.id}>
                          <td className="mono" style={{ fontWeight: 700, fontSize: '0.8rem' }}>{enc.id}</td>
                          <td>{enc.titulo}</td>
                          <td style={{ fontSize: '0.8rem' }}>{regionName}</td>
                          <td style={{ fontSize: '0.8rem' }}>{tipoName}</td>
                          <td><span className={`badge ${badgeClass}`}>{enc.estado}</span></td>
                          <td className="mono">{formatNumber(enc.total_votos)}</td>
                          <td className="mono">{formatNumber(enc.meta_votos)}</td>
                          <td>
                            <div className="admin-actions">
                              <button className="btn btn-outline btn-sm" onClick={() => { setSection('resultados'); setSelectedEncuesta(enc.id); }}>Resultados</button>
                              {enc.estado === 'activa' && (
                                <button className="btn btn-danger btn-sm" onClick={() => closeEncuesta(enc.id)}>Cerrar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Resultados */}
          {section === 'resultados' && adminData && (
            <section className="admin-section active">
              <div className="admin-table-header">
                <h2>Resultados detallados</h2>
                <select className="form-input" style={{ width: 'auto' }} value={selectedEncuesta} onChange={e => setSelectedEncuesta(e.target.value)}>
                  {adminData.encuestas.map(enc => (
                    <option key={enc.id} value={enc.id}>{enc.titulo}</option>
                  ))}
                </select>
              </div>

              {resultados && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
                    <div className="chart-card">
                      <h3>Distribución de votos</h3>
                      <div className="chart-container"><BarChart resultados={resultados.resultados} barThickness={30} /></div>
                    </div>
                    <div className="chart-card">
                      <h3>Proporción</h3>
                      <div className="chart-container"><DoughnutChart resultados={resultados.resultados} /></div>
                    </div>
                  </div>

                  <div className="chart-card">
                    <div className="admin-table-header">
                      <h3>Tabla de resultados</h3>
                      <button className="btn btn-outline btn-sm" onClick={exportCSV}>Exportar CSV</button>
                    </div>
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>#</th><th>Opción</th><th>Votos</th><th>Porcentaje</th></tr></thead>
                        <tbody>
                          {resultados.resultados.map((r, i) => {
                            const candidate = currentEnc ? findCandidateData(currentEnc, r.opcion) : null;
                            return (
                              <tr key={r.opcion}>
                                <td className="mono">{i + 1}</td>
                                <td>
                                  {candidate && <SmallAvatar fotoUrl={candidate.foto_url} name={r.opcion} />}
                                  {r.opcion}
                                </td>
                                <td className="mono" style={{ fontWeight: 700 }}>{formatNumber(r.cantidad)}</td>
                                <td className="mono">{r.porcentaje}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Noticias */}
          {section === 'noticias' && (
            <section className="admin-section active">
              <div className="admin-table-header">
                <h2>Gestión de Noticias</h2>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingNews(null); setNewsModalOpen(true); }}>+ Nueva noticia</button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Título</th><th>Categoría</th><th>Autor</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {data.noticias
                      .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime())
                      .map(article => (
                      <tr key={article.id}>
                        <td style={{ maxWidth: 280 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {article.imagen_url && (
                              <img src={article.imagen_url} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                            )}
                            <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{article.titulo.length > 50 ? article.titulo.substring(0, 50) + '...' : article.titulo}</span>
                          </div>
                        </td>
                        <td><span className="news-badge" style={{ fontSize: '0.7rem' }}>{article.categoria}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{article.autor}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{timeAgo(article.fecha_publicacion)}</td>
                        <td>
                          <span className={`news-status-badge ${article.publicado ? 'published' : 'draft'}`}>
                            {article.publicado ? 'Publicado' : 'Borrador'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-actions">
                            <button className="btn btn-outline btn-sm" onClick={() => { setEditingNews(article); setNewsModalOpen(true); }}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => {
                              if (!confirm('¿Eliminar esta noticia?')) return;
                              updateData(prev => {
                                const next = JSON.parse(JSON.stringify(prev));
                                next.noticias = next.noticias.filter((n: NewsArticle) => n.id !== article.id);
                                return next;
                              });
                              if (!CONFIG.DEMO_MODE) api.eliminarNoticia(article.id).catch(console.error);
                            }}>Borrar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.noticias.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No hay noticias. Crea la primera.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Denuncias */}
          {section === 'denuncias' && (
            <section className="admin-section active">
              <div className="admin-table-header">
                <h2>Gestión de Denuncias</h2>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Título</th><th>Categoría</th><th>Región</th><th>Fecha</th><th>Estado</th><th>Apoyos</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {data.denuncias
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((d: DenunciaCiudadana) => (
                      <tr key={d.id}>
                        <td style={{ maxWidth: 250, fontWeight: 500, fontSize: '0.85rem' }}>
                          {d.titulo.length > 45 ? d.titulo.substring(0, 45) + '...' : d.titulo}
                        </td>
                        <td><span className="news-badge" style={{ fontSize: '0.7rem' }}>{d.categoria}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{d.region}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{timeAgo(d.fecha)}</td>
                        <td>
                          <select
                            value={d.estado}
                            onChange={e => {
                              const newEstado = e.target.value as DenunciaCiudadana['estado'];
                              updateData(prev => ({
                                ...prev,
                                denuncias: prev.denuncias.map((x: DenunciaCiudadana) =>
                                  x.id === d.id ? { ...x, estado: newEstado } : x
                                ),
                              }));
                              if (!CONFIG.DEMO_MODE) api.editarDenuncia(d.id, { estado: newEstado }).catch(console.error);
                            }}
                            style={{ padding: '4px 8px', fontSize: '0.78rem', borderRadius: 4, border: '1px solid var(--border-subtle)' }}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="revisada">Revisada</option>
                            <option value="publicada">Publicada</option>
                          </select>
                        </td>
                        <td className="mono" style={{ fontWeight: 700 }}>{d.votos_apoyo}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => {
                            if (!confirm('¿Eliminar esta denuncia?')) return;
                            updateData(prev => ({
                              ...prev,
                              denuncias: prev.denuncias.filter((x: DenunciaCiudadana) => x.id !== d.id),
                            }));
                            if (!CONFIG.DEMO_MODE) api.eliminarDenuncia(d.id).catch(console.error);
                          }}>Borrar</button>
                        </td>
                      </tr>
                    ))}
                    {data.denuncias.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No hay denuncias.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Foro */}
          {section === 'foro' && (
            <ForoAdmin data={data} updateData={updateData} api={api} />
          )}

          {/* Imagenes */}
          {section === 'imagenes' && (
            <ImagenesAdmin imagenes={data.imagenes || []} updateData={updateData} api={api} />
          )}

          {/* Config */}
          {section === 'config' && (
            <section className="admin-section active">
              <div className="chart-card">
                <h3>Configuración del sitio</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '0.9rem' }}>
                  Estos ajustes se guardan en la hoja "Config" del Google Sheet.
                </p>
                <div className="form-group"><label className="form-label">Título del sitio</label><input type="text" className="form-input" value="EncuestaPe" disabled /></div>
                <div className="form-group"><label className="form-label">Eslogan</label><input type="text" className="form-input" value="La voz del Perú en datos" disabled /></div>
                <div className="form-group"><label className="form-label">WhatsApp</label><input type="text" className="form-input" value="+51921647291" disabled /></div>
                <div className="form-group"><label className="form-label">Email de contacto</label><input type="text" className="form-input" value="contacto@encuestape.com" disabled /></div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Para editar la configuración, modifica directamente la hoja "Config" en Google Sheets.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Encuesta Modal */}
      {modalOpen && (
        <EncuestaModal
          onClose={() => { setModalOpen(false); loadAdminData(); }}
          updateData={updateData}
          encuestas={data.encuestas}
          api={api}
        />
      )}

      {/* News Modal */}
      {newsModalOpen && (
        <NewsModal
          article={editingNews}
          onClose={() => { setNewsModalOpen(false); setEditingNews(null); }}
          updateData={updateData}
          existingIds={data.noticias.map(n => n.id)}
          imagenes={data.imagenes || []}
          api={api}
        />
      )}
    </div>
  );
}

function SmallAvatar({ fotoUrl, name }: { fotoUrl: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!fotoUrl || err) {
    return <span style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary)', color: 'var(--color-accent)', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, verticalAlign: 'middle', marginRight: 6 }}>{getInitials(name)}</span>;
  }
  return <img src={fotoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 6 }} onError={() => setErr(true)} />;
}

function SidebarIcon({ section }: { section: Section }) {
  const icons: Record<Section, React.ReactNode> = {
    dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>,
    encuestas: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/></svg>,
    resultados: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
    noticias: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>,
    imagenes: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    denuncias: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    foro: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    config: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  };
  return <>{icons[section]}</>;
}

// Encuesta creation modal
function EncuestaModal({ onClose, updateData, encuestas, api }: {
  onClose: () => void;
  updateData: (updater: (prev: any) => any) => void;
  encuestas: Encuesta[];
  api: any;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoEleccion, setTipoEleccion] = useState('PRESIDENTE');
  const [region, setRegion] = useState('NACIONAL');
  const [categoria, setCategoria] = useState('ELECCIONES');
  const [meta, setMeta] = useState('1000');
  const [optionsMode, setOptionsMode] = useState<'manual' | 'json'>('manual');
  const [manualOptions, setManualOptions] = useState(['', '']);
  const [importedCandidates, setImportedCandidates] = useState<any[]>([]);
  const [addBlank, setAddBlank] = useState(true);
  const [addUndecided, setAddUndecided] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const regionDisabled = tipoEleccion === 'PRESIDENTE' || tipoEleccion === 'PARLAMENTO_ANDINO';

  useEffect(() => {
    if (tipoEleccion === 'PRESIDENTE' || tipoEleccion === 'PARLAMENTO_ANDINO') {
      setRegion('NACIONAL');
    } else if (region === 'NACIONAL' && (tipoEleccion === 'DIPUTADOS' || tipoEleccion === 'SENADORES')) {
      setRegion('LIMA');
    }
  }, [tipoEleccion]);

  const processJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let jsonData = JSON.parse(e.target?.result as string);
        if (!Array.isArray(jsonData)) {
          const arrKey = Object.keys(jsonData).find(k => Array.isArray(jsonData[k]));
          if (arrKey) jsonData = jsonData[arrKey];
          else { alert('El JSON debe contener un array de candidatos.'); return; }
        }

        const candidates = jsonData.map((item: any) => {
          let nombre = item.candidato_nombre || item.nombre || item.name || '';
          if (nombre === nombre.toUpperCase() && nombre.length > 2) {
            nombre = nombre.replace(/\b\w+/g, (w: string) => w.charAt(0) + w.slice(1).toLowerCase());
          }
          return {
            nombre,
            partido: item.partido || item.organizacion_politica || '',
            foto_url: item.url_foto || item.foto_url || '',
            logo_partido_url: item.logo_partido_url || '',
            url_hoja_vida: item.url_hoja_vida || item.url_detalle || '',
          };
        }).filter((c: any) => c.nombre);

        if (candidates.length === 0) {
          alert('No se encontraron candidatos válidos.');
          return;
        }

        setImportedCandidates(candidates);

        // Auto-detect
        const first = jsonData[0];
        const cargo = (first?.cargo || '').toUpperCase();
        if (cargo.includes('DIPUTADO')) setTipoEleccion('DIPUTADOS');
        else if (cargo.includes('SENADOR')) setTipoEleccion('SENADORES');
        else if (cargo.includes('PRESIDENT')) setTipoEleccion('PRESIDENTE');

        const distrito = (first?.distrito || '').toUpperCase();
        const distritoMap: Record<string, string> = {
          'PUNO': 'PUNO', 'LIMA': 'LIMA', 'CUSCO': 'CUSCO', 'AREQUIPA': 'AREQUIPA',
          'LA LIBERTAD': 'LA_LIBERTAD', 'PIURA': 'PIURA', 'JUNIN': 'JUNIN',
          'CAJAMARCA': 'CAJAMARCA', 'LAMBAYEQUE': 'LAMBAYEQUE', 'ANCASH': 'ANCASH',
          'LORETO': 'LORETO', 'CALLAO': 'CALLAO', 'HUANUCO': 'HUANUCO',
          'SAN MARTIN': 'SAN_MARTIN', 'ICA': 'ICA', 'AYACUCHO': 'AYACUCHO',
          'UCAYALI': 'UCAYALI', 'AMAZONAS': 'AMAZONAS', 'APURIMAC': 'APURIMAC',
          'TACNA': 'TACNA', 'TUMBES': 'TUMBES', 'MOQUEGUA': 'MOQUEGUA',
          'PASCO': 'PASCO', 'HUANCAVELICA': 'HUANCAVELICA', 'MADRE DE DIOS': 'MADRE_DE_DIOS',
        };
        if (distrito && distritoMap[distrito]) setRegion(distritoMap[distrito]);
        setCategoria('ELECCIONES');
        setMeta('5000');
      } catch (err: any) {
        alert('Error al leer el JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let options: EncuestaOption[];
    if (optionsMode === 'json') {
      if (importedCandidates.length < 2) { alert('El JSON debe tener al menos 2 candidatos.'); return; }
      options = importedCandidates.map(c => ({
        nombre: c.nombre, partido: c.partido || '', foto_url: c.foto_url || '',
        logo_partido_url: c.logo_partido_url || '', url_hoja_vida: c.url_hoja_vida || '',
      }));
      if (addBlank) options.push('Voto en blanco');
      if (addUndecided) options.push('Aún no he decidido');
    } else {
      const filtered = manualOptions.filter(v => v.trim());
      if (filtered.length < 2) { alert('Agrega al menos 2 opciones.'); return; }
      options = filtered;
    }

    const newId = 'E' + String(encuestas.length + 1).padStart(3, '0');
    const tipoNombre = TIPOS_ELECCION[tipoEleccion as keyof typeof TIPOS_ELECCION]?.nombre || tipoEleccion;
    const regionNombre = REGIONES_PERU[region as keyof typeof REGIONES_PERU]?.nombre || region;
    const finalTitulo = titulo.trim() || (region === 'NACIONAL'
      ? `${tipoNombre} — Elecciones 2026`
      : `${tipoNombre} por ${regionNombre} — Elecciones 2026`);

    updateData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.encuestas.push({
        id: newId, titulo: finalTitulo, descripcion, estado: 'activa', opciones: options,
        meta_votos: parseInt(meta) || 1000, fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: '', categoria, region, tipo_eleccion: tipoEleccion, total_votos: 0,
      });
      next.resultados[newId] = {
        encuesta_id: newId, total_votos: 0,
        resultados: options.map(o => ({ opcion: getOptionName(o), cantidad: 0, porcentaje: '0.0' })),
        ultima_actualizacion: new Date().toISOString(),
      };
      next.estadisticas.total_encuestas++;
      return next;
    });

    if (!CONFIG.DEMO_MODE) {
      api.crearEncuesta({ titulo: finalTitulo, descripcion, opciones: options, meta_votos: parseInt(meta) || 1000, tipo_eleccion: tipoEleccion, region, categoria }).catch(console.error);
    }

    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Nueva encuesta</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="encuesta-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input type="text" className="form-input" placeholder="Dejar vacío para auto-generar" value={titulo} onChange={e => setTitulo(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea className="form-input" rows={2} placeholder="Pregunta principal" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="form-group">
              <label className="form-label">Tipo de elección</label>
              <select className="form-input" value={tipoEleccion} onChange={e => setTipoEleccion(e.target.value)}>
                {Object.entries(TIPOS_ELECCION).map(([k, d]) => <option key={k} value={k}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Región</label>
              <select className="form-input" value={region} onChange={e => setRegion(e.target.value)} disabled={regionDisabled}>
                {Object.entries(REGIONES_PERU).map(([k, d]) => <option key={k} value={k}>{d.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="ELECCIONES">Elecciones</option>
              <option value="MUNICIPAL">Municipal</option>
              <option value="REGIONAL">Regional</option>
              <option value="GENERAL">General</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Opciones de respuesta</label>
            <div className="options-mode-tabs">
              <button type="button" className={`mode-tab${optionsMode === 'manual' ? ' active' : ''}`} onClick={() => setOptionsMode('manual')}>Manual</button>
              <button type="button" className={`mode-tab${optionsMode === 'json' ? ' active' : ''}`} onClick={() => setOptionsMode('json')}>Importar JSON</button>
            </div>

            {optionsMode === 'manual' && (
              <div>
                <div className="options-list">
                  {manualOptions.map((opt, i) => (
                    <div className="option-row" key={i}>
                      <input type="text" className="form-input" placeholder={`Opción ${i + 1}`}
                        value={opt} onChange={e => { const next = [...manualOptions]; next[i] = e.target.value; setManualOptions(next); }} />
                      {manualOptions.length > 2 && (
                        <button type="button" className="btn-remove" onClick={() => setManualOptions(manualOptions.filter((_, j) => j !== i))}>&times;</button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setManualOptions([...manualOptions, ''])}>+ Agregar opción</button>
              </div>
            )}

            {optionsMode === 'json' && (
              <div>
                {importedCandidates.length === 0 ? (
                  <div className="json-upload-zone" onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) processJsonFile(e.dataTransfer.files[0]); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-secondary)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    <p style={{ fontWeight: 500, marginTop: 8 }}>Arrastra tu archivo JSON aquí</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>o haz clic para seleccionar</span>
                    <input type="file" ref={fileInputRef} accept=".json" className="hidden"
                      onChange={e => { if (e.target.files?.[0]) processJsonFile(e.target.files[0]); }} />
                  </div>
                ) : (
                  <div>
                    <div className="json-preview-header">
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{importedCandidates.length} candidatos detectados</span>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => setImportedCandidates([])}
                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)', padding: '4px 10px', fontSize: '0.75rem' }}>Limpiar</button>
                    </div>
                    <div className="json-preview-list">
                      {importedCandidates.map((c, i) => (
                        <div className="json-preview-item" key={i}>
                          {c.foto_url ? (
                            <img src={c.foto_url} alt="" className="preview-photo" onError={e => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <span className="preview-initials">{getInitials(c.nombre)}</span>
                          )}
                          <div className="preview-info">
                            <div className="preview-name">{c.nombre}</div>
                            <div className="preview-party">{c.partido}</div>
                          </div>
                          <button type="button" className="btn-remove-candidate" onClick={() => setImportedCandidates(importedCandidates.filter((_, j) => j !== i))}>&times;</button>
                        </div>
                      ))}
                    </div>
                    <div className="json-extra-options">
                      <label><input type="checkbox" checked={addBlank} onChange={e => setAddBlank(e.target.checked)} /> Agregar "Voto en blanco"</label>
                      <label><input type="checkbox" checked={addUndecided} onChange={e => setAddUndecided(e.target.checked)} /> Agregar "Aún no he decidido"</label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Meta de votos</label>
            <input type="number" className="form-input" value={meta} min={10} onChange={e => setMeta(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">Guardar encuesta</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// News creation/edit modal
// NEWS_CATEGORIES imported from config/constants
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

function NewsModal({ article, onClose, updateData, existingIds, imagenes, api }: {
  article: NewsArticle | null;
  onClose: () => void;
  updateData: (updater: (prev: any) => any) => void;
  existingIds: string[];
  imagenes: ImageItem[];
  api: any;
}) {
  const isEditing = !!article;
  const [titulo, setTitulo] = useState(article?.titulo || '');
  const [extracto, setExtracto] = useState(article?.extracto || '');
  const [contenido, setContenido] = useState(article?.contenido || '');
  const [categoria, setCategoria] = useState(article?.categoria || NEWS_CATEGORIES[0]);
  const [autor, setAutor] = useState(article?.autor || 'Redacción Encuestape');
  const [imagenUrl, setImagenUrl] = useState(article?.imagen_url || '');
  const [publicado, setPublicado] = useState(article?.publicado ?? true);
  const [destacado, setDestacado] = useState(article?.destacado ?? false);
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'galeria'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      alert('La imagen es muy grande. Máximo 2MB.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen (JPG, PNG, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // Save to image library
      const imgId = 'IMG' + Date.now();
      const newImg: ImageItem = {
        id: imgId,
        nombre: file.name,
        data_url: dataUrl,
        fecha: new Date().toISOString(),
        size: file.size,
      };
      updateData(prev => ({
        ...prev,
        imagenes: [...(prev.imagenes || []), newImg],
      }));
      setImagenUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Group gallery images by day
  const groupedImages = (() => {
    const groups: Record<string, ImageItem[]> = {};
    const sorted = [...imagenes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    sorted.forEach(img => {
      const day = new Date(img.fecha).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' });
      if (!groups[day]) groups[day] = [];
      groups[day].push(img);
    });
    return groups;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) { alert('El título es obligatorio.'); return; }
    if (!extracto.trim()) { alert('El extracto es obligatorio.'); return; }

    updateData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next.noticias) next.noticias = [];

      if (isEditing) {
        const idx = next.noticias.findIndex((n: NewsArticle) => n.id === article.id);
        if (idx !== -1) {
          next.noticias[idx] = {
            ...next.noticias[idx],
            titulo: titulo.trim(),
            extracto: extracto.trim(),
            contenido: contenido.trim(),
            categoria,
            imagen_url: imagenUrl,
            autor: autor.trim() || 'Redacción Encuestape',
            publicado,
            destacado,
          };
        }
      } else {
        let newId = 'N' + String(next.noticias.length + 1).padStart(2, '0');
        while (existingIds.includes(newId)) {
          newId = 'N' + String(parseInt(newId.slice(1)) + 1).padStart(2, '0');
        }
        next.noticias.push({
          id: newId,
          titulo: titulo.trim(),
          extracto: extracto.trim(),
          contenido: contenido.trim(),
          categoria,
          imagen_url: imagenUrl,
          autor: autor.trim() || 'Redacción Encuestape',
          fecha_publicacion: new Date().toISOString(),
          publicado,
          destacado,
        });
      }
      return next;
    });

    if (!CONFIG.DEMO_MODE) {
      const noticiaData = {
        titulo: titulo.trim(), extracto: extracto.trim(), contenido: contenido.trim(),
        categoria, imagen_url: imagenUrl, autor: autor.trim() || 'Redacción Encuestape',
        publicado, destacado,
      };
      if (isEditing) api.editarNoticia(article!.id, noticiaData).catch(console.error);
      else api.crearNoticia(noticiaData).catch(console.error);
    }

    onClose();
  };

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEditing ? 'Editar noticia' : 'Nueva noticia'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="encuesta-form" onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input type="text" className="form-input" placeholder="Título de la noticia" value={titulo} onChange={e => setTitulo(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
              {NEWS_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Imagen</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <button type="button" className={`mode-tab${imageMode === 'upload' ? ' active' : ''}`} onClick={() => setImageMode('upload')}>
                Subir imagen
              </button>
              <button type="button" className={`mode-tab${imageMode === 'galeria' ? ' active' : ''}`} onClick={() => setImageMode('galeria')}>
                Galería ({imagenes.length})
              </button>
              <button type="button" className={`mode-tab${imageMode === 'url' ? ' active' : ''}`} onClick={() => setImageMode('url')}>
                URL externa
              </button>
            </div>

            {imageMode === 'upload' && (
              <div
                className="news-image-upload"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = ''; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = ''; if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]); }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <p style={{ fontWeight: 500, marginTop: 6, fontSize: '0.85rem' }}>Arrastra imagen o haz clic para subir</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>JPG, PNG — máximo 2MB. Se guarda en tu galería.</span>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleImageFile(e.target.files[0]); }} />
              </div>
            )}

            {imageMode === 'galeria' && (
              <div className="img-gallery-picker">
                {imagenes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No hay imágenes en la galería. Sube una desde "Subir imagen".
                  </div>
                ) : (
                  Object.entries(groupedImages).map(([day, imgs]) => (
                    <div key={day} className="img-gallery-day">
                      <div className="img-gallery-day-label">{day}</div>
                      <div className="img-gallery-grid">
                        {imgs.map(img => (
                          <div
                            key={img.id}
                            className={`img-gallery-thumb${imagenUrl === img.data_url ? ' selected' : ''}`}
                            onClick={() => setImagenUrl(img.data_url)}
                          >
                            <img src={img.data_url} alt={img.nombre} />
                            {imagenUrl === img.data_url && (
                              <div className="img-gallery-check">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {imageMode === 'url' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" className="form-input" placeholder="https://ejemplo.com/imagen.jpg" value={urlInput} onChange={e => setUrlInput(e.target.value)} style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { if (urlInput.trim()) { setImagenUrl(urlInput.trim()); } }}
                  style={{ whiteSpace: 'nowrap' }}>Aplicar</button>
              </div>
            )}

            {imagenUrl && (
              <div style={{ marginTop: 10 }}>
                <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={imagenUrl} alt="Vista previa" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setImagenUrl(''); setUrlInput(''); }}
                  style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)', marginTop: 6 }}>Quitar imagen</button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Extracto (resumen corto) *</label>
            <textarea className="form-input" rows={2} placeholder="Resumen breve que se muestra en la tarjeta" value={extracto} onChange={e => setExtracto(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Contenido completo</label>
            <textarea className="form-input" rows={5} placeholder="Texto completo de la noticia. Puedes copiar y pegar desde cualquier fuente." value={contenido} onChange={e => setContenido(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Autor</label>
            <input type="text" className="form-input" placeholder="Redacción Encuestape" value={autor} onChange={e => setAutor(e.target.value)} />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={publicado} onChange={e => setPublicado(e.target.checked)} style={{ accentColor: 'var(--color-secondary)' }} />
              Publicar ahora
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={destacado} onChange={e => setDestacado(e.target.checked)} style={{ accentColor: 'var(--color-accent)' }} />
              Marcar como destacado
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">{isEditing ? 'Guardar cambios' : 'Publicar noticia'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Image Gallery Manager
const IMG_MAX_SIZE = 2 * 1024 * 1024;

function ImagenesAdmin({ imagenes, updateData, api }: { imagenes: ImageItem[]; updateData: (fn: (prev: any) => any) => void; api: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (files: FileList) => {
    Array.from(files).forEach(file => {
      if (file.size > IMG_MAX_SIZE) { alert(`${file.name} excede 2MB.`); return; }
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const newImg: ImageItem = {
          id: 'IMG' + Date.now() + Math.random().toString(36).slice(2, 6),
          nombre: file.name,
          data_url: dataUrl,
          fecha: new Date().toISOString(),
          size: file.size,
        };
        updateData(prev => ({ ...prev, imagenes: [...(prev.imagenes || []), newImg] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteImage = (id: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    updateData(prev => ({ ...prev, imagenes: (prev.imagenes || []).filter((img: ImageItem) => img.id !== id) }));
    if (!CONFIG.DEMO_MODE) api.eliminarImagen(id).catch(console.error);
  };

  // Group by day
  const grouped: Record<string, ImageItem[]> = {};
  const sorted = [...imagenes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  sorted.forEach(img => {
    const day = new Date(img.fecha).toLocaleDateString('es-PE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(img);
  });

  const formatSize = (bytes: number) => bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';

  return (
    <section className="admin-section active">
      <div className="admin-table-header">
        <h2>Galería de Imágenes ({imagenes.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>+ Subir imágenes</button>
        <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden"
          onChange={e => { if (e.target.files) handleUpload(e.target.files); e.target.value = ''; }} />
      </div>

      <div
        className="img-manager-upload-zone"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
        onDragLeave={e => { e.currentTarget.style.borderColor = ''; }}
        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = ''; if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p style={{ fontWeight: 500, marginTop: 8, fontSize: '0.9rem' }}>Arrastra imágenes aquí o haz clic para subir</p>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>JPG, PNG — máximo 2MB por imagen. Se pueden subir varias a la vez.</span>
      </div>

      {imagenes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--text-secondary)' }}>
          No hay imágenes en la galería. Sube imágenes para usarlas en noticias.
        </div>
      ) : (
        Object.entries(grouped).map(([day, imgs]) => (
          <div key={day} className="img-manager-day-group">
            <div className="img-manager-day-label">{day} ({imgs.length})</div>
            <div className="img-manager-grid">
              {imgs.map(img => (
                <div key={img.id} className="img-manager-card">
                  <img src={img.data_url} alt={img.nombre} />
                  <div className="img-manager-info">
                    <span className="img-name" title={img.nombre}>{img.nombre}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{formatSize(img.size)}</span>
                    <button className="img-manager-delete" onClick={() => deleteImage(img.id)} title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

// Foro Admin Section
function ForoAdmin({ data, updateData, api }: { data: any; updateData: (fn: (prev: any) => any) => void; api: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ForoPregunta | null>(null);

  return (
    <section className="admin-section active">
      <div className="admin-table-header">
        <h2>Gestión del Foro</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Nueva pregunta</button>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Pregunta</th><th>Categoría</th><th>Fecha</th><th>Activa</th><th>Votos</th><th>Acciones</th></tr></thead>
          <tbody>
            {data.foro
              .sort((a: ForoPregunta, b: ForoPregunta) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .map((p: ForoPregunta) => (
              <tr key={p.id}>
                <td style={{ maxWidth: 300, fontWeight: 500, fontSize: '0.85rem' }}>
                  {p.pregunta.length > 55 ? p.pregunta.substring(0, 55) + '...' : p.pregunta}
                </td>
                <td><span className="news-badge" style={{ fontSize: '0.7rem' }}>{p.categoria}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{timeAgo(p.fecha)}</td>
                <td>
                  <button
                    className={`btn btn-sm ${p.activa ? 'btn-primary' : 'btn-outline'}`}
                    style={!p.activa ? { color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' } : {}}
                    onClick={() => {
                      updateData(prev => ({
                        ...prev,
                        foro: prev.foro.map((x: ForoPregunta) => ({
                          ...x,
                          activa: x.id === p.id ? !x.activa : (x.id === p.id ? x.activa : (p.activa ? x.activa : false)),
                        })),
                      }));
                      if (!CONFIG.DEMO_MODE) api.editarForoPregunta(p.id, { activa: !p.activa }).catch(console.error);
                    }}
                  >
                    {p.activa ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="mono" style={{ fontWeight: 700 }}>{p.total_votos}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => { setEditing(p); setModalOpen(true); }}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      if (!confirm('¿Eliminar esta pregunta?')) return;
                      updateData(prev => ({
                        ...prev,
                        foro: prev.foro.filter((x: ForoPregunta) => x.id !== p.id),
                      }));
                      if (!CONFIG.DEMO_MODE) api.eliminarForoPregunta(p.id).catch(console.error);
                    }}>Borrar</button>
                  </div>
                </td>
              </tr>
            ))}
            {data.foro.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)' }}>No hay preguntas del foro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ForoModal
          pregunta={editing}
          onClose={() => setModalOpen(false)}
          updateData={updateData}
          foro={data.foro}
          api={api}
        />
      )}
    </section>
  );
}

function ForoModal({ pregunta, onClose, updateData, foro, api }: {
  pregunta: ForoPregunta | null;
  onClose: () => void;
  updateData: (fn: (prev: any) => any) => void;
  foro: ForoPregunta[];
  api: any;
}) {
  const isEditing = !!pregunta;
  const [texto, setTexto] = useState(pregunta?.pregunta || '');
  const [descripcion, setDescripcion] = useState(pregunta?.descripcion || '');
  const [categoria, setCategoria] = useState(pregunta?.categoria || FORO_CATEGORIES[0]);
  const [activa, setActiva] = useState(pregunta?.activa ?? true);
  const [opciones, setOpciones] = useState<string[]>(
    pregunta?.opciones.map(o => o.texto) || ['', '']
  );

  const addOpcion = () => { if (opciones.length < 6) setOpciones([...opciones, '']); };
  const removeOpcion = (i: number) => { if (opciones.length > 2) setOpciones(opciones.filter((_, idx) => idx !== i)); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || opciones.filter(o => o.trim()).length < 2) return;

    const cleanOpciones = opciones.filter(o => o.trim());

    if (isEditing && pregunta) {
      updateData(prev => ({
        ...prev,
        foro: prev.foro.map((p: ForoPregunta) =>
          p.id === pregunta.id
            ? { ...p, pregunta: texto.trim(), descripcion: descripcion.trim(), categoria, activa, opciones: cleanOpciones.map((t, i) => ({ texto: t.trim(), votos: pregunta.opciones[i]?.votos || 0 })) }
            : (activa ? { ...p, activa: false } : p)
        ),
      }));
      if (!CONFIG.DEMO_MODE) api.editarForoPregunta(pregunta.id, { pregunta: texto.trim(), descripcion: descripcion.trim(), categoria, activa, opciones: cleanOpciones.map(t => t.trim()) }).catch(console.error);
    } else {
      const newId = 'F' + String(foro.length + 1).padStart(2, '0');
      const nueva: ForoPregunta = {
        id: newId,
        pregunta: texto.trim(),
        descripcion: descripcion.trim(),
        opciones: cleanOpciones.map(t => ({ texto: t.trim(), votos: 0 })),
        fecha: new Date().toISOString(),
        activa,
        categoria,
        total_votos: 0,
      };
      updateData(prev => ({
        ...prev,
        foro: activa
          ? [...prev.foro.map((p: ForoPregunta) => ({ ...p, activa: false })), nueva]
          : [...prev.foro, nueva],
      }));
      if (!CONFIG.DEMO_MODE) api.crearForoPregunta({ pregunta: texto.trim(), descripcion: descripcion.trim(), opciones: cleanOpciones.map(t => t.trim()), activa, categoria }).catch(console.error);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>{isEditing ? 'Editar pregunta' : 'Nueva pregunta del foro'}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Pregunta</label>
            <input type="text" className="form-input" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej: ¿Debería ser obligatorio el voto electrónico?" required />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción (contexto)</label>
            <textarea className="form-input" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} placeholder="Contexto adicional sobre la pregunta..." />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <select className="form-input" value={categoria} onChange={e => setCategoria(e.target.value)}>
              {FORO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Opciones de respuesta</label>
            {opciones.map((op, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <input
                  type="text"
                  className="form-input"
                  value={op}
                  onChange={e => { const next = [...opciones]; next[i] = e.target.value; setOpciones(next); }}
                  placeholder={`Opción ${i + 1}`}
                  required={i < 2}
                />
                {opciones.length > 2 && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeOpcion(i)} style={{ padding: '0 10px' }}>&times;</button>
                )}
              </div>
            ))}
            {opciones.length < 6 && (
              <button type="button" className="btn btn-outline btn-sm" onClick={addOpcion} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)', marginTop: 4 }}>
                + Agregar opción
              </button>
            )}
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={activa} onChange={e => setActiva(e.target.checked)} />
              Marcar como pregunta activa del día
            </label>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm">{isEditing ? 'Guardar' : 'Crear pregunta'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
