import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { NewsArticle } from '../../types';
import { timeAgo } from '../../utils/format';
import { resolveImageUrl } from '../../utils/googleDrive';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface NewsSectionProps {
  noticias: NewsArticle[];
}

export default function NewsSection({ noticias }: NewsSectionProps) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.05 });
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const published = noticias
    .filter(n => n.publicado)
    .sort((a, b) => new Date(b.fecha_publicacion).getTime() - new Date(a.fecha_publicacion).getTime());

  if (published.length === 0) return null;

  const mainNews = published[0];
  const sideNews = published.slice(1, 5);
  const destacadas = published.filter(n => n.destacado);
  const carouselNews = destacadas.length > 0 ? destacadas : published.slice(5, 12);
  const hasSlide2 = carouselNews.length > 0;

  const goToSlide = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveSlide(idx);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    if (!hasSlide2) return;
    goToSlide(activeSlide === 0 ? 1 : 0);
  }, [activeSlide, hasSlide2, goToSlide]);

  const prevSlide = useCallback(() => {
    if (!hasSlide2) return;
    goToSlide(activeSlide === 0 ? 1 : 0);
  }, [activeSlide, hasSlide2, goToSlide]);

  // Auto-play every 8 seconds
  useEffect(() => {
    if (!hasSlide2) return;
    autoPlayRef.current = setInterval(() => {
      setActiveSlide(prev => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [hasSlide2]);

  const resetAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (hasSlide2) {
      autoPlayRef.current = setInterval(() => {
        setActiveSlide(prev => (prev === 0 ? 1 : 0));
      }, 8000);
    }
  };

  const handlePrev = () => { prevSlide(); resetAutoPlay(); };
  const handleNext = () => { nextSlide(); resetAutoPlay(); };
  const handleDot = (idx: number) => { goToSlide(idx); resetAutoPlay(); };

  const scrollDestacadas = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const renderImage = (article: NewsArticle, className: string, placeholderClass: string) => {
    const url = resolveImageUrl(article.imagen_url);
    return url ? (
      <img src={url} alt={article.titulo} className={className} loading="lazy" />
    ) : (
      <div className={placeholderClass} />
    );
  };

  return (
    <section className="section news-section" id="noticias" ref={ref}>
      <div className="container">
        {/* Header */}
        <div className={`news-header animate-on-scroll${isVisible ? ' visible' : ''}`}>
          <div className="news-header-text">
            <h2 className="news-main-title">Noticias y Análisis</h2>
            <p className="news-main-subtitle">Lo último en política y elecciones</p>
          </div>
          {hasSlide2 && (
            <div className="news-nav">
              <button className="news-nav-arrow" onClick={handlePrev} aria-label="Anterior">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="news-dots">
                <button
                  className={`news-dot${activeSlide === 0 ? ' active' : ''}`}
                  onClick={() => handleDot(0)}
                  aria-label="Últimas noticias"
                >
                  <span className="news-dot-label">Últimas</span>
                </button>
                <button
                  className={`news-dot${activeSlide === 1 ? ' active' : ''}`}
                  onClick={() => handleDot(1)}
                  aria-label="Destacadas"
                >
                  <span className="news-dot-label">Destacadas</span>
                </button>
              </div>
              <button className="news-nav-arrow" onClick={handleNext} aria-label="Siguiente">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {hasSlide2 && (
          <div className={`news-progress-bar animate-on-scroll${isVisible ? ' visible' : ''}`} style={{ transitionDelay: '0.1s' }}>
            <div className={`news-progress-fill${activeSlide === 0 ? ' left' : ' right'}`} />
          </div>
        )}

        {/* Slides container */}
        <div className={`news-slides-container animate-on-scroll${isVisible ? ' visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
          {/* SLIDE 1: Hero Grid */}
          <div className={`news-slide${activeSlide === 0 ? ' active' : ''}`}>
            <div className="news-hero-grid">
              {/* Big card */}
              <Link to={`/noticias/${mainNews.id}`} className="news-hero-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="news-hero-img">
                  {renderImage(mainNews, 'news-hero-photo', 'news-hero-placeholder')}
                  <div className="news-hero-overlay">
                    <span className="news-badge">{mainNews.categoria}</span>
                    <h3 className="news-hero-title">{mainNews.titulo}</h3>
                    <p className="news-hero-excerpt">{mainNews.extracto}</p>
                    <div className="news-hero-meta">
                      <span className="news-meta-author">{mainNews.autor}</span>
                      <span className="news-meta-dot">·</span>
                      <span>{timeAgo(mainNews.fecha_publicacion)}</span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* 4 small cards (2x2 grid) */}
              <div className="news-side-grid">
                {sideNews.map(article => (
                  <Link key={article.id} to={`/noticias/${article.id}`} className="news-side-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="news-side-img">
                      {renderImage(article, 'news-side-photo', 'news-side-placeholder')}
                      <div className="news-side-overlay">
                        <span className="news-badge">{article.categoria}</span>
                        <h4 className="news-side-title">{article.titulo}</h4>
                        <span className="news-side-time">{timeAgo(article.fecha_publicacion)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* SLIDE 2: Destacadas */}
          {hasSlide2 && (
            <div className={`news-slide${activeSlide === 1 ? ' active' : ''}`}>
              <div className="news-destacadas-slide">
                <div className="news-destacadas-header">
                  <div className="news-destacadas-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    NOTICIAS DESTACADAS
                  </div>
                  <div className="news-destacadas-arrows">
                    <button onClick={() => scrollDestacadas('left')} className="news-dest-arrow" aria-label="Anterior">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                    </button>
                    <button onClick={() => scrollDestacadas('right')} className="news-dest-arrow" aria-label="Siguiente">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                    </button>
                  </div>
                </div>

                <div className="news-destacadas-track" ref={carouselRef}>
                  {carouselNews.map(article => {
                    const imgUrl = resolveImageUrl(article.imagen_url);
                    return (
                      <Link key={article.id} to={`/noticias/${article.id}`} className="news-dest-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="news-dest-img-wrap">
                          {imgUrl ? (
                            <img src={imgUrl} alt={article.titulo} loading="lazy" />
                          ) : (
                            <div className="news-dest-placeholder" />
                          )}
                          <span className="news-badge news-dest-badge">{article.categoria}</span>
                        </div>
                        <div className="news-dest-body">
                          <h4 className="news-dest-title">{article.titulo}</h4>
                          <p className="news-dest-excerpt">{article.extracto}</p>
                          <div className="news-dest-meta">
                            <span>{article.autor}</span>
                            <span className="news-meta-dot">·</span>
                            <span>{timeAgo(article.fecha_publicacion)}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Slide indicator (bottom dots) */}
        {hasSlide2 && (
          <div className="news-slide-indicators">
            <button className={`news-indicator${activeSlide === 0 ? ' active' : ''}`} onClick={() => handleDot(0)} />
            <button className={`news-indicator${activeSlide === 1 ? ' active' : ''}`} onClick={() => handleDot(1)} />
          </div>
        )}

        {/* Portal link */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
          <Link to="/noticias" className="btn btn-primary">
            Ver portal de noticias completo
          </Link>
        </div>
      </div>
    </section>
  );
}
