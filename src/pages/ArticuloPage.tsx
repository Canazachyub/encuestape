import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDemoData } from '../context/DemoDataContext';
import { timeAgo, formatDate } from '../utils/format';
import { resolveImageUrl } from '../utils/googleDrive';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function ArticuloPage() {
  const { id } = useParams<{ id: string }>();
  const { data } = useDemoData();

  const article = data.noticias.find(n => n.id === id);

  const related = useMemo(() => {
    if (!article) return [];
    return data.noticias
      .filter(n => n.id !== article.id && n.publicado && n.categoria === article.categoria)
      .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime())
      .slice(0, 4);
  }, [data.noticias, article]);

  const latestOther = useMemo(() => {
    if (!article) return [];
    return data.noticias
      .filter(n => n.id !== article.id && n.publicado && n.categoria !== article.categoria)
      .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime())
      .slice(0, 3);
  }, [data.noticias, article]);

  if (!article) {
    return (
      <div className="articulo-page">
        <Navbar fixed={false} />
        <div className="articulo-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)', opacity: 0.3 }}>404</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-md)' }}>Artículo no encontrado</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
            El artículo que buscas no existe o fue eliminado.
          </p>
          <Link to="/noticias" className="btn btn-primary">Volver al portal</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const imgUrl = resolveImageUrl(article.imagen_url);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: article.titulo, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleWhatsApp = () => {
    const text = `${article.titulo} — ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Split content into paragraphs
  const paragraphs = article.contenido
    .split(/\n\n|\n/)
    .filter(p => p.trim());

  return (
    <div className="articulo-page">
      <Navbar fixed={false} />

      {/* Hero banner */}
      <div className="articulo-hero">
        <div className="articulo-hero-bg">
          {imgUrl ? (
            <img src={imgUrl} alt="" className="articulo-hero-bg-img" />
          ) : null}
          <div className="articulo-hero-gradient" />
        </div>
        <div className="articulo-hero-content">
          <Link to="/noticias" className="articulo-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Portal de noticias
          </Link>
          <span className="articulo-badge">{article.categoria}</span>
          <h1 className="articulo-title">{article.titulo}</h1>
          <p className="articulo-excerpt">{article.extracto}</p>
          <div className="articulo-meta">
            <div className="articulo-author-avatar">
              {article.autor.charAt(0)}
            </div>
            <div className="articulo-meta-text">
              <span className="articulo-author-name">{article.autor}</span>
              <span className="articulo-meta-date">
                {formatDate(article.fecha_publicacion)} · {timeAgo(article.fecha_publicacion)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="articulo-body-wrapper">
        <div className="articulo-container">
          {/* Main image (if exists) */}
          {imgUrl && (
            <div className="articulo-main-img">
              <img src={imgUrl} alt={article.titulo} />
            </div>
          )}

          {/* Content */}
          <article className="articulo-content">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>{article.extracto}</p>
            )}
          </article>

          {/* Share bar */}
          <div className="articulo-share">
            <span className="articulo-share-label">Compartir:</span>
            <button className="articulo-share-btn" onClick={handleWhatsApp} title="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button className="articulo-share-btn" onClick={handleShare} title="Compartir enlace">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button className="articulo-share-btn" onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Enlace copiado'); }} title="Copiar enlace">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>

          {/* Tags / Category */}
          <div className="articulo-tags">
            <Link to="/noticias" className="articulo-tag">{article.categoria}</Link>
            {article.destacado && <span className="articulo-tag destacado">Destacado</span>}
          </div>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div className="articulo-related-section">
            <div className="articulo-container">
              <h3 className="articulo-related-title">Más en {article.categoria}</h3>
              <div className="articulo-related-grid">
                {related.map(r => (
                  <RelatedCard key={r.id} article={r} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other recent */}
        {latestOther.length > 0 && (
          <div className="articulo-latest-section">
            <div className="articulo-container">
              <h3 className="articulo-related-title">Otras noticias recientes</h3>
              <div className="articulo-related-grid">
                {latestOther.map(r => (
                  <RelatedCard key={r.id} article={r} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Back to portal */}
        <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0 var(--space-2xl)' }}>
          <Link to="/noticias" className="btn btn-primary">
            Ver más noticias
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function RelatedCard({ article }: { article: any }) {
  const imgUrl = resolveImageUrl(article.imagen_url);
  return (
    <Link to={`/noticias/${article.id}`} className="related-card">
      <div className="related-card-img">
        {imgUrl ? (
          <img src={imgUrl} alt="" loading="lazy" />
        ) : (
          <div className="related-card-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          </div>
        )}
      </div>
      <div className="related-card-body">
        <span className="related-card-badge">{article.categoria}</span>
        <h4 className="related-card-title">{article.titulo}</h4>
        <span className="related-card-time">{timeAgo(article.fecha_publicacion)}</span>
      </div>
    </Link>
  );
}
