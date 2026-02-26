/* ============================================
   EncuestaPe — Voting Page Logic
   ============================================ */

let currentEncuesta = null;
let currentDNIHash = null;
let selectedOption = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const encuestaId = params.get('id') || 'E01';

  loadEncuesta(encuestaId);
  initDNIInput();
  initButtons();
});

/* Load encuesta data */
async function loadEncuesta(id) {
  try {
    const data = await API.getEncuestas();
    currentEncuesta = data.encuestas.find(e => e.id === id);

    if (!currentEncuesta) {
      document.querySelector('.votar-content').innerHTML = `
        <div class="votar-card" style="text-align: center; padding: 48px;">
          <h2 class="votar-card-title">Encuesta no encontrada</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">La encuesta solicitada no existe o no está disponible.</p>
          <a href="../" class="btn btn-primary">Volver al inicio</a>
        </div>
      `;
      return;
    }

    if (currentEncuesta.estado !== 'activa') {
      document.querySelector('.votar-content').innerHTML = `
        <div class="votar-card" style="text-align: center; padding: 48px;">
          <h2 class="votar-card-title">Encuesta cerrada</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">Esta encuesta ya no está aceptando votos.</p>
          <a href="../resultados/?id=${id}" class="btn btn-primary">Ver resultados</a>
        </div>
      `;
      return;
    }
  } catch (err) {
    console.error('Error loading encuesta:', err);
  }
}

/* DNI input handling */
function initDNIInput() {
  const input = document.getElementById('dniInput');
  const feedback = document.getElementById('dniFeedback');
  const btn = document.getElementById('btnVerifyDNI');

  input.addEventListener('input', (e) => {
    // Only allow numbers
    e.target.value = e.target.value.replace(/\D/g, '');
    const val = e.target.value;

    if (val.length === CONFIG.DNI_LENGTH) {
      input.classList.add('valid');
      input.classList.remove('error');
      feedback.className = 'dni-feedback valid';
      feedback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg> 8 dígitos detectados';
      btn.disabled = false;
    } else if (val.length > 0) {
      input.classList.remove('valid');
      input.classList.remove('error');
      feedback.className = 'dni-feedback';
      feedback.textContent = `${val.length}/8 dígitos`;
      btn.disabled = true;
    } else {
      input.classList.remove('valid', 'error');
      feedback.textContent = '';
      btn.disabled = true;
    }
  });
}

/* Button handlers */
function initButtons() {
  // Step 1: Verify DNI
  document.getElementById('btnVerifyDNI').addEventListener('click', verifyDNI);

  // Step 2: Back to step 1
  document.getElementById('btnBackToStep1').addEventListener('click', () => goToStep(1));

  // Step 2: Go to confirm
  document.getElementById('btnToConfirm').addEventListener('click', () => {
    if (selectedOption) {
      showConfirmation();
      goToStep(3);
    }
  });

  // Step 3: Back to step 2
  document.getElementById('btnBackToStep2').addEventListener('click', () => goToStep(2));

  // Step 3: Confirm vote
  document.getElementById('btnConfirmVote').addEventListener('click', confirmVote);
}

/* Verify DNI */
async function verifyDNI() {
  const input = document.getElementById('dniInput');
  const dni = input.value;
  const btn = document.getElementById('btnVerifyDNI');

  if (!validateDNI(dni)) return;

  btn.disabled = true;
  btn.textContent = 'Verificando...';

  try {
    currentDNIHash = await hashSHA256(dni);
    const result = await API.validarDNI(currentEncuesta.id, currentDNIHash);

    if (result.permitido) {
      showVoteOptions();
      goToStep(2);
    } else {
      // Already voted
      document.querySelector('#step1 .form-group').classList.add('hidden');
      document.querySelector('#step1 .votar-buttons').classList.add('hidden');
      document.querySelector('#step1 .security-note').classList.add('hidden');
      document.querySelector('#step1 .votar-card-title').classList.add('hidden');
      document.querySelector('#step1 .votar-card-desc').classList.add('hidden');
      document.getElementById('alreadyVoted').classList.remove('hidden');
    }
  } catch (err) {
    const feedback = document.getElementById('dniFeedback');
    feedback.className = 'dni-feedback error';
    feedback.textContent = 'Error al verificar. Intenta de nuevo.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verificar DNI →';
  }
}

