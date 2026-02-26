export default function HowToSection() {
  return (
    <section className="section howto-section" id="como-funciona">
      <div className="container">
        <h2 className="section-title">¿Cómo participar?</h2>
        <p className="section-subtitle">En solo 3 pasos sencillos</p>
        <div className="howto-steps">
          <div className="howto-step">
            <div className="howto-number">01</div>
            <div className="howto-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h3>Ingresa tu DNI</h3>
            <p>Registra tu documento de identidad para verificar tu participación única.</p>
          </div>
          <div className="howto-step">
            <div className="howto-number">02</div>
            <div className="howto-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/></svg>
            </div>
            <h3>Emite tu voto</h3>
            <p>Selecciona tu opción de forma segura y confidencial. Un voto por DNI.</p>
          </div>
          <div className="howto-step">
            <div className="howto-number">03</div>
            <div className="howto-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h3>Ve los resultados</h3>
            <p>Los resultados se actualizan al instante en la plataforma.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
