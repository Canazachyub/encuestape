// ============================================
// EncuestaPe.com — Google Apps Script Backend
// ============================================
// NOTA PRODUCCION: En produccion se deberia usar:
// var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
// Se mantiene hardcoded para que funcione sin configuracion extra.

const SPREADSHEET_ID = '1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ';
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// ── Seguridad: reCAPTCHA, Rate Limiting, Sanitizacion ──

function verificarRecaptcha(token) {
  if (!token) return false;
  var secretKey = PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET') || '6LeanH4sAAAAAC2aP0flRdqR4r6XIHZx5hbJ9oMl';
  var response = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'post',
    payload: { secret: secretKey, response: token }
  });
  var result = JSON.parse(response.getContentText());
  return result.success === true;
}

function checkRateLimit() {
  var cache = CacheService.getScriptCache();
  var key = 'rate_' + Math.floor(Date.now() / 60000);
  var count = parseInt(cache.get(key) || '0');
  if (count > 100) return false;
  cache.put(key, String(count + 1), 120);
  return true;
}

function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[<>"'&]/g, function(c) {
    return {'<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','&':'&amp;'}[c];
  });
}

// ── HTTP Handlers ──────────────────────────────────

function doGet(e) {
  const action = e.parameter.action;
  let result;
  switch(action) {
    // Encuestas
    case 'getEncuestas': result = getEncuestas(); break;
    case 'getResultados': result = getResultados(e.parameter.id); break;
    case 'getEstadisticas': result = getEstadisticas(); break;
    case 'getAdminData': result = getAdminData(e.parameter.token); break;
    // Noticias
    case 'getNoticias': result = getNoticias(); break;
    // Denuncias
    case 'getDenuncias': result = getDenuncias(); break;
    // Foro
    case 'getForo': result = getForo(); break;
    // Imagenes
    case 'getImagenes': result = getImagenes(); break;
    // Bulk — single call for all public data
    case 'getAllPublicData': result = getAllPublicData(); break;
    default: result = { error: 'Accion no valida' };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    let result;
    switch(action) {
      // Encuestas
      case 'validarDNI': result = validarDNI(data.encuesta_id, data.dni); break;
      case 'registrarVoto': result = registrarVoto(data); break;
      case 'loginAdmin': result = loginAdmin(data.user, data.pass_hash); break;
      case 'crearEncuesta': result = crearEncuesta(data); break;
      case 'editarEncuesta': result = editarEncuesta(data); break;
      case 'cerrarEncuesta': result = cerrarEncuesta(data); break;
      case 'suscribir': result = suscribirEmail(data.email); break;
      // Noticias
      case 'crearNoticia': result = crearNoticia(data); break;
      case 'editarNoticia': result = editarNoticia(data); break;
      case 'eliminarNoticia': result = eliminarNoticia(data); break;
      // Denuncias
      case 'crearDenuncia': result = crearDenuncia(data); break;
      case 'editarDenuncia': result = editarDenuncia(data); break;
      case 'eliminarDenuncia': result = eliminarDenuncia(data); break;
      case 'apoyarDenuncia': result = apoyarDenuncia(data); break;
      // Foro
      case 'crearForoPregunta': result = crearForoPregunta(data); break;
      case 'editarForoPregunta': result = editarForoPregunta(data); break;
      case 'eliminarForoPregunta': result = eliminarForoPregunta(data); break;
      case 'votarForo': result = votarForo(data); break;
      // Imagenes
      case 'subirImagenDrive': result = subirImagenDrive(data); break;
      case 'guardarImagen': result = guardarImagen(data); break;
      case 'eliminarImagen': result = eliminarImagen(data); break;
      default: result = { error: 'Accion no valida' };
    }
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message || 'Error interno del servidor' })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Utilidades ─────────────────────────────────────

function verificarToken(token) {
  const props = PropertiesService.getScriptProperties();
  const savedToken = props.getProperty('admin_token');
  const tokenTime = parseInt(props.getProperty('admin_token_time') || '0');
  return token === savedToken && (new Date().getTime() - tokenTime) < 4 * 60 * 60 * 1000;
}

function getOrCreateSheet(name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

// ── Consultas (Encuestas) ──────────────────────────

/**
 * OPTIMIZADO: Lee total_votos desde la hoja Conteos (tabla agregada)
 * en vez de contar cada fila de la hoja Votos.
 * Conteos tiene ~500 filas max vs millones en Votos.
 */
function getEncuestas() {
  const sheet = ss.getSheetByName('Encuestas');
  const data = sheet.getDataRange().getValues();

  // Leer totales desde Conteos (rapido: ~500 filas)
  const conteosSheet = ss.getSheetByName('Conteos');
  const totalesPorEncuesta = {};
  if (conteosSheet && conteosSheet.getLastRow() > 1) {
    const conteos = conteosSheet.getDataRange().getValues();
    for (let i = 1; i < conteos.length; i++) {
      const eid = conteos[i][0];
      totalesPorEncuesta[eid] = (totalesPorEncuesta[eid] || 0) + (parseInt(conteos[i][2]) || 0);
    }
  }

  const candidatosSheet = ss.getSheetByName('Candidatos');
  let candidatosData = null;
  const encuestas = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[9] === true || row[9] === 'TRUE') {
      const totalVotos = totalesPorEncuesta[row[0]] || 0;
      let opciones;
      if (row[4] === '@CANDIDATOS') {
        if (!candidatosData && candidatosSheet) {
          candidatosData = candidatosSheet.getDataRange().getValues();
        }
        opciones = [];
        if (candidatosData) {
          for (let c = 1; c < candidatosData.length; c++) {
            if (candidatosData[c][0] === row[0]) {
              const nombre = candidatosData[c][1];
              const partido = candidatosData[c][2];
              if (partido) {
                opciones.push({
                  nombre: nombre, partido: partido,
                  foto_url: candidatosData[c][3] || '',
                  url_hoja_vida: candidatosData[c][4] || '',
                  numero: candidatosData[c][5] || 0
                });
              } else {
                opciones.push(nombre);
              }
            }
          }
        }
      } else {
        opciones = JSON.parse(row[4]);
      }
      encuestas.push({
        id: row[0], titulo: row[1], descripcion: row[2], estado: row[3],
        opciones: opciones, meta_votos: row[5], fecha_inicio: row[6],
        fecha_fin: row[7], categoria: row[8], total_votos: totalVotos,
        region: row[10] || 'NACIONAL', tipo_eleccion: row[11] || 'GENERAL'
      });
    }
  }
  return { encuestas };
}

/**
 * OPTIMIZADO: Lee resultados desde la hoja Conteos (~500 filas)
 * en vez de filtrar millones de filas de la hoja Votos.
 */
function getResultados(encuestaId) {
  const conteosSheet = ss.getSheetByName('Conteos');
  if (!conteosSheet || conteosSheet.getLastRow() <= 1) {
    return { encuesta_id: encuestaId, total_votos: 0, resultados: [], ultima_actualizacion: new Date().toISOString() };
  }
  const conteos = conteosSheet.getDataRange().getValues();
  const resultados = [];
  let total = 0;
  for (let i = 1; i < conteos.length; i++) {
    if (conteos[i][0] === encuestaId) {
      const cantidad = parseInt(conteos[i][2]) || 0;
      resultados.push({ opcion: conteos[i][1], cantidad: cantidad });
      total += cantidad;
    }
  }
  resultados.forEach(r => {
    r.porcentaje = total > 0 ? ((r.cantidad / total) * 100).toFixed(1) : '0.0';
  });
  resultados.sort((a, b) => b.cantidad - a.cantidad);
  return { encuesta_id: encuestaId, total_votos: total, resultados, ultima_actualizacion: new Date().toISOString() };
}

/**
 * OPTIMIZADO: Lee total de votos sumando Conteos en vez de contar filas Votos.
 */
function getEstadisticas() {
  const encuestasSheet = ss.getSheetByName('Encuestas');
  const conteosSheet = ss.getSheetByName('Conteos');
  let totalVotos = 0;
  if (conteosSheet && conteosSheet.getLastRow() > 1) {
    const conteos = conteosSheet.getDataRange().getValues();
    for (let i = 1; i < conteos.length; i++) {
      totalVotos += parseInt(conteos[i][2]) || 0;
    }
  }
  return {
    total_votos: totalVotos,
    total_encuestas: Math.max(0, encuestasSheet.getLastRow() - 1),
    regiones: 24,
    precision: 95.5
  };
}

// ── Votacion ───────────────────────────────────────

/**
 * Valida DNI: primero revisa cache (rapido), luego Sheets si no esta en cache.
 * Cache evita leer millones de filas en cada validacion.
 */
function validarDNI(encuestaId, dni) {
  // Validacion basica de DNI
  if (!dni || typeof dni !== 'string' || !/^\d{8}$/.test(dni)) {
    return { permitido: false, mensaje: 'DNI invalido. Debe tener 8 digitos.' };
  }
  if (/^(\d)\1{7}$/.test(dni)) {
    return { permitido: false, mensaje: 'DNI invalido.' };
  }
  if (parseInt(dni) < 10000) {
    return { permitido: false, mensaje: 'DNI invalido.' };
  }

  // 1. Revisar cache primero (CacheService, 6hrs TTL, instantaneo)
  var cache = CacheService.getScriptCache();
  var cacheKey = 'voto_' + encuestaId + '_' + dni;
  if (cache.get(cacheKey)) {
    return { permitido: false, mensaje: 'Este DNI ya registro su voto en esta encuesta.' };
  }

  // 2. Si no esta en cache, buscar en Sheets (mas lento pero necesario)
  const votosSheet = ss.getSheetByName('Votos');
  const votos = votosSheet.getDataRange().getValues();
  const yaVoto = votos.some(v => v[0] === encuestaId && v[1] === dni);
  if (yaVoto) {
    // Guardar en cache para futuras consultas
    cache.put(cacheKey, '1', 21600); // 6 horas
  }
  return {
    permitido: !yaVoto,
    mensaje: yaVoto ? 'Este DNI ya registro su voto en esta encuesta.' : 'DNI verificado. Puedes proceder a votar.'
  };
}

