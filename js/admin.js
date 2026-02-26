/* ============================================
   EncuestaPe — Admin Panel Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Check for existing session
  const token = sessionStorage.getItem('admin_token');
  if (token) {
    showDashboard();
  }

  initLogin();
  initSidebar();
  initModal();
  initExport();
});

/* Login */
function initLogin() {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value;
    const pass = document.getElementById('loginPass').value;
    const errorDiv = document.getElementById('loginError');

    try {
      const passHash = await hashSHA256(pass);
      const result = await API.loginAdmin(user, passHash);

      if (result.exito) {
        sessionStorage.setItem('admin_token', result.token);
        showDashboard();
      } else {
        errorDiv.classList.remove('hidden');
        errorDiv.textContent = result.mensaje || 'Credenciales inválidas.';
      }
    } catch (err) {
      errorDiv.classList.remove('hidden');
      errorDiv.textContent = 'Error de conexión.';
    }
  });
}

/* Show dashboard after login */
async function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
  await loadAdminData();
}

/* Load admin data */
async function loadAdminData() {
  try {
    const data = await API.getAdminData();

    // KPIs
    document.getElementById('kpiVotos').textContent = formatNumber(data.estadisticas.total_votos);
    document.getElementById('kpiEncuestas').textContent = data.estadisticas.total_encuestas;
    document.getElementById('kpiActivas').textContent = data.encuestas.filter(e => e.estado === 'activa').length;
    document.getElementById('kpiRegiones').textContent = data.estadisticas.regiones;

    // Recent votes table
    const tbody = document.getElementById('recentVotesTable');
    tbody.innerHTML = '';
    data.votos_recientes.forEach(v => {
      tbody.innerHTML += `
        <tr>
          <td><span class="badge badge-active" style="font-size: 0.7rem;">${v.encuesta_id}</span></td>
          <td>${v.opcion.length > 30 ? v.opcion.substring(0, 30) + '...' : v.opcion}</td>
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">${timeAgo(v.timestamp)}</td>
          <td>${v.region}</td>
        </tr>
      `;
    });

    // Line chart — votes per hour (demo data)
    const hours = Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const votesPerHour = Array.from({length: 24}, () => Math.floor(Math.random() * 50) + 5);
    Charts.createLineChart('chartVotesPerHour', hours, votesPerHour);

    // Encuestas table
    loadEncuestasTable(data.encuestas);

    // Resultados section — populate selector
    const select = document.getElementById('selectEncuesta');
    select.innerHTML = '';
    data.encuestas.forEach(enc => {
      select.innerHTML += `<option value="${enc.id}">${enc.titulo}</option>`;
    });
    select.addEventListener('change', () => loadResultsForEncuesta(select.value));
    if (data.encuestas.length > 0) {
      loadResultsForEncuesta(data.encuestas[0].id);
    }

  } catch (err) {
    console.error('Error loading admin data:', err);
  }
}

/* Encuestas management table */
function loadEncuestasTable(encuestas) {
  const tbody = document.getElementById('encuestasTable');
  tbody.innerHTML = '';

  encuestas.forEach(enc => {
    const badgeClass = enc.estado === 'activa' ? 'badge-active' : enc.estado === 'cerrada' ? 'badge-closed' : 'badge-upcoming';
    const regionName = REGIONES_PERU[enc.region] ? REGIONES_PERU[enc.region].nombre : (enc.region || '—');
    const tipoName = TIPOS_ELECCION[enc.tipo_eleccion] ? TIPOS_ELECCION[enc.tipo_eleccion].nombre : (enc.tipo_eleccion || '—');
    tbody.innerHTML += `
      <tr>
        <td class="mono" style="font-weight: 700; font-size: 0.8rem;">${enc.id}</td>
        <td>${enc.titulo}</td>
        <td style="font-size:0.8rem;">${regionName}</td>
        <td style="font-size:0.8rem;">${tipoName}</td>
        <td><span class="badge ${badgeClass}">${enc.estado}</span></td>
        <td class="mono">${formatNumber(enc.total_votos)}</td>
        <td class="mono">${formatNumber(enc.meta_votos)}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn-outline btn-sm" onclick="viewResults('${enc.id}')">Resultados</button>
            ${enc.estado === 'activa' ? `<button class="btn btn-danger btn-sm" onclick="closeEncuesta('${enc.id}')">Cerrar</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  });
}

