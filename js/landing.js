/* ============================================
   EncuestaPe — Landing Page Logic
   ============================================ */

let currentRegionFilter = null;
let currentTipoFilter = 'TODOS';

document.addEventListener('DOMContentLoaded', () => {
  AOS.init({ duration: 600, once: true, offset: 50 });

  initNavbar();
  initMobileMenu();
  initMapFilters();
  loadEncuestas();
  loadEstadisticas();
  loadResultados();
  initNewsletter();

  // Initialize map
  MapaController.init('peruMapContainer');

  // Auto-refresh every 30 seconds
  setInterval(() => {
    loadResultados();
  }, CONFIG.REFRESH_INTERVAL);
});

/* Navbar scroll effect */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* Mobile menu */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');

  function toggleMenu() {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
  }

  hamburger.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', toggleMenu);
  });
}

/* Map & filter initialization */
function initMapFilters() {
  // Region changed event from MapaController
  document.addEventListener('regionChanged', (e) => {
    currentRegionFilter = e.detail.region;
    loadEncuestas();
  });

  // Tipo pills
  document.querySelectorAll('.tipo-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.tipo-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTipoFilter = pill.dataset.tipo;
      loadEncuestas();
    });
  });

  // Clear filter button
  const clearBtn = document.getElementById('mapaClearFilter');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      MapaController.clearSelection();
      currentRegionFilter = null;
      currentTipoFilter = 'TODOS';
      document.querySelectorAll('.tipo-pill').forEach(p => p.classList.remove('active'));
      document.querySelector('.tipo-pill[data-tipo="TODOS"]').classList.add('active');
      loadEncuestas();
    });
  }
}

/* Load encuestas cards (with filters) */
async function loadEncuestas() {
  const grid = document.getElementById('encuestasGrid');
  try {
    const data = await API.getEncuestasByFilter(
      currentRegionFilter || 'TODOS',
      currentTipoFilter
    );
    grid.innerHTML = '';

    if (data.encuestas.length === 0) {
      const regionName = currentRegionFilter && REGIONES_PERU[currentRegionFilter]
        ? REGIONES_PERU[currentRegionFilter].nombre
        : null;
      grid.innerHTML = `
        <div class="mapa-empty" style="grid-column: 1 / -1;">
          <p>No hay encuestas disponibles${regionName ? ' para <strong>' + regionName + '</strong>' : ''}.</p>
          <p style="font-size: 0.85rem;">Pronto se agregaran nuevas encuestas.</p>
        </div>
      `;
      return;
    }

    data.encuestas.forEach(enc => {
      const progress = enc.meta_votos > 0
        ? Math.min(100, Math.round((enc.total_votos / enc.meta_votos) * 100))
        : 0;

      const isActive = enc.estado === 'activa';
      const badgeClass = isActive ? 'badge-active' : enc.estado === 'cerrada' ? 'badge-closed' : 'badge-upcoming';
      const badgeText = isActive ? 'Activa' : enc.estado === 'cerrada' ? 'Cerrada' : 'Próxima';
      const btnText = isActive ? 'Participar' : 'Ver resultados';
      const btnHref = isActive ? `votar/?id=${enc.id}` : `resultados/?id=${enc.id}`;

      // Region badge
      const regionName = REGIONES_PERU[enc.region] ? REGIONES_PERU[enc.region].nombre : '';
      const tipoName = TIPOS_ELECCION[enc.tipo_eleccion] ? TIPOS_ELECCION[enc.tipo_eleccion].nombre : '';
      const regionBadge = regionName && enc.region !== 'NACIONAL'
        ? `<span class="card-region-badge">${regionName}</span>`
        : '';

      grid.innerHTML += `
        <div class="card encuesta-card" data-aos="fade-up">
          <div class="card-header">
            <span class="card-category">${tipoName || enc.categoria}${regionBadge}</span>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
          <h3 class="card-title">${enc.titulo}</h3>
          <p class="card-desc">${enc.descripcion}</p>
          <div class="card-progress">
            <div class="card-progress-info">
              <span><span class="mono">${formatNumber(enc.total_votos)}</span> / ${formatNumber(enc.meta_votos)}</span>
              <span class="mono">${progress}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${progress}%"></div>
            </div>
          </div>
          <div class="card-footer">
            <a href="${btnHref}" class="btn ${isActive ? 'btn-primary' : 'btn-outline'} btn-sm">${btnText} →</a>
          </div>
        </div>
      `;
    });
  } catch (err) {
    grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Error al cargar las encuestas.</p>';
  }
}