/**
 * OPTIMIZADO: Registra voto en 3 lugares:
 * 1. Votos (registro completo para auditoria + DNI dedup)
 * 2. Conteos (incrementa contador — lo que se lee para resultados)
 * 3. Cache (marca DNI como usado, evita leer Votos en futuras validaciones)
 *
 * Puedes editar la hoja Conteos directamente en Google Sheets
 * para ajustar cantidades manualmente.
 */
function registrarVoto(data) {
  // Rate limiting
  if (!checkRateLimit()) {
    return { exito: false, mensaje: 'Demasiadas solicitudes. Intente en un momento.' };
  }

  // Validacion de reCAPTCHA server-side (solo si se envia token)
  if (data.recaptcha_token) {
    if (!verificarRecaptcha(data.recaptcha_token)) {
      return { exito: false, mensaje: 'Verificacion CAPTCHA fallida.' };
    }
  }

  // Validacion basica de DNI
  var dni = data.dni;
  if (!dni || typeof dni !== 'string' || !/^\d{8}$/.test(dni)) {
    return { exito: false, mensaje: 'DNI invalido. Debe tener 8 digitos.' };
  }
  if (/^(\d)\1{7}$/.test(dni)) {
    return { exito: false, mensaje: 'DNI invalido.' };
  }
  if (parseInt(dni) < 10000) {
    return { exito: false, mensaje: 'DNI invalido.' };
  }

  // Sanitizar la opcion de voto
  var opcionSanitizada = sanitize(data.opcion);

  // LockService para evitar race conditions
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    // Revisar cache primero
    var cache = CacheService.getScriptCache();
    var cacheKey = 'voto_' + data.encuesta_id + '_' + dni;
    if (cache.get(cacheKey)) {
      return { exito: false, mensaje: 'Voto duplicado detectado.' };
    }

    // Verificar en Votos (necesario para DNIs antiguos no en cache)
    const votosSheet = ss.getSheetByName('Votos');
    const votos = votosSheet.getDataRange().getValues();
    const yaVoto = votos.some(v => v[0] === data.encuesta_id && v[1] === data.dni);
    if (yaVoto) {
      cache.put(cacheKey, '1', 21600);
      return { exito: false, mensaje: 'Voto duplicado detectado.' };
    }

    // Determinar region
    var region = data.region || '';
    if (!region || region === 'No especificada') {
      var encSheet = ss.getSheetByName('Encuestas');
      var encData = encSheet.getDataRange().getValues();
      for (var i = 1; i < encData.length; i++) {
        if (encData[i][0] === data.encuesta_id) {
          region = encData[i][10] || 'NACIONAL';
          break;
        }
      }
      if (!region) region = 'NACIONAL';
    }

    // 1. Guardar en Votos (registro completo para auditoria)
    votosSheet.appendRow([data.encuesta_id, data.dni, opcionSanitizada, new Date().toISOString(), region]);

    // 2. Incrementar en Conteos (lo que se lee para resultados — rapido)
    var conteosSheet = ss.getSheetByName('Conteos');
    var conteos = conteosSheet.getDataRange().getValues();
    var encontrado = false;
    for (var j = 1; j < conteos.length; j++) {
      if (conteos[j][0] === data.encuesta_id && conteos[j][1] === opcionSanitizada) {
        var nuevaCantidad = (parseInt(conteos[j][2]) || 0) + 1;
        conteosSheet.getRange(j + 1, 3).setValue(nuevaCantidad);
        encontrado = true;
        break;
      }
    }
    if (!encontrado) {
      // Primera vez que alguien vota por esta opcion en esta encuesta
      conteosSheet.appendRow([data.encuesta_id, opcionSanitizada, 1]);
    }

    // 3. Guardar en cache (evita leer Votos en futuras validaciones)
    cache.put(cacheKey, '1', 21600); // 6 horas

    // Auto-increase meta_votos cuando se alcanza
    var conteosData = conteosSheet.getDataRange().getValues();
    var totalVotos = 0;
    for (var k = 1; k < conteosData.length; k++) {
      if (conteosData[k][0] === data.encuesta_id) {
        totalVotos += parseInt(conteosData[k][2]) || 0;
      }
    }
    var encSheet2 = ss.getSheetByName('Encuestas');
    var encData2 = encSheet2.getDataRange().getValues();
    for (var m = 1; m < encData2.length; m++) {
      if (encData2[m][0] === data.encuesta_id) {
        var metaActual = Number(encData2[m][5]) || 5000;
        if (totalVotos >= metaActual) {
          encSheet2.getRange(m + 1, 6).setValue(metaActual * 2);
        }
        break;
      }
    }

  } finally {
    lock.releaseLock();
  }

  return { exito: true, mensaje: 'Voto registrado exitosamente.' };
}

// ── Admin ──────────────────────────────────────────

function loginAdmin(user, passHash) {
  const configSheet = ss.getSheetByName('Config');
  const config = configSheet.getDataRange().getValues();
  const configMap = {};
  config.forEach(row => { configMap[row[0]] = row[1]; });
  if (user === configMap['admin_user'] && passHash === configMap['admin_pass_hash']) {
    const token = Utilities.getUuid();
    const props = PropertiesService.getScriptProperties();
    props.setProperty('admin_token', token);
    props.setProperty('admin_token_time', new Date().getTime().toString());
    return { exito: true, token };
  }
  return { exito: false, mensaje: 'Credenciales invalidas.' };
}

function getAdminData(token) {
  if (!verificarToken(token)) return { error: 'No autorizado' };
  return {
    encuestas: getEncuestas().encuestas,
    estadisticas: getEstadisticas(),
    votos_recientes: getVotosRecientes(),
    noticias: getNoticias().noticias,
    denuncias: getDenuncias().denuncias,
    foro: getForo().foro,
    imagenes: getImagenes().imagenes
  };
}

function getVotosRecientes() {
  const sheet = ss.getSheetByName('Votos');
  const data = sheet.getDataRange().getValues();
  return data.slice(-20).reverse().map(v => ({
    encuesta_id: v[0], opcion: v[2], timestamp: v[3], region: v[4]
  }));
}

// ── CRUD Encuestas ─────────────────────────────────

function crearEncuesta(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Encuestas');
  const newId = 'E' + String(sheet.getLastRow()).padStart(2, '0');
  sheet.appendRow([
    newId, data.titulo, data.descripcion, data.estado || 'activa',
    JSON.stringify(data.opciones), data.meta_votos || 1000,
    new Date().toISOString(), data.fecha_fin || '', data.categoria || 'GENERAL', true,
    data.region || 'NACIONAL', data.tipo_eleccion || 'GENERAL'
  ]);
  return { exito: true, id: newId };
}

function editarEncuesta(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Encuestas');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      if (data.titulo) sheet.getRange(i+1, 2).setValue(data.titulo);
      if (data.descripcion) sheet.getRange(i+1, 3).setValue(data.descripcion);
      if (data.estado) sheet.getRange(i+1, 4).setValue(data.estado);
      if (data.opciones) sheet.getRange(i+1, 5).setValue(JSON.stringify(data.opciones));
      if (data.region) sheet.getRange(i+1, 11).setValue(data.region);
      if (data.tipo_eleccion) sheet.getRange(i+1, 12).setValue(data.tipo_eleccion);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Encuesta no encontrada.' };
}

function cerrarEncuesta(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  return editarEncuesta({ id: data.id, estado: 'cerrada', token: data.token });
}

// ── CRUD Noticias ──────────────────────────────────

/**
 * Hoja Noticias: id | titulo | extracto | contenido | categoria | imagen_url | autor | fecha_publicacion | publicado | destacado
 * Columnas:       1     2        3           4           5           6           7          8                  9          10
 */
function getNoticias() {
  const sheet = ss.getSheetByName('Noticias');
  if (!sheet) return { noticias: [] };
  const data = sheet.getDataRange().getValues();
  const noticias = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue; // skip empty rows
    noticias.push({
      id: r[0],
      titulo: r[1] || '',
      extracto: r[2] || '',
      contenido: r[3] || '',
      categoria: r[4] || 'Regional',
      imagen_url: r[5] || '',
      autor: r[6] || 'Redaccion Encuestape',
      fecha_publicacion: r[7] || new Date().toISOString(),
      publicado: r[8] === true || r[8] === 'TRUE',
      destacado: r[9] === true || r[9] === 'TRUE',
    });
  }
  return { noticias };
}