/* Load results for admin section */
async function loadResultsForEncuesta(encuestaId) {
  try {
    const data = await API.getResultados(encuestaId);
    const encData = await API.getEncuestas();
    const enc = encData.encuestas.find(e => e.id === encuestaId);

    Charts.createBarChart('chartAdminBar', data.resultados, { barThickness: 30 });
    Charts.createDoughnutChart('chartAdminDoughnut', data.resultados);

    const tbody = document.getElementById('resultsDetailTable');
    tbody.innerHTML = '';
    data.resultados.forEach((r, i) => {
      const candidate = enc ? findCandidateData(enc, r.opcion) : null;
      let avatarHtml = '';
      if (candidate) {
        avatarHtml = candidate.foto_url
          ? `<img src="${candidate.foto_url}" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;" onerror="this.style.display='none'">`
          : `<span style="display:inline-flex;width:24px;height:24px;border-radius:50%;background:var(--color-primary);color:var(--color-accent);align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;vertical-align:middle;margin-right:6px;">${getInitials(r.opcion)}</span>`;
      }
      tbody.innerHTML += `
        <tr>
          <td class="mono">${i + 1}</td>
          <td>${avatarHtml}${r.opcion}</td>
          <td class="mono" style="font-weight: 700;">${formatNumber(r.cantidad)}</td>
          <td class="mono">${r.porcentaje}%</td>
        </tr>
      `;
    });
  } catch (err) {
    console.error('Error loading results:', err);
  }
}

/* Sidebar navigation */
function initSidebar() {
  const links = document.querySelectorAll('.sidebar-link');
  const sections = document.querySelectorAll('.admin-section');
  const title = document.getElementById('adminPageTitle');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(`section${capitalize(section)}`).classList.add('active');

      title.textContent = capitalize(section);

      // Close sidebar on mobile
      document.getElementById('adminSidebar').classList.remove('active');
    });
  });

  // Toggle sidebar on mobile
  document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('active');
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.removeItem('admin_token');
    location.reload();
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* Modal */
let importedCandidates = []; // Stores parsed JSON candidates
let currentOptionsMode = 'manual'; // 'manual' or 'json'