/* Load statistics counters */
async function loadEstadisticas() {
  try {
    const stats = await API.getEstadisticas();

    // Update hero highlight
    const firstActive = DEMO_DATA.encuestas.find(e => e.estado === 'activa');
    if (firstActive) {
      document.getElementById('heroEncuestaTitle').textContent = firstActive.titulo;
      document.getElementById('heroVoteCount').textContent = formatNumber(firstActive.total_votos);
    }

    // Animate counters when they enter viewport
    observeElements('.stat-number', (el) => {
      const target = parseFloat(el.dataset.target);
      animateCounter(el, target);
    });
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

/* Load results preview */
async function loadResultados() {
  const container = document.getElementById('resultsContainer');
  try {
    // Show results for first active encuesta
    const encuestas = (await API.getEncuestas()).encuestas;
    const active = encuestas.find(e => e.estado === 'activa');
    if (!active) return;

    document.getElementById('resultsTitle').textContent = active.titulo;

    const data = await API.getResultados(active.id);
    container.innerHTML = '';

    const colors = getChartColors(data.resultados.length);
    data.resultados.forEach((r, i) => {
      const color = colors[i];
      const candidate = findCandidateData(active, r.opcion);
      let avatarHtml = '';
      if (candidate) {
        avatarHtml = candidate.foto_url
          ? `<img src="${candidate.foto_url}" alt="" class="result-bar-avatar" onerror="this.outerHTML='<span class=\\'result-bar-initials\\'>${getInitials(r.opcion)}</span>'">`
          : `<span class="result-bar-initials">${getInitials(r.opcion)}</span>`;
      }

      const hvUrl = candidate ? candidate.url_hoja_vida : null;
      const hvLink = hvUrl
        ? `<a href="${hvUrl}" target="_blank" rel="noopener" class="result-bar-hv" title="Ver hoja de vida / fórmula presidencial" onclick="event.stopPropagation();">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
           </a>`
        : '';

      container.innerHTML += `
        <div class="result-bar-item">
          <div class="result-bar-label">
            <span class="result-bar-name">${avatarHtml}${r.opcion}${hvLink}</span>
            <span>
              <span class="result-bar-value">${r.porcentaje}%</span>
              <span class="result-bar-count">(${formatNumber(r.cantidad)} votos)</span>
            </span>
          </div>
          <div class="result-bar-track">
            <div class="result-bar-fill" style="width: 0%; background: ${color};" data-width="${r.porcentaje}%"></div>
          </div>
        </div>
      `;
    });

    document.getElementById('resultsTotalVotos').textContent = formatNumber(data.total_votos);
    document.getElementById('resultsLastUpdate').textContent = timeAgo(data.ultima_actualizacion);

    // Animate bars on scroll
    observeElements('.result-bar-fill', (el) => {
      setTimeout(() => {
        el.style.width = el.dataset.width;
      }, 100);
    });

  } catch (err) {
    console.error('Error loading results:', err);
  }
}

/* Newsletter form */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const msg = document.getElementById('newsletterMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletterEmail').value;

    try {
      await API.suscribir(email);
      msg.textContent = '¡Gracias por suscribirte! Te notificaremos con los próximos resultados.';
      msg.style.display = 'block';
      msg.style.color = '#1B8C5A';
      form.reset();
    } catch (err) {
      msg.textContent = 'Error al suscribirse. Intenta de nuevo.';
      msg.style.display = 'block';
      msg.style.color = '#C0392B';
    }
  });
}