function crearNoticia(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Noticias');
  // Generate ID
  const rows = sheet.getDataRange().getValues();
  let maxNum = 0;
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (id && id.startsWith('N')) {
      const num = parseInt(id.substring(1));
      if (num > maxNum) maxNum = num;
    }
  }
  const newId = 'N' + String(maxNum + 1).padStart(2, '0');
  sheet.appendRow([
    newId,
    data.titulo || '',
    data.extracto || '',
    data.contenido || '',
    data.categoria || 'Regional',
    data.imagen_url || '',
    data.autor || 'Redaccion Encuestape',
    data.fecha_publicacion || new Date().toISOString(),
    data.publicado !== false,
    data.destacado === true,
  ]);
  return { exito: true, id: newId };
}

function editarNoticia(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Noticias');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      const rowNum = i + 1;
      if (data.titulo !== undefined) sheet.getRange(rowNum, 2).setValue(data.titulo);
      if (data.extracto !== undefined) sheet.getRange(rowNum, 3).setValue(data.extracto);
      if (data.contenido !== undefined) sheet.getRange(rowNum, 4).setValue(data.contenido);
      if (data.categoria !== undefined) sheet.getRange(rowNum, 5).setValue(data.categoria);
      if (data.imagen_url !== undefined) sheet.getRange(rowNum, 6).setValue(data.imagen_url);
      if (data.autor !== undefined) sheet.getRange(rowNum, 7).setValue(data.autor);
      if (data.publicado !== undefined) sheet.getRange(rowNum, 9).setValue(data.publicado);
      if (data.destacado !== undefined) sheet.getRange(rowNum, 10).setValue(data.destacado);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Noticia no encontrada.' };
}

function eliminarNoticia(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Noticias');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Noticia no encontrada.' };
}

// ── CRUD Denuncias ─────────────────────────────────

/**
 * Hoja Denuncias: id | titulo | descripcion | categoria | region | fecha | estado | votos_apoyo
 * Columnas:        1     2         3             4          5       6       7         8
 */
function getDenuncias() {
  const sheet = ss.getSheetByName('Denuncias');
  if (!sheet) return { denuncias: [] };
  const data = sheet.getDataRange().getValues();
  const denuncias = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    denuncias.push({
      id: r[0],
      titulo: r[1] || '',
      descripcion: r[2] || '',
      categoria: r[3] || 'Otro',
      region: r[4] || '',
      fecha: r[5] || new Date().toISOString(),
      estado: r[6] || 'pendiente',
      votos_apoyo: parseInt(r[7]) || 0,
    });
  }
  return { denuncias };
}

function crearDenuncia(data) {
  // Publico — no requiere token (denuncia anonima)
  // Rate limiting
  if (!checkRateLimit()) {
    return { exito: false, mensaje: 'Demasiadas solicitudes. Intente en un momento.' };
  }
  const sheet = ss.getSheetByName('Denuncias');
  const rows = sheet.getDataRange().getValues();
  let maxNum = 0;
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (id && id.startsWith('D')) {
      const num = parseInt(id.substring(1));
      if (num > maxNum) maxNum = num;
    }
  }
  const newId = 'D' + String(maxNum + 1).padStart(2, '0');
  sheet.appendRow([
    newId,
    sanitize(data.titulo || ''),
    sanitize(data.descripcion || ''),
    sanitize(data.categoria || 'Otro'),
    sanitize(data.region || ''),
    new Date().toISOString(),
    'pendiente',
    0,
  ]);
  return { exito: true, id: newId };
}

function editarDenuncia(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Denuncias');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      const rowNum = i + 1;
      if (data.estado !== undefined) sheet.getRange(rowNum, 7).setValue(data.estado);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Denuncia no encontrada.' };
}

function eliminarDenuncia(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Denuncias');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Denuncia no encontrada.' };
}

function apoyarDenuncia(data) {
  // Publico — no requiere token
  // Rate limiting
  if (!checkRateLimit()) {
    return { exito: false, mensaje: 'Demasiadas solicitudes. Intente en un momento.' };
  }
  const sheet = ss.getSheetByName('Denuncias');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      const current = parseInt(rows[i][7]) || 0;
      sheet.getRange(i + 1, 8).setValue(current + 1);
      return { exito: true, votos_apoyo: current + 1 };
    }
  }
  return { exito: false, mensaje: 'Denuncia no encontrada.' };
}

// ── CRUD Foro ──────────────────────────────────────

/**
 * Hoja Foro: id | pregunta | descripcion | opciones (JSON) | fecha | activa | categoria | total_votos
 * Columnas:   1      2           3              4              5       6         7           8
 */
function getForo() {
  const sheet = ss.getSheetByName('Foro');
  if (!sheet) return { foro: [] };
  const data = sheet.getDataRange().getValues();
  const foro = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    let opciones = [];
    try { opciones = JSON.parse(r[3]); } catch(e) { opciones = []; }
    foro.push({
      id: r[0],
      pregunta: r[1] || '',
      descripcion: r[2] || '',
      opciones: opciones,
      fecha: r[4] || new Date().toISOString(),
      activa: r[5] === true || r[5] === 'TRUE',
      categoria: r[6] || 'Politica',
      total_votos: parseInt(r[7]) || 0,
    });
  }
  return { foro };
}

function crearForoPregunta(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Foro');
  const rows = sheet.getDataRange().getValues();
  let maxNum = 0;
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (id && id.startsWith('F')) {
      const num = parseInt(id.substring(1));
      if (num > maxNum) maxNum = num;
    }
  }
  const newId = 'F' + String(maxNum + 1).padStart(2, '0');

  // Si se activa esta pregunta, desactivar las demas
  if (data.activa) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][5] === true || rows[i][5] === 'TRUE') {
        sheet.getRange(i + 1, 6).setValue(false);
      }
    }
  }

  const opciones = (data.opciones || []).map(o => {
    if (typeof o === 'string') return { texto: o, votos: 0 };
    return { texto: o.texto || o, votos: o.votos || 0 };
  });

  sheet.appendRow([
    newId,
    data.pregunta || '',
    data.descripcion || '',
    JSON.stringify(opciones),
    new Date().toISOString(),
    data.activa === true,
    data.categoria || 'Politica',
    0,
  ]);
  return { exito: true, id: newId };
}

function editarForoPregunta(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Foro');
  const rows = sheet.getDataRange().getValues();

  // Si se activa esta pregunta, desactivar las demas
  if (data.activa) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] !== data.id && (rows[i][5] === true || rows[i][5] === 'TRUE')) {
        sheet.getRange(i + 1, 6).setValue(false);
      }
    }
  }

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      const rowNum = i + 1;
      if (data.pregunta !== undefined) sheet.getRange(rowNum, 2).setValue(data.pregunta);
      if (data.descripcion !== undefined) sheet.getRange(rowNum, 3).setValue(data.descripcion);
      if (data.opciones !== undefined) {
        const opciones = data.opciones.map(o => {
          if (typeof o === 'string') return { texto: o, votos: 0 };
          return { texto: o.texto || o, votos: o.votos || 0 };
        });
        sheet.getRange(rowNum, 4).setValue(JSON.stringify(opciones));
      }
      if (data.activa !== undefined) sheet.getRange(rowNum, 6).setValue(data.activa);
      if (data.categoria !== undefined) sheet.getRange(rowNum, 7).setValue(data.categoria);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Pregunta no encontrada.' };
}

function eliminarForoPregunta(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Foro');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Pregunta no encontrada.' };
}

function votarForo(data) {
  // Publico — no requiere token
  // Rate limiting
  if (!checkRateLimit()) {
    return { exito: false, mensaje: 'Demasiadas solicitudes. Intente en un momento.' };
  }
  const sheet = ss.getSheetByName('Foro');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      const rowNum = i + 1;
      let opciones = [];
      try { opciones = JSON.parse(rows[i][3]); } catch(e) { return { exito: false, mensaje: 'Error en opciones.' }; }

      const idx = opciones.findIndex(o => o.texto === data.opcion);
      if (idx === -1) return { exito: false, mensaje: 'Opcion no encontrada.' };

      opciones[idx].votos = (opciones[idx].votos || 0) + 1;
      const totalVotos = opciones.reduce((sum, o) => sum + (o.votos || 0), 0);

      sheet.getRange(rowNum, 4).setValue(JSON.stringify(opciones));
      sheet.getRange(rowNum, 8).setValue(totalVotos);

      return { exito: true, opciones, total_votos: totalVotos };
    }
  }
  return { exito: false, mensaje: 'Pregunta no encontrada.' };
}

// ── Imagenes ───────────────────────────────────────

/**
 * Hoja Imagenes: id | nombre | url | fecha | carpeta
 * Columnas:       1     2      3      4       5
 * carpeta = YYYY-MM-DD para organizar por dia
 */
function getImagenes() {
  const sheet = ss.getSheetByName('Imagenes');
  if (!sheet) return { imagenes: [] };
  const data = sheet.getDataRange().getValues();
  const imagenes = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    imagenes.push({
      id: r[0],
      nombre: r[1] || '',
      url: r[2] || '',
      fecha: r[3] || '',
      carpeta: r[4] || '',
    });
  }
  return { imagenes };
}

/**
 * Sube una imagen (base64) a Google Drive y retorna la URL publica.
 * Crea la carpeta EncuestaPe_Imagenes si no existe.
 */
