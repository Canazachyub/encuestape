import { Link } from 'react-router-dom';
import type { Encuesta } from '../../types';
import { formatNumber } from '../../utils/format';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface HeroSectionProps {
  activeEncuesta?: Encuesta;
}

export default function HeroSection({ activeEncuesta }: HeroSectionProps) {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  return (
    <section className="hero" id="inicio" ref={ref}>
      <div className="hero-bg">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&q=80"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.15,
            filter: 'blur(2px)',
          }}
        />
      </div>
      <div className="container">
        <div className="hero-content">
          <h1 className={`hero-title animate-on-scroll${isVisible ? ' visible' : ''}`}>
            La voz del <span className="accent">Perú</span><br />en datos
          </h1>
          <p className={`hero-subtitle animate-on-scroll${isVisible ? ' visible' : ''}`} style={{ transitionDelay: '0.15s' }}>
            Participa en las encuestas que definen el futuro del país. Tu opinión importa.
          </p>
          <div className={`hero-buttons animate-on-scroll${isVisible ? ' visible' : ''}`} style={{ transitionDelay: '0.3s' }}>
            <Link to="/votar/E01" className="btn btn-primary btn-lg">Participar ahora</Link>
            <a href="#resultados" className="btn btn-secondary btn-lg">Ver resultados</a>
          </div>
          <div className={`hero-highlight animate-on-scroll${isVisible ? ' visible' : ''}`} style={{ transitionDelay: '0.45s' }}>
            <span className="hero-highlight-badge">EN VIVO</span>
            <span className="hero-highlight-count">{activeEncuesta ? formatNumber(activeEncuesta.total_votos) : '0'}</span>
            <span>votos registrados en {activeEncuesta?.titulo || 'Elecciones 2026'}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
