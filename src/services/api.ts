import { CONFIG } from '../config/constants';
import { hashSHA256 } from '../utils/hash';
import { getAdminToken, setAdminToken } from './storage';
import type {
  AdminDataResponse,
  DemoData,
  EncuestasResponse,
  LoginResponse,
  RegistrarVotoRequest,
  RegistrarVotoResponse,
  ResultadosData,
  Estadisticas,
  SuscribirResponse,
  ValidarDNIResponse,
  VotoReciente,
} from '../types';

// The API object receives demoData and updater from the context
// so it can mutate state through React's state management
export function createAPI(
  getDemoData: () => DemoData,
  updateDemoData: (updater: (prev: DemoData) => DemoData) => void,
) {
  return {
    async getEncuestas(): Promise<EncuestasResponse> {
      if (CONFIG.DEMO_MODE) {
        return { encuestas: getDemoData().encuestas };
      }
      const res = await fetch(`${CONFIG.API_URL}?action=getEncuestas`);
      return res.json();
    },

    async getEncuestasByFilter(region?: string, tipoEleccion?: string): Promise<EncuestasResponse> {
      if (CONFIG.DEMO_MODE) {
        let filtered = getDemoData().encuestas;
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
      if (CONFIG.DEMO_MODE) {
        return getDemoData().resultados[encuestaId] || { encuesta_id: encuestaId, resultados: [], total_votos: 0, ultima_actualizacion: new Date().toISOString() };
      }
      const res = await fetch(`${CONFIG.API_URL}?action=getResultados&id=${encuestaId}`);
      return res.json();
    },

    async getEstadisticas(): Promise<Estadisticas> {
      if (CONFIG.DEMO_MODE) {
        return getDemoData().estadisticas;
      }
      const res = await fetch(`${CONFIG.API_URL}?action=getEstadisticas`);
      return res.json();
    },

    async validarDNI(encuestaId: string, dniHash: string): Promise<ValidarDNIResponse> {
      if (CONFIG.DEMO_MODE) {
        const votes = getDemoData().votosRegistrados[encuestaId] || [];
        const yaVoto = votes.includes(dniHash);
        return {
          permitido: !yaVoto,
          mensaje: yaVoto
            ? 'Este DNI ya registró su voto en esta encuesta.'
            : 'DNI verificado. Puedes proceder a votar.',
        };
      }
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validarDNI', encuesta_id: encuestaId, dni_hash: dniHash }),
      });
      return res.json();
    },

    async registrarVoto(data: RegistrarVotoRequest): Promise<RegistrarVotoResponse> {
      if (CONFIG.DEMO_MODE) {
        updateDemoData(prev => {
          const next = JSON.parse(JSON.stringify(prev)) as DemoData;

          if (!next.votosRegistrados[data.encuesta_id]) {
            next.votosRegistrados[data.encuesta_id] = [];
          }
          next.votosRegistrados[data.encuesta_id].push(data.dni_hash);

          const encuesta = next.encuestas.find(e => e.id === data.encuesta_id);
          if (encuesta) encuesta.total_votos++;

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
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registrarVoto', ...data }),
      });
      return res.json();
    },

    async loginAdmin(user: string, passHash: string): Promise<LoginResponse> {
      if (CONFIG.DEMO_MODE) {
        const demoPassHash = await hashSHA256('admin');
        if (user === 'admin' && passHash === demoPassHash) {
          const token = 'demo-token-' + Date.now();
          setAdminToken(token);
          return { exito: true, token };
        }
        return { exito: false, mensaje: 'Credenciales inválidas.' };
      }
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'loginAdmin', user, pass_hash: passHash }),
      });
      return res.json();
    },

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
      const res = await fetch(`${CONFIG.API_URL}?action=getAdminData&token=${token}`);
      return res.json();
    },

    async suscribir(email: string): Promise<SuscribirResponse> {
      if (CONFIG.DEMO_MODE) {
        return { exito: true };
      }
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suscribir', email }),
      });
      return res.json();
    },
  };
}

export type APIType = ReturnType<typeof createAPI>;