function subirImagenDrive(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  if (!data.imagen_base64) return { error: 'No se envio imagen' };

  // Usar carpeta especifica de Drive
  var FOLDER_ID = '1KiO_7LbOn5q0TPGAkonCL1uS6AE3DNcX';
  var folder;
  try {
    folder = DriveApp.getFolderById(FOLDER_ID);
  } catch (e) {
    // Fallback: crear carpeta si el ID no es accesible
    var folderName = 'EncuestaPe_Imagenes';
    var folders = DriveApp.getFoldersByName(folderName);
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  }

  // Decodificar base64 — soporta data:image/...;base64,XXXX y base64 puro
  var base64 = data.imagen_base64;
  var mimeType = 'image/jpeg';
  if (base64.indexOf(',') > -1) {
    var parts = base64.split(',');
    var mimeMatch = parts[0].match(/data:(.*?);/);
    if (mimeMatch) mimeType = mimeMatch[1];
    base64 = parts[1];
  }

  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, data.nombre || ('img_' + Date.now() + '.jpg'));
  var file = folder.createFile(blob);

  // Hacer publico (cualquiera con el enlace puede ver)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileId = file.getId();
  var url = 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w800';

  // Guardar referencia en hoja Imagenes
  var sheet = ss.getSheetByName('Imagenes');
  var now = new Date();
  var imgId = 'IMG' + now.getTime();
  sheet.appendRow([imgId, data.nombre || blob.getName(), url, now.toISOString(), now.toISOString().split('T')[0]]);

  return { exito: true, id: imgId, url: url, fileId: fileId };
}

function guardarImagen(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Imagenes');
  const now = new Date();
  const carpeta = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const newId = 'IMG' + now.getTime();
  sheet.appendRow([
    newId,
    data.nombre || 'imagen',
    data.url || '',
    now.toISOString(),
    data.carpeta || carpeta,
  ]);
  return { exito: true, id: newId, url: data.url };
}

function eliminarImagen(data) {
  if (!verificarToken(data.token)) return { error: 'No autorizado' };
  const sheet = ss.getSheetByName('Imagenes');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Imagen no encontrada.' };
}

// ── Bulk Public Data (single call) ─────────────────

/**
 * OPTIMIZADO: Lee resultados desde Conteos (~500 filas) en vez de Votos (millones).
 * Una sola lectura de Conteos genera los resultados de TODAS las encuestas.
 */
function getAllPublicData() {
  var encuestas = getEncuestas().encuestas;

  // Leer todos los conteos de una vez (~500 filas)
  var conteosSheet = ss.getSheetByName('Conteos');
  var allConteos = conteosSheet && conteosSheet.getLastRow() > 1 ? conteosSheet.getDataRange().getValues() : [];

  // Agrupar conteos por encuesta
  var conteosPorEncuesta = {};
  for (var i = 1; i < allConteos.length; i++) {
    var eid = allConteos[i][0];
    if (!conteosPorEncuesta[eid]) conteosPorEncuesta[eid] = [];
    conteosPorEncuesta[eid].push({ opcion: allConteos[i][1], cantidad: parseInt(allConteos[i][2]) || 0 });
  }

  // Generar resultados para cada encuesta activa
  var resultados = {};
  var now = new Date().toISOString();
  for (var j = 0; j < encuestas.length; j++) {
    var enc = encuestas[j];
    if (enc.estado !== 'activa') continue;
    var items = conteosPorEncuesta[enc.id] || [];
    var total = 0;
    items.forEach(function(it) { total += it.cantidad; });
    items.forEach(function(it) {
      it.porcentaje = total > 0 ? ((it.cantidad / total) * 100).toFixed(1) : '0.0';
    });
    items.sort(function(a, b) { return b.cantidad - a.cantidad; });
    resultados[enc.id] = { encuesta_id: enc.id, total_votos: total, resultados: items, ultima_actualizacion: now };
  }

  return {
    encuestas: encuestas,
    resultados: resultados,
    noticias: getNoticias().noticias,
    denuncias: getDenuncias().denuncias,
    foro: getForo().foro,
    estadisticas: getEstadisticas(),
  };
}

// ── Newsletter ─────────────────────────────────────

function suscribirEmail(email) {
  // Rate limiting
  if (!checkRateLimit()) {
    return { exito: false, mensaje: 'Demasiadas solicitudes. Intente en un momento.' };
  }
  // Sanitizar email
  var emailSanitizado = sanitize(email);
  ss.getSheetByName('Suscriptores').appendRow([emailSanitizado, new Date().toISOString()]);
  return { exito: true };
}

// ════════════════════════════════════════════════════
// SETUP — Ejecutar UNA VEZ para crear las hojas
// ════════════════════════════════════════════════════

/**
 * Crea todas las hojas con sus encabezados.
 * Ejecutar desde el editor de Apps Script: Ejecutar > setupSheets
 *
 * Hojas:
 * ┌──────────────┬────────────────────────────────────────────────────────────┐
 * │ Encuestas    │ id | titulo | descripcion | estado | opciones (JSON) |    │
 * │              │ meta_votos | fecha_inicio | fecha_fin | categoria | visible│
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Votos        │ encuesta_id | dni | opcion | timestamp | region             │
 * │              │ (registro individual — para auditoria y DNI dedup)          │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Conteos      │ encuesta_id | opcion | cantidad                            │
 * │              │ (TABLA AGREGADA — editable! los resultados se leen de aqui)│
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Config       │ clave | valor                                              │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Suscriptores │ email | fecha_suscripcion                                  │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Noticias     │ id | titulo | extracto | contenido | categoria |           │
 * │              │ imagen_url | autor | fecha_publicacion | publicado |        │
 * │              │ destacado                                                   │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Denuncias    │ id | titulo | descripcion | categoria | region |           │
 * │              │ fecha | estado | votos_apoyo                                │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Foro         │ id | pregunta | descripcion | opciones (JSON) | fecha |    │
 * │              │ activa | categoria | total_votos                            │
 * ├──────────────┼────────────────────────────────────────────────────────────┤
 * │ Imagenes     │ id | nombre | url | fecha | carpeta                        │
 * └──────────────┴────────────────────────────────────────────────────────────┘
 */
function setupSheets() {
  const HEADER_BG = '#0A1E3D';
  const HEADER_FG = '#FFFFFF';

  // ── Encuestas ──
  let sheet = getOrCreateSheet('Encuestas');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'titulo', 'descripcion', 'estado', 'opciones', 'meta_votos', 'fecha_inicio', 'fecha_fin', 'categoria', 'visible', 'region', 'tipo_eleccion']);
    sheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 80); sheet.setColumnWidth(2, 300); sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 80); sheet.setColumnWidth(5, 400); sheet.setColumnWidth(6, 100);
    sheet.setColumnWidth(7, 120); sheet.setColumnWidth(8, 120); sheet.setColumnWidth(9, 100); sheet.setColumnWidth(10, 70);
    sheet.setColumnWidth(11, 120); sheet.setColumnWidth(12, 140);
  }

  // ── Votos ──
  sheet = getOrCreateSheet('Votos');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['encuesta_id', 'dni', 'opcion', 'timestamp', 'region']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 80); sheet.setColumnWidth(2, 300); sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 180); sheet.setColumnWidth(5, 120);
  }

  // ── Config ──
  sheet = getOrCreateSheet('Config');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['clave', 'valor']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.appendRow(['admin_user', 'ENCUESTAPE2026']);
    sheet.appendRow(['admin_pass_hash', '54b46e1820dae2966e9da6c6d0f83238cc287aa38579daab2e0ba1ba86f0bfd8']);
    sheet.appendRow(['site_title', 'EncuestaPe']);
    sheet.appendRow(['site_slogan', 'La voz del Peru en datos']);
    sheet.appendRow(['whatsapp', '+51921647291']);
    sheet.appendRow(['contact_email', 'contacto@encuestape.com']);
    sheet.setColumnWidth(1, 200); sheet.setColumnWidth(2, 400);
  }

  // ── Suscriptores ──
  sheet = getOrCreateSheet('Suscriptores');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['email', 'fecha_suscripcion']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 300); sheet.setColumnWidth(2, 200);
  }

  // ── Noticias ──
  sheet = getOrCreateSheet('Noticias');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'titulo', 'extracto', 'contenido', 'categoria', 'imagen_url', 'autor', 'fecha_publicacion', 'publicado', 'destacado']);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 50); sheet.setColumnWidth(2, 350); sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 500); sheet.setColumnWidth(5, 120); sheet.setColumnWidth(6, 300);
    sheet.setColumnWidth(7, 180); sheet.setColumnWidth(8, 180); sheet.setColumnWidth(9, 80); sheet.setColumnWidth(10, 80);
  }

  // ── Denuncias ──
  sheet = getOrCreateSheet('Denuncias');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'titulo', 'descripcion', 'categoria', 'region', 'fecha', 'estado', 'votos_apoyo']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 50); sheet.setColumnWidth(2, 300); sheet.setColumnWidth(3, 400);
    sheet.setColumnWidth(4, 120); sheet.setColumnWidth(5, 120); sheet.setColumnWidth(6, 180);
    sheet.setColumnWidth(7, 100); sheet.setColumnWidth(8, 100);
  }

  // ── Foro ──
  sheet = getOrCreateSheet('Foro');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'pregunta', 'descripcion', 'opciones', 'fecha', 'activa', 'categoria', 'total_votos']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 50); sheet.setColumnWidth(2, 350); sheet.setColumnWidth(3, 300);
    sheet.setColumnWidth(4, 400); sheet.setColumnWidth(5, 180); sheet.setColumnWidth(6, 70);
    sheet.setColumnWidth(7, 100); sheet.setColumnWidth(8, 100);
  }

  // ── Imagenes ──
  sheet = getOrCreateSheet('Imagenes');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'nombre', 'url', 'fecha', 'carpeta']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 150); sheet.setColumnWidth(2, 200); sheet.setColumnWidth(3, 400);
    sheet.setColumnWidth(4, 180); sheet.setColumnWidth(5, 120);
  }

  // ── Conteos (tabla agregada de votos — LO QUE SE LEE PARA RESULTADOS) ──
  // Puedes editar las cantidades directamente en esta hoja.
  // Cada fila = una opcion de una encuesta con su total de votos.
  sheet = getOrCreateSheet('Conteos');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['encuesta_id', 'opcion', 'cantidad']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 100); sheet.setColumnWidth(2, 400); sheet.setColumnWidth(3, 100);
  }

  // ── Candidatos (opciones de encuestas grandes) ──
  sheet = getOrCreateSheet('Candidatos');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['encuesta_id', 'nombre', 'partido', 'foto_url', 'url_hoja_vida', 'numero']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground(HEADER_BG).setFontColor(HEADER_FG);
    sheet.setColumnWidth(1, 120); sheet.setColumnWidth(2, 280); sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 350); sheet.setColumnWidth(5, 350); sheet.setColumnWidth(6, 70);
  }

  Logger.log('Todas las hojas creadas correctamente.');
  Logger.log('Ejecuta: poblarEncuestaE01() para datos de encuestas.');
  Logger.log('Ejecuta: poblarTodoPortalNoticias() para noticias + denuncias + foro.');
}

