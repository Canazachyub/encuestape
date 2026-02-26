import { useState } from 'react';
import { useDemoData } from '../../context/DemoDataContext';

export default function NewsletterSection() {
  const { api } = useDemoData();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.suscribir(email);
      setMessage({ text: '¡Gracias por suscribirte! Te notificaremos con los próximos resultados.', success: true });
      setEmail('');
    } catch {
      setMessage({ text: 'Error al suscribirse. Intenta de nuevo.', success: false });
    }
  };

  return (
    <section className="newsletter-section" id="contacto">
      <div className="container">
        <h2>Recibe los resultados antes que nadie</h2>
        <p>Suscríbete y te enviaremos los resultados de cada encuesta apenas se publiquen.</p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Suscribirme</button>
        </form>
        {message && (
          <p style={{
            marginTop: 'var(--space-md)',
            fontSize: '0.85rem',
            color: message.success ? '#1B8C5A' : '#C0392B',
          }}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}