/* Show vote options */
function showVoteOptions() {
  if (!currentEncuesta) return;

  document.getElementById('voteEncuestaTitle').textContent = currentEncuesta.titulo;
  document.getElementById('voteEncuestaDesc').textContent = currentEncuesta.descripcion;

  const container = document.getElementById('voteOptions');
  container.innerHTML = '';

  const hasCandidates = currentEncuesta.opciones.some(o => typeof o === 'object');
  const isLargeList = currentEncuesta.opciones.length > 8;

  // Add search bar for large lists
  if (isLargeList) {
    const searchWrap = document.createElement('div');
    searchWrap.className = 'vote-search-wrap';
    searchWrap.innerHTML = `
      <input type="text" class="vote-search" id="voteSearch" placeholder="Buscar candidato o partido..." autocomplete="off">
    `;
    container.before(searchWrap);

    searchWrap.querySelector('#voteSearch').addEventListener('input', debounce((e) => {
      const q = e.target.value.toLowerCase();
      container.querySelectorAll('.vote-option').forEach(opt => {
        const text = opt.textContent.toLowerCase();
        opt.style.display = text.includes(q) ? '' : 'none';
      });
    }, 200));
  }

  currentEncuesta.opciones.forEach((opcion, i) => {
    const isObj = typeof opcion === 'object';
    const name = isObj ? opcion.nombre : opcion;
    const div = document.createElement('div');
    div.className = 'vote-option' + (isObj ? ' candidate-option' : '');
    div.dataset.option = name;

    if (isObj) {
      const photoHtml = opcion.foto_url
        ? `<img src="${opcion.foto_url}" alt="" class="candidate-photo" onerror="this.outerHTML='<span class=\\'candidate-initials\\'>${getInitials(name)}</span>'">`
        : `<span class="candidate-initials">${getInitials(name)}</span>`;
      const logoHtml = opcion.logo_partido_url
        ? `<img src="${opcion.logo_partido_url}" alt="" class="candidate-party-logo" onerror="this.style.display='none'">`
        : '';
      const hojaVidaHtml = opcion.url_hoja_vida
        ? `<a href="${opcion.url_hoja_vida}" target="_blank" class="candidate-hv-link" onclick="event.stopPropagation();" title="Ver hoja de vida">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Hoja de vida
          </a>`
        : '';
      div.innerHTML = `
        <input type="radio" name="voto" id="opt${i}" value="${name}">
        <span class="radio-custom"></span>
        ${photoHtml}
        <div class="candidate-info">
          <span class="candidate-name">${name}</span>
          <span class="candidate-party">${logoHtml}${opcion.partido || ''}${hojaVidaHtml}</span>
        </div>
      `;
    } else {
      div.innerHTML = `
        <input type="radio" name="voto" id="opt${i}" value="${name}">
        <span class="radio-custom"></span>
        <label class="vote-option-text" for="opt${i}">${name}</label>
      `;
    }

    div.addEventListener('click', () => {
      document.querySelectorAll('.vote-option').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      div.querySelector('input').checked = true;
      selectedOption = name;
      document.getElementById('btnToConfirm').disabled = false;
    });

    container.appendChild(div);
  });

  // Scroll container for large lists
  if (isLargeList) {
    container.classList.add('vote-options-scroll');
  }
}

/* Show confirmation */
function showConfirmation() {
  document.getElementById('confirmEncuesta').textContent = currentEncuesta.titulo;
  document.getElementById('confirmVoto').textContent = selectedOption;
}

/* Confirm and register vote */
async function confirmVote() {
  const btn = document.getElementById('btnConfirmVote');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    const result = await API.registrarVoto({
      encuesta_id: currentEncuesta.id,
      dni_hash: currentDNIHash,
      opcion: selectedOption,
      region: (currentEncuesta && currentEncuesta.region) || 'NACIONAL'
    });

    if (result.exito) {
      await showThankYou();
      goToStep(4);
    } else {
      alert(result.mensaje || 'Error al registrar el voto.');
      btn.disabled = false;
      btn.textContent = '✓ Confirmar voto';
    }
  } catch (err) {
    alert('Error de conexión. Intenta de nuevo.');
    btn.disabled = false;
    btn.textContent = '✓ Confirmar voto';
  }
}

/* Show thank you with results */
async function showThankYou() {
  try {
    const data = await API.getResultados(currentEncuesta.id);
    const bars = document.getElementById('thankyouBars');
    bars.innerHTML = '';

    const colors = getChartColors(data.resultados.length);

    data.resultados.forEach((r, i) => {
      const candidate = findCandidateData(currentEncuesta, r.opcion);
      let avatarHtml = '';
      if (candidate) {
        avatarHtml = candidate.foto_url
          ? `<img src="${candidate.foto_url}" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;" onerror="this.style.display='none'">`
          : `<span style="display:inline-flex;width:24px;height:24px;border-radius:50%;background:var(--color-primary);color:var(--color-accent);align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;vertical-align:middle;margin-right:6px;">${getInitials(r.opcion)}</span>`;
      }
      bars.innerHTML += `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem;">
            <span>${avatarHtml}${r.opcion}</span>
            <span class="mono" style="font-weight: 700;">${r.porcentaje}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: ${r.porcentaje}%; background: ${colors[i]};"></div>
          </div>
        </div>
      `;
    });

    document.getElementById('thankyouTotal').textContent = formatNumber(data.total_votos);

    // Share links
    const text = `Participé en la encuesta "${currentEncuesta.titulo}" en EncuestaPe.com. ¡Tu opinión también cuenta!`;
    const url = window.location.origin;
    document.getElementById('shareWhatsapp').href = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
    document.getElementById('shareFacebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  } catch (err) {
    console.error('Error loading results:', err);
  }
}

/* Step navigation */
function goToStep(step) {
  // Hide all steps
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step${i}`).classList.toggle('hidden', i !== step);
  }

  // Update progress indicators
  for (let i = 1; i <= 3; i++) {
    const indicator = document.getElementById(`step${i}Indicator`);
    indicator.classList.remove('active', 'completed');

    if (i < step) {
      indicator.classList.add('completed');
    } else if (i === step) {
      indicator.classList.add('active');
    }
  }

  // Update connectors
  const conn1 = document.getElementById('conn1');
  const conn2 = document.getElementById('conn2');
  conn1.classList.toggle('active', step >= 2);
  conn2.classList.toggle('active', step >= 3);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
