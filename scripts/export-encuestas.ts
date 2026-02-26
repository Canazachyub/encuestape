import { DEFAULT_DEMO_DATA } from '../src/config/demo-data';
import { writeFileSync } from 'fs';

const CELL_LIMIT = 45000; // Leave margin under 50K

interface CandidatoRow {
  encuesta_id: string;
  nombre: string;
  partido: string;
  foto_url: string;
  url_hoja_vida: string;
  numero: number;
}

const encuestas: any[] = [];
const candidatos: CandidatoRow[] = [];

for (const e of DEFAULT_DEMO_DATA.encuestas) {
  const opcionesJson = JSON.stringify(e.opciones);
  const useCandidatos = opcionesJson.length > CELL_LIMIT;

  if (useCandidatos) {
    // Store candidates separately
    for (const op of e.opciones) {
      if (typeof op === 'string') {
        candidatos.push({
          encuesta_id: e.id,
          nombre: op,
          partido: '',
          foto_url: '',
          url_hoja_vida: '',
          numero: 0,
        });
      } else {
        candidatos.push({
          encuesta_id: e.id,
          nombre: op.nombre,
          partido: op.partido,
          foto_url: op.foto_url,
          url_hoja_vida: op.url_hoja_vida || '',
          numero: op.numero || 0,
        });
      }
    }
    encuestas.push({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion,
      estado: e.estado,
      opciones: '@CANDIDATOS',
      meta_votos: e.meta_votos,
      fecha_inicio: e.fecha_inicio,
      fecha_fin: e.fecha_fin,
      categoria: e.categoria,
      region: e.region,
      tipo_eleccion: e.tipo_eleccion,
    });
  } else {
    encuestas.push({
      id: e.id,
      titulo: e.titulo,
      descripcion: e.descripcion,
      estado: e.estado,
      opciones: e.opciones,
      meta_votos: e.meta_votos,
      fecha_inicio: e.fecha_inicio,
      fecha_fin: e.fecha_fin,
      categoria: e.categoria,
      region: e.region,
      tipo_eleccion: e.tipo_eleccion,
    });
  }
}

const output = { encuestas, candidatos };
writeFileSync('apps-script/demo-encuestas.json', JSON.stringify(output));

const inCell = encuestas.filter(e => e.opciones !== '@CANDIDATOS').length;
const inSheet = encuestas.filter(e => e.opciones === '@CANDIDATOS').length;
console.log(`Exported ${encuestas.length} encuestas (${inCell} inline, ${inSheet} in Candidatos sheet)`);
console.log(`Exported ${candidatos.length} candidatos`);
