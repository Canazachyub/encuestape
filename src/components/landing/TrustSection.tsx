export default function TrustSection() {
  return (
    <section className="section trust-section">
      <div className="container">
        <h2 className="section-title">Transparencia y Metodología</h2>
        <blockquote className="trust-quote">
          <p>Nuestras encuestas utilizan metodología rigurosa con verificación por DNI para garantizar la representatividad de cada muestra. Todos los datos son públicos y verificables en tiempo real.</p>
          <cite>— EncuestaPe</cite>
        </blockquote>
        <div className="trust-features">
          <div className="trust-feature">
            <div className="trust-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A4B8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h4>Voto único por DNI</h4>
            <p>Un solo voto por documento, verificado criptográficamente.</p>
          </div>
          <div className="trust-feature">
            <div className="trust-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A4B8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="10" rx="1"/><rect width="4" height="12" x="15" y="5" rx="1"/></svg>
            </div>
            <h4>Datos abiertos</h4>
            <p>Resultados transparentes y accesibles en tiempo real.</p>
          </div>
          <div className="trust-feature">
            <div className="trust-feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1A4B8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <h4>DNI verificado y hasheado</h4>
            <p>Tu información personal está protegida con cifrado SHA-256.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
