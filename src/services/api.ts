import { CONFIG } from '../config/constants';
import { getAdminToken, setAdminToken } from './storage';
import type {
  AdminDataResponse,
  DemoData,
  DenunciaCiudadana,
  EncuestasResponse,
  ForoPregunta,
  ImageItem,
  LoginResponse,
  NewsArticle,
  RegistrarVotoRequest,
  RegistrarVotoResponse,
  ResultadosData,
  Estadisticas,
  SuscribirResponse,
  ValidarDNIResponse,
  VotoReciente,
} from '../types';

// ── Helpers for Google Apps Script API ──

async function apiGet(params: Record<string, string>): Promise<any> {
  const url = `${CONFIG.API_URL}?${new URLSearchParams(params)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      return await res.json();
    } catch (err: any) {
      if (attempt === 1 || err?.message?.includes('Error del servidor')) throw err;
    }
  }
}

async function apiPost(data: Record<string, any>, timeoutMs = 15000): Promise<any> {
  // Use text/plain to avoid CORS preflight with Apps Script
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      return await res.json();
    } catch (err: any) {
      if (attempt === 1 || err?.message?.includes('Error del servidor')) throw err;
    }
  }
}

// ── Simple in-memory cache for GET requests ──
const apiCache: Record<string, { data: any; time: number }> = {};
const CACHE_TTL = 30000; // 30 seconds

async function apiGetCached(params: Record<string, string>): Promise<any> {
  const key = new URLSearchParams(params).toString();
  const cached = apiCache[key];
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.data;
  const data = await apiGet(params);
  apiCache[key] = { data, time: Date.now() };
  return data;
}

// ── API Factory ──

export function createAPI(
  getDemoData: () => DemoData,
  updateDemoData: (updater: (prev: DemoData) => DemoData) => void,
) {
  return {
    // ========== ENCUESTAS (PUBLIC) ==========

    async getEncuestas(): Promise<EncuestasResponse> {
      if (CONFIG.DEMO_MODE) {
        return { encuestas: getDemoData().encuestas };
      }
      return apiGet({ action: 'getEncuestas' });
    },

    async getEncuestasByFilter(region?: string, tipoEleccion?: string): Promise<EncuestasResponse> {
      // Get all encuestas (backend doesn't support server-side filtering)
      const source = CONFIG.DEMO_MODE
        ? getDemoData().encuestas
        : (await apiGetCached({ action: 'getEncuestas' })).encuestas || [];
      let filtered = [...source];
      if (region && region !== 'TODOS') {
        filtered = filtered.filter(e => (e.region || 'NACIONAL') === region);
      }
      if (tipoEleccion && tipoEleccion !== 'TODOS') {
        filtered = filtered.filter(e => (e.tipo_eleccion || 'GENERAL') === tipoEleccion);
      }
      return { encuestas: filtered };
    },

    getRegionStats(): Record<string, number> {
      const stats: Record<string, number> = {};
      getDemoData().encuestas.forEach(e => {
        if (e.estado !== 'activa') return;
        const r = e.region || 'NACIONAL';
        stats[r] = (stats[r] || 0) + 1;
      });
      return stats;
    },

    async getResultados(encuestaId: string): Promise<ResultadosData> {
      const empty = { encuesta_id: encuestaId, resultados: [], total_votos: 0, ultima_actualizacion: new Date().toISOString() };
      if (CONFIG.DEMO_MODE) {
        const contextResults = getDemoData().resultados[encuestaId];
        return contextResults || empty;
      }
      return apiGetCached({ action: 'getResultados', id: encuestaId });
    },

    async getEstadisticas(): Promise<Estadisticas> {
      if (CONFIG.DEMO_MODE) {
        return getDemoData().estadisticas;
      }
      return apiGet({ action: 'getEstadisticas' });
    },

    // ========== VOTING ==========

    async validarDNI(encuestaId: string, dni: string): Promise<ValidarDNIResponse> {
      if (CONFIG.DEMO_MODE) {
        const votes = getDemoData().votosRegistrados[encuestaId] || [];
        const yaVoto = votes.includes(dni);
        return {
          permitido: !yaVoto,
          mensaje: yaVoto
            ? 'Este DNI ya registró su voto en esta encuesta.'
            : 'DNI verificado. Puedes proceder a votar.',
        };
      }
      return apiPost({ action: 'validarDNI', encuesta_id: encuestaId, dni });
    },

    async registrarVoto(data: RegistrarVotoRequest): Promise<RegistrarVotoResponse> {
      if (CONFIG.DEMO_MODE) {
        updateDemoData(prev => {
          const next = JSON.parse(JSON.stringify(prev)) as DemoData;
          if (!next.votosRegistrados[data.encuesta_id]) {
            next.votosRegistrados[data.encuesta_id] = [];
          }
          next.votosRegistrados[data.encuesta_id].push(data.dni);
          const encuesta = next.encuestas.find(e => e.id === data.encuesta_id);
          if (encuesta) {
            encuesta.total_votos++;
            if (encuesta.total_votos >= encuesta.meta_votos) {
              encuesta.meta_votos = encuesta.meta_votos * 2;
            }
          }
          const resultados = next.resultados[data.encuesta_id];
          if (resultados) {
            resultados.total_votos++;
            const opcion = resultados.resultados.find(r => r.opcion === data.opcion);
            if (opcion) {
              opcion.cantidad++;
              resultados.resultados.forEach(r => {
                r.porcentaje = ((r.cantidad / resultados.total_votos) * 100).toFixed(1);
              });
            }
          }
          return next;
        });
        return { exito: true, mensaje: 'Voto registrado exitosamente.' };
      }
      return apiPost({ action: 'registrarVoto', ...data });
    },

    // ========== AUTH ==========

    async loginAdmin(user: string, passHash: string): Promise<LoginResponse> {
      if (CONFIG.DEMO_MODE) {
        if (user === 'admin' && passHash === '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918') {
          const token = 'demo-token-' + Date.now();
          setAdminToken(token);
          return { exito: true, token };
        }
        return { exito: false, mensaje: 'Credenciales inválidas.' };
      }
      const result = await apiPost({ action: 'loginAdmin', user, pass_hash: passHash });
      if (result.exito && result.token) {
        setAdminToken(result.token);
      }
      return result;
    },

    // ========== ADMIN ==========

    async getAdminData(): Promise<AdminDataResponse> {
      if (CONFIG.DEMO_MODE) {
        const demoData = getDemoData();
        const votos_recientes: VotoReciente[] = [
          { encuesta_id: 'E01', opcion: 'Pablo Alfonso Lopez Chau Nava', timestamp: new Date(Date.now() - 120000).toISOString(), region: 'Puno' },
          { encuesta_id: 'E01', opcion: 'Rafael Bernardo Lopez Aliaga Cazorla', timestamp: new Date(Date.now() - 300000).toISOString(), region: 'Lima' },
          { encuesta_id: 'E01', opcion: 'Pablo Alfonso Lopez Chau Nava', timestamp: new Date(Date.now() - 420000).toISOString(), region: 'Arequipa' },
          { encuesta_id: 'E02', opcion: 'Desapruebo totalmente', timestamp: new Date(Date.now() - 480000).toISOString(), region: 'Cajamarca' },
          { encuesta_id: 'E01', opcion: 'Keiko Sofia Fujimori Higuchi', timestamp: new Date(Date.now() - 600000).toISOString(), region: 'Cusco' },
          { encuesta_id: 'E01', opcion: 'Cesar Acuña Peralta', timestamp: new Date(Date.now() - 750000).toISOString(), region: 'La Libertad' },
          { encuesta_id: 'E02', opcion: 'Apruebo parcialmente', timestamp: new Date(Date.now() - 900000).toISOString(), region: 'Tacna' },
        ];
        return {
          encuestas: demoData.encuestas,
          estadisticas: demoData.estadisticas,
          votos_recientes,
        };
      }
      const token = getAdminToken();
      const result = await apiGet({ action: 'getAdminData', token: token || '' });
      // Sync portal data to context
      updateDemoData(prev => ({
        ...prev,
        encuestas: result.encuestas || prev.encuestas,
        noticias: result.noticias || prev.noticias,
        denuncias: result.denuncias || prev.denuncias,
        foro: result.foro || prev.foro,
        imagenes: (result.imagenes || []).map((img: any) => ({
          id: img.id,
          nombre: img.nombre,
          data_url: img.url || '',
          fecha: img.fecha,
          size: 0,
        })),
      }));
      return result;
    },

    // ========== NOTICIAS ==========

    async getNoticias(): Promise<NewsArticle[]> {
      if (CONFIG.DEMO_MODE) return getDemoData().noticias;
      const data = await apiGet({ action: 'getNoticias' });
      return data.noticias || [];
    },

    async crearNoticia(noticia: Partial<NewsArticle>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'crearNoticia', token, ...noticia });
    },

    async editarNoticia(id: string, campos: Partial<NewsArticle>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'editarNoticia', token, id, ...campos });
    },

    async eliminarNoticia(id: string): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'eliminarNoticia', token, id });
    },

    // ========== DENUNCIAS ==========

    async getDenuncias(): Promise<DenunciaCiudadana[]> {
      if (CONFIG.DEMO_MODE) return getDemoData().denuncias;
      const data = await apiGet({ action: 'getDenuncias' });
      return data.denuncias || [];
    },

    async crearDenuncia(denuncia: Partial<DenunciaCiudadana>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      return apiPost({ action: 'crearDenuncia', ...denuncia });
    },

    async editarDenuncia(id: string, campos: Record<string, any>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'editarDenuncia', token, id, ...campos });
    },

    async eliminarDenuncia(id: string): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'eliminarDenuncia', token, id });
    },

    async apoyarDenuncia(id: string): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      return apiPost({ action: 'apoyarDenuncia', id });
    },

    // ========== FORO ==========

    async getForo(): Promise<ForoPregunta[]> {
      if (CONFIG.DEMO_MODE) return getDemoData().foro;
      const data = await apiGet({ action: 'getForo' });
      return data.foro || [];
    },

    async crearForoPregunta(pregunta: Record<string, any>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'crearForoPregunta', token, ...pregunta });
    },

    async editarForoPregunta(id: string, campos: Record<string, any>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'editarForoPregunta', token, id, ...campos });
    },

    async eliminarForoPregunta(id: string): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'eliminarForoPregunta', token, id });
    },

    async votarForo(preguntaId: string, opcionIndex: number): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      return apiPost({ action: 'votarForo', pregunta_id: preguntaId, opcion_index: opcionIndex });
    },

    // ========== IMAGENES ==========

    async getImagenes(): Promise<ImageItem[]> {
      if (CONFIG.DEMO_MODE) return getDemoData().imagenes;
      const data = await apiGet({ action: 'getImagenes' });
      return (data.imagenes || []).map((img: any) => ({
        id: img.id,
        nombre: img.nombre,
        data_url: img.url || '',
        fecha: img.fecha,
        size: 0,
      }));
    },

    async subirImagenDrive(nombre: string, imagenBase64: string): Promise<{ exito: boolean; url: string; id: string }> {
      if (CONFIG.DEMO_MODE) return { exito: false, url: '', id: '' };
      const token = getAdminToken();
      return apiPost({ action: 'subirImagenDrive', token, nombre, imagen_base64: imagenBase64 }, 60000);
    },

    async guardarImagen(imagen: { nombre: string; url: string }): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'guardarImagen', token, ...imagen });
    },

    async eliminarImagen(id: string): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'eliminarImagen', token, id });
    },

    // ========== NEWSLETTER ==========

    async suscribir(email: string): Promise<SuscribirResponse> {
      if (CONFIG.DEMO_MODE) {
        return { exito: true };
      }
      return apiPost({ action: 'suscribir', email });
    },

    // ========== ENCUESTAS ADMIN ==========

    async crearEncuesta(encuesta: Record<string, any>): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'crearEncuesta', token, ...encuesta });
    },

    async cerrarEncuesta(id: string): Promise<any> {
      if (CONFIG.DEMO_MODE) return;
      const token = getAdminToken();
      return apiPost({ action: 'cerrarEncuesta', token, id });
    },

    // ========== DATA SYNC ==========

    async fetchAllPublicData(): Promise<void> {
      if (CONFIG.DEMO_MODE) return;
      try {
        const resp = await apiGet({ action: 'getAllPublicData' });
        updateDemoData(prev => ({
          ...prev,
          encuestas: resp.encuestas || prev.encuestas,
          resultados: resp.resultados || prev.resultados,
          noticias: resp.noticias || prev.noticias,
          denuncias: resp.denuncias || prev.denuncias,
          foro: resp.foro || prev.foro,
          estadisticas: resp.estadisticas?.total_votos != null ? resp.estadisticas : prev.estadisticas,
        }));
        // Pre-seed cache with encuestas and results
        if (resp.encuestas) {
          const key = new URLSearchParams({ action: 'getEncuestas' }).toString();
          apiCache[key] = { data: { encuestas: resp.encuestas }, time: Date.now() };
        }
        if (resp.resultados) {
          for (const [id, res] of Object.entries(resp.resultados)) {
            const key = new URLSearchParams({ action: 'getResultados', id }).toString();
            apiCache[key] = { data: res, time: Date.now() };
          }
        }
      } catch (err) {
        console.error('Error loading data from API:', err);
      }
    },
  };
}

export type APIType = ReturnType<typeof createAPI>;
