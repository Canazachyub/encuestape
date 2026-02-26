import { Link } from 'react-router-dom';
import { CONFIG } from '../../config/constants';

interface FooterProps {
  minimal?: boolean;
}

export default function Footer({ minimal }: FooterProps) {
  if (minimal) {
    return (
      <footer className="footer">
        <div className="container">
          <div className="footer-bottom" style={{ borderTop: 'none' }}>
            <span>&copy; 2026 EncuestaPe.com — Todos los derechos reservados</span>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="navbar-logo">
              <img src="/assets/icon-white.svg" alt="" className="navbar-icon" />
              <span style={{ color: 'white', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                Encuesta<span style={{ color: 'var(--color-accent)' }}>Pe</span>
              </span>
            </Link>
            <p>La voz del Perú en datos. Plataforma de encuestas electorales y de opinión pública.</p>
          </div>
          <div>
            <h4>Navegación</h4>
            <div className="footer-links">
              <a href="#inicio">Inicio</a>
              <a href="#encuestas">Encuestas</a>
              <Link to="/resultados">Resultados</Link>
              <a href="#como-funciona">Cómo funciona</a>
            </div>
          </div>
          <div>
            <h4>Contacto</h4>
            <div className="footer-links">
              <a href="mailto:contacto@encuestape.com">contacto@encuestape.com</a>
              <a href={`https://wa.me/${CONFIG.WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
          </div>
          <div>
            <h4>Legal</h4>
            <div className="footer-links">
              <a href="#">Términos de uso</a>
              <a href="#">Privacidad</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 EncuestaPe.com — Todos los derechos reservados</span>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
