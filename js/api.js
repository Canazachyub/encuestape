/* ============================================
   EncuestaPe — API Module
   ============================================ */

const API = {
  /**
   * Fetch encuestas (active + visible)
   */
  async getEncuestas() {
    if (CONFIG.DEMO_MODE) {
      return { encuestas: DEMO_DATA.encuestas };
    }
    const res = await fetch(`${CONFIG.API_URL}?action=getEncuestas`);
    return res.json();
  },

  /**
   * Fetch encuestas filtered by region and/or tipo_eleccion
   */
  async getEncuestasByFilter(region, tipoEleccion) {
    if (CONFIG.DEMO_MODE) {
      let filtered = DEMO_DATA.encuestas;
      if (region && region !== 'TODOS') {
        filtered = filtered.filter(e => (e.region || 'NACIONAL') === region);
      }
      if (tipoEleccion && tipoEleccion !== 'TODOS') {
        filtered = filtered.filter(e => (e.tipo_eleccion || 'GENERAL') === tipoEleccion);
      }
      return { encuestas: filtered };
    }
    const params = new URLSearchParams({ action: 'getEncuestas' });
    if (region) params.set('region', region);
    if (tipoEleccion) params.set('tipo', tipoEleccion);
    const res = await fetch(`${CONFIG.API_URL}?${params}`);
    return res.json();
  },

  /**
   * Get encuesta count per region (for map highlights)
   */
  getRegionStats() {
    const stats = {};
    DEMO_DATA.encuestas.forEach(e => {
      if (e.estado !== 'activa') return;
      const r = e.region || 'NACIONAL';
      stats[r] = (stats[r] || 0) + 1;
    });
    return stats;
  },

  /**
   * Fetch results for a specific encuesta
   */
  async getResultados(encuestaId) {
    if (CONFIG.DEMO_MODE) {
      return DEMO_DATA.resultados[encuestaId] || { resultados: [], total_votos: 0 };
    }
    const res = await fetch(`${CONFIG.API_URL}?action=getResultados&id=${encuestaId}`);
    return res.json();
  },

  /**
   * Fetch global statistics
   */
  async getEstadisticas() {
    if (CONFIG.DEMO_MODE) {
      return DEMO_DATA.estadisticas;
    }
    const res = await fetch(`${CONFIG.API_URL}?action=getEstadisticas`);
    return res.json();
  },

  /**
   * Validate if a DNI hash has already voted in an encuesta
   */
  async validarDNI(encuestaId, dniHash) {
    if (CONFIG.DEMO_MODE) {
      const votes = DEMO_DATA.votosRegistrados[encuestaId] || [];
      const yaVoto = votes.includes(dniHash);
      return {
        permitido: !yaVoto,
        mensaje: yaVoto
          ? 'Este DNI ya registró su voto en esta encuesta.'
          : 'DNI verificado. Puedes proceder a votar.'
      };
    }
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'validarDNI', encuesta_id: encuestaId, dni_hash: dniHash })
    });
    return res.json();
  },

  /**
   * Register a vote
   */
  async registrarVoto(data) {
    if (CONFIG.DEMO_MODE) {
      // Simulate vote registration
      if (!DEMO_DATA.votosRegistrados[data.encuesta_id]) {
        DEMO_DATA.votosRegistrados[data.encuesta_id] = [];
      }
      DEMO_DATA.votosRegistrados[data.encuesta_id].push(data.dni_hash);

      // Update local demo counts
      const encuesta = DEMO_DATA.encuestas.find(e => e.id === data.encuesta_id);
      if (encuesta) encuesta.total_votos++;

      const resultados = DEMO_DATA.resultados[data.encuesta_id];
      if (resultados) {
        resultados.total_votos++;
        const opcion = resultados.resultados.find(r => r.opcion === data.opcion);
        if (opcion) {
          opcion.cantidad++;
          // Recalculate percentages
          resultados.resultados.forEach(r => {
            r.porcentaje = ((r.cantidad / resultados.total_votos) * 100).toFixed(1);
          });
        }
      }

      saveDemoData();
      return { exito: true, mensaje: 'Voto registrado exitosamente.' };
    }
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'registrarVoto', ...data })
    });
    return res.json();
  },

  /**
   * Admin login
   */
  async loginAdmin(user, passHash) {
    if (CONFIG.DEMO_MODE) {
      // Demo: admin / admin
      const demoPassHash = await hashSHA256('admin');
      if (user === 'admin' && passHash === demoPassHash) {
        const token = 'demo-token-' + Date.now();
        sessionStorage.setItem('admin_token', token);
        return { exito: true, token };
      }
      return { exito: false, mensaje: 'Credenciales inválidas.' };
    }
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'loginAdmin', user, pass_hash: passHash })
    });
    return res.json();
  },

  /**
   * Get admin data
   */
  async getAdminData() {
    if (CONFIG.DEMO_MODE) {
      return {
        encuestas: DEMO_DATA.encuestas,
        estadisticas: DEMO_DATA.estadisticas,
        votos_recientes: [
          { encuesta_id: 'E01', opcion: 'Pablo Alfonso Lopez Chau Nava', timestamp: new Date(Date.now() - 120000).toISOString(), region: 'Puno' },
          { encuesta_id: 'E01', opcion: 'Rafael Bernardo Lopez Aliaga Cazorla', timestamp: new Date(Date.now() - 300000).toISOString(), region: 'Lima' },
          { encuesta_id: 'E01', opcion: 'Pablo Alfonso Lopez Chau Nava', timestamp: new Date(Date.now() - 420000).toISOString(), region: 'Arequipa' },
          { encuesta_id: 'E02', opcion: 'Desapruebo totalmente', timestamp: new Date(Date.now() - 480000).toISOString(), region: 'Cajamarca' },
          { encuesta_id: 'E01', opcion: 'Keiko Sofia Fujimori Higuchi', timestamp: new Date(Date.now() - 600000).toISOString(), region: 'Cusco' },
          { encuesta_id: 'E01', opcion: 'Cesar Acuña Peralta', timestamp: new Date(Date.now() - 750000).toISOString(), region: 'La Libertad' },
          { encuesta_id: 'E02', opcion: 'Apruebo parcialmente', timestamp: new Date(Date.now() - 900000).toISOString(), region: 'Tacna' },
        ]
      };
    }
    const token = sessionStorage.getItem('admin_token');
    const res = await fetch(`${CONFIG.API_URL}?action=getAdminData&token=${token}`);
    return res.json();
  },

  /**
   * Subscribe email to newsletter
   */
  async suscribir(email) {
    if (CONFIG.DEMO_MODE) {
      return { exito: true };
    }
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suscribir', email })
    });
    return res.json();
  }
};
