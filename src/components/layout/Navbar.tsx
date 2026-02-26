import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
  fixed?: boolean;
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ fixed = true, onToggleMobileMenu }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!fixed) {
      setScrolled(true);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fixed]);

  const isLanding = location.pathname === '/';

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar"
      style={!fixed ? { background: 'rgba(10,30,61,0.95)' } : undefined}>
      <div className="container">
        <Link to="/" className="navbar-logo">
          <img src="/assets/icon-white.svg" alt="" className="navbar-icon" />
          <span>Encuesta<span className="pe">Pe</span></span>
        </Link>
        <div className="navbar-links">
          {isLanding ? (
            <>
              <a href="#inicio" className="active">Inicio</a>
              <Link to="/noticias">Noticias</Link>
              <a href="#explorar">Mapa</a>
              <a href="#encuestas">Encuestas</a>
              <a href="#resultados">Resultados</a>
              <a href="#contacto">Contacto</a>
            </>
          ) : (
            <>
              <Link to="/">Inicio</Link>
              <Link to="/noticias" className={location.pathname.startsWith('/noticias') ? 'active' : ''}>Noticias</Link>
              <Link to="/#encuestas">Encuestas</Link>
              <Link to="/resultados" className={location.pathname.startsWith('/resultados') ? 'active' : ''}>Resultados</Link>
              <Link to="/#contacto">Contacto</Link>
            </>
          )}
          <span className="badge badge-live navbar-live">EN VIVO</span>
        </div>
        <button className="hamburger" id="hamburger" aria-label="Menú" onClick={onToggleMobileMenu}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
}