// ════════════════════════════════════════════════════
// POBLAR DATOS — Encuesta E01 con 36 candidatos JNE
// ════════════════════════════════════════════════════

function poblarEncuestaE01() {
  const sheet = ss.getSheetByName('Encuestas');
  const data = sheet.getDataRange().getValues();
  if (data.some(row => row[0] === 'E01')) {
    Logger.log('E01 ya existe.');
    return;
  }

  const opciones = [
    { nombre: 'Pablo Alfonso Lopez Chau Nava', partido: 'Ahora Nacion', foto_url: 'https://mpesije.jne.gob.pe/apidocs/ddfa74eb-cae3-401c-a34c-35543ae83c57.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2980' },
    { nombre: 'Ronald Darwin Atencio Sotomayor', partido: 'Alianza Electoral Venceremos', foto_url: 'https://mpesije.jne.gob.pe/apidocs/bac0288d-3b21-45ac-8849-39f9177fb020.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/3025' },
    { nombre: 'Cesar Acuna Peralta', partido: 'Alianza para el Progreso', foto_url: 'https://mpesije.jne.gob.pe/apidocs/d6fe3cac-7061-474b-8551-0aa686a54bad.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/1257' },
    { nombre: 'Jose Daniel Williams Zapata', partido: 'Avanza Pais', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b60c471f-a6bb-4b42-a4b2-02ea38acbb0d.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2173' },
    { nombre: 'Ricardo Pablo Belmont Cassinelli', partido: 'Civico Obras', foto_url: 'https://mpesije.jne.gob.pe/apidocs/78647f15-d5d1-4ed6-8ac6-d599e83eeea3.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2941' },
    { nombre: 'Yonhy Lescano Ancieta', partido: 'Cooperacion Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b9db2b5c-02ff-4265-ae51-db9b1001ad70.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2995' },
    { nombre: 'Charlie Carrasco Salazar', partido: 'Democrata Unido Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/12fa17db-f28f-4330-9123-88549539b538.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2867' },
    { nombre: 'Alex Gonzales Castillo', partido: 'Democrata Verde', foto_url: 'https://mpesije.jne.gob.pe/apidocs/c0ae56bf-21c1-4810-890a-b25c8465bdd9.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2895' },
    { nombre: 'Armando Joaquin Masse Fernandez', partido: 'Democratico Federal', foto_url: 'https://mpesije.jne.gob.pe/apidocs/cb1adeb7-7d2f-430c-ae87-519137d8edfa.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2986' },
    { nombre: 'Alvaro Gonzalo Paz de la Barra Freigeiro', partido: 'Fe en el Peru', foto_url: '', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2898' },
    { nombre: 'Luis Fernando Olivera Vega', partido: 'Frente de la Esperanza', foto_url: 'https://mpesije.jne.gob.pe/apidocs/3e2312e1-af79-4954-abfa-a36669c1a9e9.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2857' },
    { nombre: 'Keiko Sofia Fujimori Higuchi', partido: 'Fuerza Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/251cd1c0-acc7-4338-bd8a-439ccb9238d0.jpeg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/1366' },
    { nombre: 'Fiorella Giannina Molinelli Aristondo', partido: 'Fuerza y Libertad', foto_url: 'https://mpesije.jne.gob.pe/apidocs/1de656b5-7593-4c60-ab7a-83d618a3d80d.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/3024' },
    { nombre: 'Wolfgang Mario Grozo Costa', partido: 'Integridad Democratica', foto_url: 'https://mpesije.jne.gob.pe/apidocs/064360d1-ce49-4abe-939c-f4de8b0130a2.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2985' },
    { nombre: 'Roberto Helbert Sanchez Palomino', partido: 'Juntos por el Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/bb7c7465-9c6e-44eb-ac7d-e6cc7f872a1a.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/1264' },
    { nombre: 'Rafael Jorge Belaunde Llosa', partido: 'Libertad Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/3302e45b-55c8-4979-a60b-2b11097abf1d.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2933' },
    { nombre: 'Carlos Gonsalo Alvarez Loayza', partido: 'Pais para Todos', foto_url: 'https://mpesije.jne.gob.pe/apidocs/2bd18177-d665-413d-9694-747d729d3e39.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2956' },
    { nombre: 'Pitter Enrique Valderrama Pena', partido: 'Partido Aprista Peruano', foto_url: 'https://mpesije.jne.gob.pe/apidocs/d72c4b29-e173-42b8-b40d-bdb6d01a526a.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2930' },
    { nombre: 'Jorge Nieto Montesinos', partido: 'Partido del Buen Gobierno', foto_url: 'https://mpesije.jne.gob.pe/apidocs/9ae56ed5-3d0f-49ff-8bb9-0390bad71816.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2961' },
    { nombre: 'Mesias Antonio Guevara Amasifuen', partido: 'Partido Morado', foto_url: 'https://mpesije.jne.gob.pe/apidocs/1b861ca7-3a5e-48b4-9024-08a92371e33b.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2840' },
    { nombre: 'Herbert Caller Gutierrez', partido: 'Patriotico del Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/6ad6c5ff-0411-4ddd-9cf7-b0623f373fcf.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2869' },
    { nombre: 'Francisco Ernesto Diez-Canseco Tavara', partido: 'Peru Accion', foto_url: 'https://mpesije.jne.gob.pe/apidocs/2d1bf7f2-6e88-4ea9-8ed2-975c1ae5fb92.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2932' },
    { nombre: 'Vladimir Roy Cerron Rojas', partido: 'Peru Libre', foto_url: 'https://mpesije.jne.gob.pe/apidocs/82ee0ff2-2336-4aba-9590-e576f7564315.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2218' },
    { nombre: 'Carlos Ernesto Jaico Carranza', partido: 'Peru Moderno', foto_url: 'https://mpesije.jne.gob.pe/apidocs/7d91e14f-4417-4d61-89ba-3e686dafaa95.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2924' },
    { nombre: 'Mario Enrique Vizcarra Cornejo', partido: 'Peru Primero', foto_url: 'https://mpesije.jne.gob.pe/apidocs/ee7a080e-bc81-4c81-9e5e-9fd95ff459ab.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2925' },
    { nombre: 'Jose Leon Luna Galvez', partido: 'Podemos Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/a669a883-bf8a-417c-9296-c14b943c3943.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2731' },
    { nombre: 'Walter Gilmer Chirinos Purizaga', partido: 'PRIN', foto_url: 'https://mpesije.jne.gob.pe/apidocs/a2d0f631-fe47-4c41-92ba-7ed9f4095520.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2921' },
    { nombre: 'Maria Soledad Perez Tello de Rodriguez', partido: 'Primero la Gente', foto_url: 'https://mpesije.jne.gob.pe/apidocs/073703ca-c427-44f0-94b1-a782223a5e10.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2931' },
    { nombre: 'Paul Davis Jaimes Blanco', partido: 'Progresemos', foto_url: 'https://mpesije.jne.gob.pe/apidocs/929e1a63-335d-4f3a-ba26-f3c7ff136213.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2967' },
    { nombre: 'Napoleon Becerra Garcia', partido: 'PTE Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/bab206cb-b2d5-41ec-bde8-ef8cf3e0a2df.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2939' },
    { nombre: 'Rafael Bernardo Lopez Aliaga Cazorla', partido: 'Renovacion Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b2e00ae2-1e50-4ad3-a103-71fc7e4e8255.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/22' },
    { nombre: 'Antonio Ortiz Villano', partido: 'Salvemos al Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/8e6b9124-2883-4143-8768-105f2ce780eb.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2927' },
    { nombre: 'Alfonso Carlos Espa y Garces-Alvear', partido: 'Sicreo', foto_url: 'https://mpesije.jne.gob.pe/apidocs/85935f77-6c46-4eab-8c7e-2494ffbcece0.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2935' },
    { nombre: 'George Patrick Forsyth Sommer', partido: 'Somos Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b1d60238-c797-4cba-936e-f13de6a34cc7.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/14' },
    { nombre: 'Rosario del Pilar Fernandez Bazan', partido: 'Un Camino Diferente', foto_url: 'https://mpesije.jne.gob.pe/apidocs/ac0b0a59-ead5-4ef1-8ef8-8967e322d6ca.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2998' },
    { nombre: 'Roberto Enrique Chiabra Leon', partido: 'Unidad Nacional', foto_url: 'https://mpesije.jne.gob.pe/apidocs/5c703ce9-ba1e-4490-90bf-61006740166f.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/3023' },
    'Voto en blanco / No precisa',
    'Aun no he decidido'
  ];

  sheet.appendRow([
    'E01', 'Intencion de voto — Elecciones Generales 2026',
    'Por quien votaria si las elecciones presidenciales fueran hoy?',
    'activa', JSON.stringify(opciones), 5000,
    '2026-02-09', '2026-03-09', 'ELECCIONES', true,
    'NACIONAL', 'PRESIDENTE'
  ]);
  Logger.log('Encuesta E01 creada. Ejecuta: generarVotosDemo()');
}

// ════════════════════════════════════════════════════
// GENERAR VOTOS DEMO — 873 votos en 14 dias
// ════════════════════════════════════════════════════

function generarVotosDemo() {
  const sheet = ss.getSheetByName('Votos');
  const existing = sheet.getDataRange().getValues();
  if (existing.some(row => row[0] === 'E01')) {
    Logger.log('Ya existen votos para E01. Ejecuta limpiarVotosE01() primero.');
    return;
  }

  const distribucion = [
    ['Pablo Alfonso Lopez Chau Nava', 140], ['Rafael Bernardo Lopez Aliaga Cazorla', 125],
    ['Keiko Sofia Fujimori Higuchi', 85], ['George Patrick Forsyth Sommer', 55],
    ['Cesar Acuna Peralta', 50], ['Vladimir Roy Cerron Rojas', 40],
    ['Jose Leon Luna Galvez', 35], ['Yonhy Lescano Ancieta', 30],
    ['Aun no he decidido', 28], ['Mario Enrique Vizcarra Cornejo', 25],
    ['Jose Daniel Williams Zapata', 25], ['Carlos Gonsalo Alvarez Loayza', 22],
    ['Voto en blanco / No precisa', 20], ['Jorge Nieto Montesinos', 20],
    ['Alvaro Gonzalo Paz de la Barra Freigeiro', 18], ['Rafael Jorge Belaunde Llosa', 16],
    ['Roberto Enrique Chiabra Leon', 15], ['Fiorella Giannina Molinelli Aristondo', 14],
    ['Ricardo Pablo Belmont Cassinelli', 13], ['Maria Soledad Perez Tello de Rodriguez', 12],
    ['Luis Fernando Olivera Vega', 11], ['Francisco Ernesto Diez-Canseco Tavara', 10],
    ['Roberto Helbert Sanchez Palomino', 9], ['Mesias Antonio Guevara Amasifuen', 9],
    ['Alex Gonzales Castillo', 8], ['Herbert Caller Gutierrez', 7],
    ['Ronald Darwin Atencio Sotomayor', 6], ['Pitter Enrique Valderrama Pena', 5],
    ['Wolfgang Mario Grozo Costa', 4], ['Napoleon Becerra Garcia', 3],
    ['Charlie Carrasco Salazar', 3], ['Armando Joaquin Masse Fernandez', 2],
    ['Walter Gilmer Chirinos Purizaga', 2], ['Alfonso Carlos Espa y Garces-Alvear', 2],
    ['Carlos Ernesto Jaico Carranza', 1], ['Paul Davis Jaimes Blanco', 1],
    ['Antonio Ortiz Villano', 1], ['Rosario del Pilar Fernandez Bazan', 1]
  ];

  const regiones = [
    'Lima', 'Lima', 'Lima', 'Lima', 'Lima',
    'Arequipa', 'Arequipa', 'La Libertad', 'La Libertad',
    'Piura', 'Piura', 'Cusco', 'Junin', 'Puno', 'Lambayeque',
    'Cajamarca', 'Ancash', 'Loreto', 'Callao',
    'Ica', 'San Martin', 'Tacna', 'Tumbes',
    'Ucayali', 'Huanuco', 'Ayacucho', 'Apurimac',
    'Pasco', 'Amazonas', 'Moquegua', 'Huancavelica', 'Madre de Dios'
  ];

  const pool = [];
  distribucion.forEach(([opcion, cantidad]) => {
    for (let i = 0; i < cantidad; i++) pool.push(opcion);
  });
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const ahora = new Date();
  const inicioMs = new Date(ahora.getTime() - 14 * 24 * 60 * 60 * 1000).getTime();
  const votosPerDay = [35, 40, 45, 48, 50, 53, 56, 59, 62, 66, 70, 76, 90, 123];
  const rows = [];
  let votoIndex = 0;

  for (let day = 0; day < 14; day++) {
    const dayBase = inicioMs + day * 24 * 60 * 60 * 1000;
    for (let v = 0; v < votosPerDay[day] && votoIndex < pool.length; v++) {
      const hora = 8 + Math.floor(Math.random() * 15);
      const minuto = Math.floor(Math.random() * 60);
      const segundo = Math.floor(Math.random() * 60);
      const ts = new Date(dayBase + hora * 3600000 + minuto * 60000 + segundo * 1000);
      const dniFake = String(10000000 + Math.floor(Math.random() * 89999999));
      rows.push(['E01', dniFake, pool[votoIndex], ts.toISOString(), regiones[Math.floor(Math.random() * regiones.length)]]);
      votoIndex++;
    }
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
  }

  // Tambien poblar la hoja Conteos con los totales agregados
  var conteosSheet = ss.getSheetByName('Conteos');
  if (conteosSheet) {
    var conteoRows = distribucion.map(function(d) { return ['E01', d[0], d[1]]; });
    if (conteoRows.length > 0) {
      conteosSheet.getRange(conteosSheet.getLastRow() + 1, 1, conteoRows.length, 3).setValues(conteoRows);
    }
  }

  Logger.log(rows.length + ' votos generados para E01 (+ conteos agregados).');
}

// ════════════════════════════════════════════════════
// POBLAR PORTAL DE NOTICIAS
// ════════════════════════════════════════════════════

/**
 * Poblar las 15 noticias demo.
 */
function poblarNoticias() {
  const sheet = ss.getSheetByName('Noticias');
  const existing = sheet.getDataRange().getValues();
  if (existing.some(row => row[0] === 'N01')) {
    Logger.log('Noticias ya existen.');
    return;
  }

  const noticias = [
    ['N01', 'Encuesta revela preocupacion ciudadana por la calidad de los servicios publicos', 'Un estudio aplicado en las principales provincias de Puno muestra que la mayoria de la poblacion considera urgente mejorar la salud, educacion y transporte urbano.', 'Un estudio aplicado en las principales provincias de Puno muestra que la mayoria de la poblacion considera urgente mejorar la salud, educacion y transporte urbano. Los resultados indican que el 68% de los encuestados priorizan la mejora del sistema de salud, seguido por educacion (54%) y transporte (41%). La encuesta fue realizada entre el 10 y 20 de febrero de 2026 con una muestra de 1,200 personas en las provincias de Puno, San Roman, Azangaro y Melgar.', 'Regional', 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-25T10:00:00.000Z', true, true],
    ['N02', 'Simulacro de votacion busca agilizar el proceso electoral en San Roman', 'La oficina descentralizada de procesos electorales desarrollo una jornada de capacitacion masiva para miembros de mesa y personeros.', 'La oficina descentralizada de procesos electorales desarrollo una jornada de capacitacion masiva para miembros de mesa y personeros, con enfasis en el conteo rapido de actas. Mas de 500 voluntarios participaron del simulacro que se realizo en locales de votacion de Juliaca, con el objetivo de reducir el tiempo de procesamiento de resultados el dia de las elecciones generales 2026.', 'Elecciones 2026', 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=450&fit=crop', 'Equipo Electoral Encuestape', '2026-02-24T15:30:00.000Z', true, false],
    ['N03', 'Provincias altiplanicas apuestan por el gas natural y energias limpias', 'Autoridades locales y representantes del sector privado firmaron acuerdos para acelerar la masificacion del gas y diversificar la matriz energetica.', 'Autoridades locales y representantes del sector privado firmaron acuerdos para acelerar la masificacion del gas y diversificar la matriz energetica en la region altiplanica. El convenio contempla la instalacion de redes de distribucion de gas natural en las ciudades de Puno y Juliaca para el primer semestre de 2027, asi como proyectos piloto de energia solar en comunidades rurales de las provincias de Chucuito y El Collao.', 'Economia', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-23T08:00:00.000Z', true, false],
    ['N04', 'ONPE: Ya puedes elegir tu local de votacion para el 2026', 'La Oficina Nacional de Procesos Electorales habilito la plataforma para que los ciudadanos elijan su local de votacion preferido.', 'La ONPE ha puesto a disposicion de los ciudadanos una plataforma digital para seleccionar el local de votacion mas conveniente de cara a las elecciones generales 2026. El plazo para realizar el cambio vence el 15 de marzo.', 'Elecciones 2026', 'https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-22T14:00:00.000Z', true, true],
    ['N05', 'Puno: Hallan el cadaver de trabajador de la Direpro desaparecido en el lago Titicaca', 'El cuerpo fue encontrado por pescadores en la zona de Chucuito tras varios dias de busqueda intensiva.', 'Tras cinco dias de intensa busqueda, pescadores artesanales de la zona de Chucuito hallaron el cuerpo sin vida del trabajador de la Direccion Regional de la Produccion que habia desaparecido cuando realizaba labores de supervision en el lago Titicaca.', 'Regional', 'https://images.unsplash.com/photo-1583309219338-a582f1f9ca6b?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-22T10:30:00.000Z', true, false],
    ['N06', 'Arequipa: Autoridades del Ejecutivo llegan para atender emergencia por intensas lluvias', 'Una comitiva del gobierno central llego a Arequipa para evaluar los danos causados por las lluvias torrenciales.', 'Ministros de Estado y funcionarios del INDECI llegaron a Arequipa para coordinar acciones de respuesta ante la emergencia generada por las intensas lluvias que han dejado mas de 500 familias damnificadas en diversas provincias de la region.', 'Regional', 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&h=450&fit=crop', 'Equipo Regional Encuestape', '2026-02-21T16:00:00.000Z', true, true],
    ['N07', 'ODPE San Roman recibe material para capacitacion electoral masiva', 'La oficina descentralizada recibio kits de capacitacion para preparar a mas de 2,000 miembros de mesa.', 'La Oficina Descentralizada de Procesos Electorales de San Roman recibio material logistico para capacitar a miembros de mesa en los distritos de Juliaca, Cabana, Cabanillas y Caracoto.', 'Elecciones 2026', 'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&h=450&fit=crop', 'Equipo Electoral Encuestape', '2026-02-21T09:00:00.000Z', true, true],
    ['N08', 'Maquinaria pesada causa muerte de joven obrero en obra de pavimentacion en Santa Rosa', 'Un accidente en una obra de pavimentacion dejo un fallecido y genero protestas de los vecinos.', 'Un joven obrero perdio la vida tras ser aplastado por maquinaria pesada durante trabajos de pavimentacion en el distrito de Santa Rosa, provincia de Melgar.', 'Regional', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-20T11:00:00.000Z', true, false],
    ['N09', 'Evidencian filtraciones de agua y equipos inoperativos en hospital de EsSalud', 'Una inspeccion revelo graves deficiencias en la infraestructura del hospital regional de EsSalud.', 'Congresistas y fiscalizadores realizaron una visita inopinada al hospital de EsSalud en Puno, encontrando filtraciones en techos, equipos medicos inoperativos y falta de medicamentos basicos.', 'Regional', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-19T13:00:00.000Z', true, true],
    ['N10', 'Como cambio la opinion publica tras las ultimas encuestas presidenciales?', 'Un repaso a las tendencias electorales y los movimientos en las preferencias de voto a dos meses de las elecciones.', 'A menos de dos meses de las elecciones generales 2026, las encuestas muestran cambios significativos en las preferencias electorales. Renovacion Popular mantiene el liderazgo pero con tendencia a la baja.', 'Opinion', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop', 'Analisis Encuestape', '2026-02-18T10:00:00.000Z', true, true],
    ['N11', 'Accidente en la via Juliaca-Puno deja dos heridos de gravedad', 'Un camion colisiono contra una combi de transporte publico en el kilometro 42 de la carretera.', 'Un accidente de transito ocurrido en la madrugada del lunes dejo dos personas heridas de gravedad en la via Juliaca-Puno. Segun reportes de la PNP, un camion de carga pesada invadio el carril contrario impactando contra una combi de transporte publico. Los heridos fueron trasladados al hospital Carlos Monge Medrano.', 'Policial', 'https://images.unsplash.com/photo-1591768793355-74d04bb6608f?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-24T08:30:00.000Z', true, false],
    ['N12', 'Festival de danzas autoctonas en Puno congrega a miles de visitantes', 'La festividad celebra la riqueza cultural del altiplano con mas de 50 conjuntos folkloricos.', 'Miles de turistas nacionales y extranjeros se dieron cita en Puno para presenciar el gran festival de danzas autoctonas que se realizo en el estadio Enrique Torres Belon. Mas de 50 conjuntos folkloricos participaron mostrando la diversidad cultural del altiplano peruano.', 'Cultural', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-23T14:00:00.000Z', true, false],
    ['N13', 'Cantante puneno triunfa en concurso nacional de musica andina', 'Joven artista de Azangaro se consagra como el mejor interprete de huayno en Lima.', 'El joven cantante puneno originario de Azangaro se consagro como el mejor interprete de huayno en el concurso nacional "Voces del Peru" realizado en el Gran Teatro Nacional de Lima. El artista de 23 anos dedico su triunfo a su tierra natal.', 'Espectaculos', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-22T18:00:00.000Z', true, false],
    ['N14', 'Crisis migratoria en frontera sur preocupa a autoridades peruanas', 'Aumento del flujo migratorio por Desaguadero genera tension en la zona fronteriza con Bolivia.', 'Las autoridades de la region Puno expresaron su preocupacion por el aumento del flujo migratorio irregular a traves del puesto fronterizo de Desaguadero. Se estima que en las ultimas semanas han ingresado al pais mas de 3,000 personas sin documentacion completa.', 'Internacional', 'https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-21T11:00:00.000Z', true, true],
    ['N15', 'Mercados de Juliaca reportan alza en precios de alimentos basicos', 'El precio del arroz, azucar y aceite subio hasta un 15% en las ultimas dos semanas.', 'Los comerciantes del mercado Santa Barbara y Tupac Amaru de Juliaca reportaron un alza significativa en los precios de productos de primera necesidad. El arroz subio de S/ 3.50 a S/ 4.00 el kilo, mientras que el azucar paso de S/ 3.80 a S/ 4.30.', 'Local', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=450&fit=crop', 'Redaccion Encuestape', '2026-02-24T06:00:00.000Z', true, false],
  ];

  if (noticias.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, noticias.length, 10).setValues(noticias);
  }
  Logger.log(noticias.length + ' noticias creadas.');
}

/**
 * Poblar las 3 denuncias demo.
 */
function poblarDenuncias() {
  const sheet = ss.getSheetByName('Denuncias');
  const existing = sheet.getDataRange().getValues();
  if (existing.some(row => row[0] === 'D01')) {
    Logger.log('Denuncias ya existen.');
    return;
  }

  const denuncias = [
    ['D01', 'Obra paralizada en av. Circunvalacion desde hace 6 meses', 'La obra de asfaltado en la avenida Circunvalacion de Juliaca lleva mas de 6 meses paralizada, causando trafico y accidentes. Los vecinos exigimos que se retome la obra o se reponga la via.', 'Infraestructura', 'Juliaca', '2026-02-20T09:00:00.000Z', 'publicada', 47],
    ['D02', 'Falta de agua potable en barrio Bellavista hace 3 semanas', 'Los vecinos del barrio Bellavista en la ciudad de Puno llevamos mas de 3 semanas sin servicio de agua potable. La empresa EMSAPUNO no da respuesta a nuestros reclamos.', 'Servicios', 'Puno', '2026-02-19T15:00:00.000Z', 'publicada', 82],
    ['D03', 'Semaforos malogrados en interseccion peligrosa', 'Los semaforos de la interseccion de la av. El Sol con jr. Moquegua en Juliaca llevan 2 meses sin funcionar. Ya ocurrieron 3 accidentes en el ultimo mes.', 'Seguridad', 'San Roman', '2026-02-22T10:00:00.000Z', 'revisada', 35],
  ];

  if (denuncias.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, denuncias.length, 8).setValues(denuncias);
  }
  Logger.log(denuncias.length + ' denuncias creadas.');
}

/**
 * Poblar las 2 preguntas del foro demo.
 */
function poblarForo() {
  const sheet = ss.getSheetByName('Foro');
  const existing = sheet.getDataRange().getValues();
  if (existing.some(row => row[0] === 'F01')) {
    Logger.log('Foro ya tiene datos.');
    return;
  }

  const foro = [
    ['F01', 'Deberia ser obligatorio el voto electronico en Peru?', 'Con las elecciones 2026 acercandose, se debate si el voto electronico debe implementarse a nivel nacional.', JSON.stringify([{texto:'Si, en todo el pais',votos:156},{texto:'No, prefiero el voto manual',votos:89},{texto:'Solo en ciudades grandes',votos:67},{texto:'Deberia ser opcional',votos:42}]), '2026-02-24T00:00:00.000Z', true, 'Politica', 354],
    ['F02', 'Cual es el principal problema de tu region?', 'Identifica la problematica mas urgente que afecta a tu comunidad.', JSON.stringify([{texto:'Corrupcion',votos:203},{texto:'Inseguridad ciudadana',votos:178},{texto:'Economia y empleo',votos:145},{texto:'Educacion',votos:92},{texto:'Salud',votos:87}]), '2026-02-23T00:00:00.000Z', false, 'Sociedad', 705],
  ];

  if (foro.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, foro.length, 8).setValues(foro);
  }
  Logger.log(foro.length + ' preguntas del foro creadas.');
}

/**
 * Ejecutar todo de golpe: noticias + denuncias + foro.
 */
function poblarTodoPortalNoticias() {
  poblarNoticias();
  poblarDenuncias();
  poblarForo();
  Logger.log('Portal de noticias completo poblado.');
}

// ════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════

/**
 * MIGRAR: Construye la hoja Conteos desde los votos existentes en la hoja Votos.
 * Ejecutar UNA VEZ despues de actualizar el codigo para poblar Conteos
 * con los datos que ya existen. Despues de esto, los nuevos votos
 * actualizan Conteos automaticamente.
 *
 * Puedes ejecutar esto en cualquier momento para "reconstruir" los conteos.
 */
function migrarVotosAConteos() {
  var votosSheet = ss.getSheetByName('Votos');
  var conteosSheet = getOrCreateSheet('Conteos');

  // Limpiar conteos existentes
  if (conteosSheet.getLastRow() > 1) {
    conteosSheet.deleteRows(2, conteosSheet.getLastRow() - 1);
  }
  if (conteosSheet.getLastRow() === 0) {
    conteosSheet.appendRow(['encuesta_id', 'opcion', 'cantidad']);
    conteosSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0A1E3D').setFontColor('#FFFFFF');
  }

  // Leer todos los votos y contar
  var votos = votosSheet.getDataRange().getValues();
  var conteo = {}; // key: "encuestaId|||opcion" -> cantidad
  for (var i = 1; i < votos.length; i++) {
    var key = votos[i][0] + '|||' + votos[i][2];
    conteo[key] = (conteo[key] || 0) + 1;
  }

  // Escribir conteos
  var rows = [];
  for (var key in conteo) {
    var parts = key.split('|||');
    rows.push([parts[0], parts[1], conteo[key]]);
  }

  if (rows.length > 0) {
    conteosSheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }

  Logger.log('Migracion completada: ' + rows.length + ' conteos generados desde ' + (votos.length - 1) + ' votos.');
  Logger.log('Ahora los resultados se leen desde Conteos (rapido) en vez de Votos.');
}

function limpiarConteos() {
  var sheet = ss.getSheetByName('Conteos');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Conteos eliminados.');
}

function limpiarVotosE01() {
  const sheet = ss.getSheetByName('Votos');
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === 'E01') sheet.deleteRow(i + 1);
  }
  Logger.log('Votos de E01 eliminados.');
}

function limpiarNoticias() {
  const sheet = ss.getSheetByName('Noticias');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Noticias eliminadas.');
}

function limpiarDenuncias() {
  const sheet = ss.getSheetByName('Denuncias');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Denuncias eliminadas.');
}

function limpiarForo() {
  const sheet = ss.getSheetByName('Foro');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Foro limpiado.');
}

function limpiarEncuestas() {
  const sheet = ss.getSheetByName('Encuestas');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Encuestas eliminadas.');
}

function limpiarCandidatos() {
  const sheet = ss.getSheetByName('Candidatos');
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Candidatos eliminados.');
}

function limpiarVotos() {
  const sheet = ss.getSheetByName('Votos');
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  Logger.log('Todos los votos eliminados.');
}

// ════════════════════════════════════════════════════
// ACTUALIZAR ESQUEMA — Agregar columnas region y tipo_eleccion
// ════════════════════════════════════════════════════

/**
 * Ejecutar UNA VEZ si ya tenias la hoja Encuestas sin las columnas region/tipo_eleccion.
 * Agrega las columnas 11 y 12 y actualiza E01 si existe.
 */
function actualizarEsquemaEncuestas() {
  const sheet = ss.getSheetByName('Encuestas');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.indexOf('region') === -1) {
    const col = headers.length + 1;
    sheet.getRange(1, col).setValue('region').setFontWeight('bold').setBackground('#0A1E3D').setFontColor('#FFFFFF');
    sheet.setColumnWidth(col, 120);
  }

  if (headers.indexOf('tipo_eleccion') === -1) {
    const col = headers.length + (headers.indexOf('region') === -1 ? 2 : 1);
    sheet.getRange(1, col).setValue('tipo_eleccion').setFontWeight('bold').setBackground('#0A1E3D').setFontColor('#FFFFFF');
    sheet.setColumnWidth(col, 140);
  }

  // Update E01 if it exists and doesn't have region set
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'E01' && !data[i][10]) {
      sheet.getRange(i + 1, 11).setValue('NACIONAL');
      sheet.getRange(i + 1, 12).setValue('PRESIDENTE');
    }
  }

  // Create Candidatos sheet if not exists
  getOrCreateSheet('Candidatos');
  const candSheet = ss.getSheetByName('Candidatos');
  if (candSheet.getLastRow() === 0) {
    candSheet.appendRow(['encuesta_id', 'nombre', 'partido', 'foto_url', 'url_hoja_vida', 'numero']);
    candSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#0A1E3D').setFontColor('#FFFFFF');
    candSheet.setColumnWidth(1, 120); candSheet.setColumnWidth(2, 280); candSheet.setColumnWidth(3, 200);
    candSheet.setColumnWidth(4, 350); candSheet.setColumnWidth(5, 350); candSheet.setColumnWidth(6, 70);
  }

  Logger.log('Esquema actualizado: columnas region, tipo_eleccion + hoja Candidatos.');
}

// ════════════════════════════════════════════════════
// IMPORTAR TODAS LAS ENCUESTAS DESDE GITHUB
// ════════════════════════════════════════════════════

/**
 * Descarga las 59 encuestas del archivo JSON en GitHub y las importa.
 * Incluye encuestas de: Presidente, Municipal, Senadores, Diputados, Parlamento Andino.
 *
 * PASOS:
 * 1. Ejecutar actualizarEsquemaEncuestas() primero (si ya tenias hojas creadas)
 * 2. Ejecutar importarTodasLasEncuestas()
 * 3. Ejecutar generarVotosDemo() para votos de E01
 * 4. Ejecutar poblarTodoPortalNoticias() para noticias, denuncias, foro
 */
function importarTodasLasEncuestas() {
  const GITHUB_URL = 'https://raw.githubusercontent.com/Canazachyub/encuestape/main/apps-script/demo-encuestas.json';

  Logger.log('Descargando datos de GitHub...');
  const response = UrlFetchApp.fetch(GITHUB_URL);
  const jsonData = JSON.parse(response.getContentText());

  const encuestas = jsonData.encuestas;
  const candidatos = jsonData.candidatos;

  Logger.log(encuestas.length + ' encuestas, ' + candidatos.length + ' candidatos');

  // ── Importar encuestas ──
  const encSheet = ss.getSheetByName('Encuestas');
  const existingData = encSheet.getDataRange().getValues();
  const existingIds = new Set();
  for (let i = 1; i < existingData.length; i++) {
    existingIds.add(existingData[i][0]);
  }

  const newRows = [];
  for (const e of encuestas) {
    if (existingIds.has(e.id)) {
      Logger.log(e.id + ' ya existe, omitiendo.');
      continue;
    }
    const opciones = e.opciones === '@CANDIDATOS' ? '@CANDIDATOS' : JSON.stringify(e.opciones);
    newRows.push([
      e.id, e.titulo, e.descripcion, e.estado,
      opciones, e.meta_votos,
      e.fecha_inicio, e.fecha_fin, e.categoria, true,
      e.region || 'NACIONAL', e.tipo_eleccion || 'GENERAL'
    ]);
  }

  if (newRows.length > 0) {
    encSheet.getRange(encSheet.getLastRow() + 1, 1, newRows.length, 12).setValues(newRows);
    Logger.log(newRows.length + ' encuestas importadas.');
  } else {
    Logger.log('No hay encuestas nuevas para importar.');
  }

  // ── Importar candidatos ──
  if (candidatos && candidatos.length > 0) {
    const candSheet = getOrCreateSheet('Candidatos');
    if (candSheet.getLastRow() === 0) {
      candSheet.appendRow(['encuesta_id', 'nombre', 'partido', 'foto_url', 'url_hoja_vida', 'numero']);
      candSheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#0A1E3D').setFontColor('#FFFFFF');
    }

    // Check which encuesta_ids already have candidates
    const existingCands = candSheet.getDataRange().getValues();
    const existingCandIds = new Set();
    for (let i = 1; i < existingCands.length; i++) {
      existingCandIds.add(existingCands[i][0]);
    }

    const newCandRows = [];
    for (const c of candidatos) {
      if (existingCandIds.has(c.encuesta_id)) continue;
      newCandRows.push([
        c.encuesta_id, c.nombre, c.partido || '',
        c.foto_url || '', c.url_hoja_vida || '', c.numero || 0
      ]);
    }

    if (newCandRows.length > 0) {
      // Write in batches of 5000 to avoid memory issues
      const BATCH_SIZE = 5000;
      for (let i = 0; i < newCandRows.length; i += BATCH_SIZE) {
        const batch = newCandRows.slice(i, i + BATCH_SIZE);
        candSheet.getRange(candSheet.getLastRow() + 1, 1, batch.length, 6).setValues(batch);
      }
      Logger.log(newCandRows.length + ' candidatos importados.');
    } else {
      Logger.log('No hay candidatos nuevos para importar.');
    }
  }

  Logger.log('Importacion completa. Total encuestas en hoja: ' + (encSheet.getLastRow() - 1));
}

// ════════════════════════════════════════════════════
// POBLAR TODO — Ejecutar TODAS las funciones de poblacion
// ════════════════════════════════════════════════════

/**
 * Ejecutar todo de golpe:
 * 1. Actualiza esquema (agrega columnas faltantes)
 * 2. Importa las 59 encuestas desde GitHub
 * 3. Genera votos demo para E01
 * 4. Pobla noticias, denuncias, foro
 */
function poblarTodo() {
  actualizarEsquemaEncuestas();
  importarTodasLasEncuestas();
  generarVotosDemo();
  poblarTodoPortalNoticias();
  Logger.log('Todo poblado! La web ahora mostrara todos los datos desde Google Sheets.');
  Logger.log('NOTA: Si ya tenias votos en la hoja Votos, ejecuta migrarVotosAConteos() para generar los conteos.');
}