function initModal() {
  const modal = document.getElementById('encuestaModal');
  const btnNew = document.getElementById('btnNewEncuesta');
  const btnClose = document.getElementById('modalClose');
  const btnAddOption = document.getElementById('btnAddOption');
  const form = document.getElementById('encuestaForm');

  btnNew.addEventListener('click', () => {
    modal.classList.add('active');
    document.getElementById('modalTitle').textContent = 'Nueva encuesta';
    form.reset();
    resetJsonImport();
    switchOptionsMode('manual');
  });

  // Smart: tipo_eleccion controls region availability
  const tipoSelect = document.getElementById('formTipoEleccion');
  const regionSelect = document.getElementById('formRegion');
  tipoSelect.addEventListener('change', () => {
    const tipo = tipoSelect.value;
    if (tipo === 'PRESIDENTE' || tipo === 'PARLAMENTO_ANDINO') {
      regionSelect.value = 'NACIONAL';
      regionSelect.disabled = true;
    } else {
      regionSelect.disabled = false;
      if (regionSelect.value === 'NACIONAL' && (tipo === 'DIPUTADOS' || tipo === 'SENADORES')) {
        regionSelect.value = 'LIMA';
      }
    }
  });

  btnClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Mode tabs
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => switchOptionsMode(tab.dataset.mode));
  });

  // Manual mode — add option
  btnAddOption.addEventListener('click', () => {
    const list = document.getElementById('optionsList');
    const count = list.children.length + 1;
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
      <input type="text" class="form-input" placeholder="Opción ${count}" required>
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
    `;
    list.appendChild(row);
  });

  // JSON mode — file upload
  initJsonUpload();

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let options;

    if (currentOptionsMode === 'json') {
      if (importedCandidates.length < 2) {
        alert('El JSON debe tener al menos 2 candidatos.');
        return;
      }
      // Build options from imported candidates
      options = importedCandidates.map(c => ({
        nombre: c.nombre,
        partido: c.partido || '',
        foto_url: c.foto_url || '',
        logo_partido_url: c.logo_partido_url || ''
      }));
      // Add special options
      if (document.getElementById('addBlankVote').checked) {
        options.push('Voto en blanco');
      }
      if (document.getElementById('addUndecided').checked) {
        options.push('Aún no he decidido');
      }
    } else {
      options = Array.from(document.querySelectorAll('#optionsList input')).map(i => i.value).filter(v => v);
      if (options.length < 2) {
        alert('Agrega al menos 2 opciones.');
        return;
      }
    }

    // Create encuesta
    const newId = 'E' + String(DEMO_DATA.encuestas.length + 1).padStart(3, '0');
    const tipoEleccion = document.getElementById('formTipoEleccion').value;
    const region = document.getElementById('formRegion').value;
    let titulo = document.getElementById('formTitulo').value;
    // Auto-generate title if empty
    if (!titulo.trim()) {
      const tipoNombre = TIPOS_ELECCION[tipoEleccion] ? TIPOS_ELECCION[tipoEleccion].nombre : tipoEleccion;
      const regionNombre = REGIONES_PERU[region] ? REGIONES_PERU[region].nombre : region;
      titulo = region === 'NACIONAL'
        ? `${tipoNombre} — Elecciones 2026`
        : `${tipoNombre} por ${regionNombre} — Elecciones 2026`;
    }
    const newEnc = {
      id: newId,
      titulo: titulo,
      descripcion: document.getElementById('formDescripcion').value,
      estado: 'activa',
      opciones: options,
      meta_votos: parseInt(document.getElementById('formMeta').value) || 1000,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      categoria: document.getElementById('formCategoria').value,
      region: region,
      tipo_eleccion: tipoEleccion,
      total_votos: 0
    };

    DEMO_DATA.encuestas.push(newEnc);
    DEMO_DATA.resultados[newId] = {
      encuesta_id: newId,
      total_votos: 0,
      resultados: options.map(o => ({
        opcion: getOptionName(o),
        cantidad: 0,
        porcentaje: '0.0'
      })),
      ultima_actualizacion: new Date().toISOString()
    };
    DEMO_DATA.estadisticas.total_encuestas++;
    saveDemoData();

    closeModal();
    loadAdminData();
  });
}

/* Switch between manual and JSON modes */
function switchOptionsMode(mode) {
  currentOptionsMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  document.getElementById('manualMode').classList.toggle('hidden', mode !== 'manual');
  document.getElementById('jsonMode').classList.toggle('hidden', mode !== 'json');

  // Toggle required on manual inputs
  document.querySelectorAll('#optionsList input').forEach(input => {
    input.required = mode === 'manual';
  });
}

/* JSON file upload */
function initJsonUpload() {
  const zone = document.getElementById('jsonUploadZone');
  const fileInput = document.getElementById('jsonFileInput');
  const btnClear = document.getElementById('btnClearJson');

  // Click to upload
  zone.addEventListener('click', () => fileInput.click());

  // File selected
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processJsonFile(e.target.files[0]);
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) processJsonFile(e.dataTransfer.files[0]);
  });

  // Clear
  btnClear.addEventListener('click', resetJsonImport);
}

/* Process uploaded JSON file */
function processJsonFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let data = JSON.parse(e.target.result);

      // Handle if it's an object with a nested array
      if (!Array.isArray(data)) {
        // Try to find the first array property
        const arrKey = Object.keys(data).find(k => Array.isArray(data[k]));
        if (arrKey) {
          data = data[arrKey];
        } else {
          alert('El JSON debe contener un array de candidatos.');
          return;
        }
      }

      // Validate and normalize candidates (supports multiple JSON formats)
      console.log('JSON import: parsed', data.length, 'items. First keys:', Object.keys(data[0] || {}));
      importedCandidates = data.map(item => {
        // Name: candidato_nombre (diputados), nombre (presidencial), name (english)
        let nombre = item.candidato_nombre || item.nombre || item.name || item.NOMBRE || '';
        // Title case if ALL CAPS
        if (nombre === nombre.toUpperCase() && nombre.length > 2) {
          nombre = nombre.replace(/\b\w+/g, w => w.charAt(0) + w.slice(1).toLowerCase());
        }
        // Build hoja de vida URL: url_hoja_vida (diputados) or url_detalle (presidencial)
        const hojaVidaUrl = item.url_hoja_vida || item.url_detalle || item.hoja_vida || '';

        return {
          nombre: nombre,
          partido: item.partido || item.party || item.PARTIDO || item.organizacion_politica || '',
          foto_url: item.url_foto || item.foto_url || item.photo || item.foto || item.imagen || '',
          logo_partido_url: item.logo_partido_url || item.logo || item.logo_url || '',
          url_hoja_vida: hojaVidaUrl
        };
      }).filter(c => c.nombre);

      if (importedCandidates.length === 0) {
        alert('No se encontraron candidatos válidos. Asegúrate de que cada objeto tenga un campo "nombre" o "candidato_nombre".');
        return;
      }

      // Auto-detect region and tipo from JSON data
      autoDetectFromJson(data);

      renderJsonPreview();
    } catch (err) {
      alert('Error al leer el JSON: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* Auto-detect region and election type from imported JSON */
function autoDetectFromJson(data) {
  const first = data[0];
  if (!first) return;

  const tipoSelect = document.getElementById('formTipoEleccion');
  const regionSelect = document.getElementById('formRegion');

  // Detect tipo from cargo field
  const cargo = (first.cargo || '').toUpperCase();
  if (cargo.includes('DIPUTADO')) {
    tipoSelect.value = 'DIPUTADOS';
    regionSelect.disabled = false;
  } else if (cargo.includes('SENADOR')) {
    tipoSelect.value = 'SENADORES';
    regionSelect.disabled = false;
  } else if (cargo.includes('PRESIDENT')) {
    tipoSelect.value = 'PRESIDENTE';
    regionSelect.value = 'NACIONAL';
    regionSelect.disabled = true;
  } else if (cargo.includes('PARLAMENTO')) {
    tipoSelect.value = 'PARLAMENTO_ANDINO';
    regionSelect.value = 'NACIONAL';
    regionSelect.disabled = true;
  }

  // Detect region from distrito field
  const distrito = (first.distrito || '').toUpperCase();
  let regionName = '';
  if (distrito) {
    // Map distrito names to our region keys
    const distritoMap = {
      'AMAZONAS': 'AMAZONAS', 'ANCASH': 'ANCASH', 'APURIMAC': 'APURIMAC',
      'AREQUIPA': 'AREQUIPA', 'AYACUCHO': 'AYACUCHO', 'CAJAMARCA': 'CAJAMARCA',
      'CALLAO': 'CALLAO', 'CUSCO': 'CUSCO', 'HUANCAVELICA': 'HUANCAVELICA',
      'HUANUCO': 'HUANUCO', 'ICA': 'ICA', 'JUNIN': 'JUNIN',
      'LA LIBERTAD': 'LA_LIBERTAD', 'LAMBAYEQUE': 'LAMBAYEQUE', 'LIMA': 'LIMA',
      'LORETO': 'LORETO', 'MADRE DE DIOS': 'MADRE_DE_DIOS', 'MOQUEGUA': 'MOQUEGUA',
      'PASCO': 'PASCO', 'PIURA': 'PIURA', 'PUNO': 'PUNO',
      'SAN MARTIN': 'SAN_MARTIN', 'TACNA': 'TACNA', 'TUMBES': 'TUMBES',
      'UCAYALI': 'UCAYALI'
    };
    const regionKey = distritoMap[distrito];
    if (regionKey) {
      regionSelect.value = regionKey;
      regionName = REGIONES_PERU[regionKey] ? REGIONES_PERU[regionKey].nombre : distrito;
    }
  }

  // Trigger change event to update smart behavior
  tipoSelect.dispatchEvent(new Event('change'));

  // Auto-fill remaining fields
  const tipoNombre = TIPOS_ELECCION[tipoSelect.value] ? TIPOS_ELECCION[tipoSelect.value].nombre : '';
  const scopeLabel = regionName && regionSelect.value !== 'NACIONAL' ? ` por ${regionName}` : '';

  // Titulo
  const tituloInput = document.getElementById('formTitulo');
  if (!tituloInput.value) {
    tituloInput.value = `${tipoNombre}${scopeLabel} — Elecciones 2026`;
  }

  // Descripcion
  const descInput = document.getElementById('formDescripcion');
  if (!descInput.value) {
    descInput.value = `Encuesta de intencion de voto para ${tipoNombre}${scopeLabel} — Elecciones Generales 2026. ${data.length} candidatos inscritos.`;
  }

  // Categoria -> Elecciones
  const catSelect = document.getElementById('formCategoria');
  if (catSelect) catSelect.value = 'ELECCIONES';

  // Meta de votos
  const metaInput = document.getElementById('formMeta');
  if (metaInput && metaInput.value === '1000') {
    metaInput.value = '5000';
  }
}

/* Render JSON preview list */
function renderJsonPreview() {
  const zone = document.getElementById('jsonUploadZone');
  const preview = document.getElementById('jsonPreview');
  const list = document.getElementById('jsonPreviewList');
  const count = document.getElementById('jsonCandidateCount');

  zone.classList.add('hidden');
  preview.classList.remove('hidden');
  count.textContent = `${importedCandidates.length} candidatos detectados`;

  list.innerHTML = '';
  importedCandidates.forEach((c, i) => {
    const photoHtml = c.foto_url
      ? `<img src="${c.foto_url}" alt="" class="preview-photo" onerror="this.outerHTML='<span class=\\'preview-initials\\'>${getInitials(c.nombre)}</span>'">`
      : `<span class="preview-initials">${getInitials(c.nombre)}</span>`;

    const div = document.createElement('div');
    div.className = 'json-preview-item';
    div.innerHTML = `
      ${photoHtml}
      <div class="preview-info">
        <div class="preview-name">${c.nombre}</div>
        <div class="preview-party">${c.partido}</div>
      </div>
      <button type="button" class="btn-remove-candidate" data-index="${i}">&times;</button>
    `;
    list.appendChild(div);
  });

  // Remove individual candidates
  list.querySelectorAll('.btn-remove-candidate').forEach(btn => {
    btn.addEventListener('click', () => {
      importedCandidates.splice(parseInt(btn.dataset.index), 1);
      if (importedCandidates.length === 0) {
        resetJsonImport();
      } else {
        renderJsonPreview();
      }
    });
  });
}

/* Reset JSON import state */
function resetJsonImport() {
  importedCandidates = [];
  document.getElementById('jsonUploadZone').classList.remove('hidden');
  document.getElementById('jsonPreview').classList.add('hidden');
  document.getElementById('jsonPreviewList').innerHTML = '';
  document.getElementById('jsonFileInput').value = '';
}

function closeModal() {
  document.getElementById('encuestaModal').classList.remove('active');
}

/* View results (switch to results tab) */
function viewResults(encuestaId) {
  document.querySelector('[data-section="resultados"]').click();
  document.getElementById('selectEncuesta').value = encuestaId;
  loadResultsForEncuesta(encuestaId);
}

/* Close encuesta */
function closeEncuesta(id) {
  if (!confirm('¿Cerrar esta encuesta? Ya no aceptará nuevos votos.')) return;

  const enc = DEMO_DATA.encuestas.find(e => e.id === id);
  if (enc) enc.estado = 'cerrada';
  saveDemoData();
  loadAdminData();
}

/* Export CSV */
function initExport() {
  document.getElementById('btnExportCSV').addEventListener('click', () => {
    const encuestaId = document.getElementById('selectEncuesta').value;
    const data = DEMO_DATA.resultados[encuestaId];
    if (!data) return;

    let csv = 'Opción,Votos,Porcentaje\n';
    data.resultados.forEach(r => {
      csv += `"${r.opcion}",${r.cantidad},${r.porcentaje}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultados_${encuestaId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
