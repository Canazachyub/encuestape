import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

export default function NotFoundPage() {
  return (
    <>
      <Navbar onToggleMobileMenu={() => {}} />
      <main className="not-found-page" style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-3xl) var(--space-lg)',
      }}>
        <div>
          <h1 style={{
            fontSize: '6rem',
            fontWeight: 800,
            color: 'var(--primary)',
            lineHeight: 1,
            marginBottom: 'var(--space-md)',
          }}>404</h1>
          <h2 style={{
            fontSize: '1.5rem',
            color: 'var(--text)',
            marginBottom: 'var(--space-md)',
          }}>Pagina no encontrada</h2>
          <p style={{
            color: 'var(--text-light)',
            marginBottom: 'var(--space-xl)',
            maxWidth: '400px',
          }}>
            La pagina que buscas no existe o fue movida.
          </p>
          <Link to="/" className="btn btn-primary">Volver al inicio</Link>
        </div>
      </main>
      <Footer minimal />
    </>
  );
}
