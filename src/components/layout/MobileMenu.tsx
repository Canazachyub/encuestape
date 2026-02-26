import { Link } from 'react-router-dom';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <>
      <div className={`mobile-overlay${isOpen ? ' active' : ''}`} onClick={onClose} />
      <div className={`mobile-menu${isOpen ? ' active' : ''}`}>
        <a href="#inicio" onClick={onClose}>Inicio</a>
        <Link to="/noticias" onClick={onClose}>Noticias</Link>
        <a href="#explorar" onClick={onClose}>Mapa</a>
        <a href="#encuestas" onClick={onClose}>Encuestas</a>
        <a href="#resultados" onClick={onClose}>Resultados</a>
        <a href="#contacto" onClick={onClose}>Contacto</a>
        <Link to="/admin" onClick={onClose} style={{ marginTop: 'auto', opacity: 0.5, fontSize: '0.85rem' }}>
          Panel Admin
        </Link>
      </div>
    </>
  );
}
