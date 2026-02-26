// ============================================
// EncuestaPe — TypeScript Types
// ============================================

export type RegionCode =
  | 'AMAZONAS' | 'ANCASH' | 'APURIMAC' | 'AREQUIPA' | 'AYACUCHO'
  | 'CAJAMARCA' | 'CALLAO' | 'CUSCO' | 'HUANCAVELICA' | 'HUANUCO'
  | 'ICA' | 'JUNIN' | 'LA_LIBERTAD' | 'LAMBAYEQUE' | 'LIMA'
  | 'LORETO' | 'MADRE_DE_DIOS' | 'MOQUEGUA' | 'PASCO' | 'PIURA'
  | 'PUNO' | 'SAN_MARTIN' | 'TACNA' | 'TUMBES' | 'UCAYALI'
  | 'NACIONAL';

export type TipoEleccionCode =
  | 'PRESIDENTE' | 'DIPUTADOS' | 'SENADORES'
  | 'PARLAMENTO_ANDINO' | 'MUNICIPAL' | 'GENERAL';

export type EncuestaEstado = 'activa' | 'cerrada' | 'proxima';

export interface CandidateOption {
  nombre: string;
  partido: string;
  foto_url: string;
  logo_partido_url: string;
  url_hoja_vida?: string;
  numero?: number;
}

export type EncuestaOption = string | CandidateOption;

export interface Encuesta {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EncuestaEstado;
  opciones: EncuestaOption[];
  meta_votos: number;
  fecha_inicio: string;
  fecha_fin: string;
  categoria: string;
  region: RegionCode;
  tipo_eleccion: TipoEleccionCode;
  total_votos: number;
}

export interface ResultadoOpcion {
  opcion: string;
  cantidad: number;
  porcentaje: string;
}

export interface ResultadosData {
  encuesta_id: string;
  total_votos: number;
  resultados: ResultadoOpcion[];
  ultima_actualizacion: string;
}

export interface Estadisticas {
  total_votos: number;
  total_encuestas: number;
  regiones: number;
  precision: number;
}

export interface VotoReciente {
  encuesta_id: string;
  opcion: string;
  timestamp: string;
  region: string;
}

export interface ImageItem {
  id: string;
  nombre: string;
  data_url: string;
  fecha: string;
  size: number;
}

export interface DemoData {
  encuestas: Encuesta[];
  resultados: Record<string, ResultadosData>;
  estadisticas: Estadisticas;
  votosRegistrados: Record<string, string[]>;
  noticias: NewsArticle[];
  denuncias: DenunciaCiudadana[];
  foro: ForoPregunta[];
  imagenes: ImageItem[];
}

export interface RegionInfo {
  nombre: string;
}

export interface TipoEleccionInfo {
  nombre: string;
  scope: 'nacional' | 'regional' | 'both';
}

export interface AppConfig {
  API_URL: string;
  SPREADSHEET_ID: string;
  SITE_NAME: string;
  SITE_SLOGAN: string;
  REFRESH_INTERVAL: number;
  DNI_LENGTH: number;
  WHATSAPP_NUMBER: string;
  DEMO_MODE: boolean;
}

// API response types
export interface EncuestasResponse {
  encuestas: Encuesta[];
}

export interface ValidarDNIResponse {
  permitido: boolean;
  mensaje: string;
}

export interface RegistrarVotoRequest {
  encuesta_id: string;
  opcion: string;
  dni_hash: string;
}

export interface RegistrarVotoResponse {
  exito: boolean;
  mensaje: string;
}

export interface LoginResponse {
  exito: boolean;
  token?: string;
  mensaje?: string;
}

export interface AdminDataResponse {
  encuestas: Encuesta[];
  estadisticas: Estadisticas;
  votos_recientes: VotoReciente[];
}

export interface SuscribirResponse {
  exito: boolean;
}

export interface NewsArticle {
  id: string;
  titulo: string;
  extracto: string;
  contenido: string;
  categoria: string;
  imagen_url: string;
  autor: string;
  fecha_publicacion: string;
  publicado: boolean;
  destacado: boolean;
}

export interface DenunciaCiudadana {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  region: string;
  fecha: string;
  estado: 'pendiente' | 'revisada' | 'publicada';
  votos_apoyo: number;
}

export interface ForoPregunta {
  id: string;
  pregunta: string;
  descripcion: string;
  opciones: { texto: string; votos: number }[];
  fecha: string;
  activa: boolean;
  categoria: string;
  total_votos: number;
}
