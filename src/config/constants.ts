import type { AppConfig, RegionCode, RegionInfo, TipoEleccionCode, TipoEleccionInfo } from '../types';

export const NEWS_CATEGORIES = [
  'Local', 'Regional', 'Policial', 'Política',
  'Cultural', 'Espectáculos', 'Internacional', 'Economía',
  'Elecciones 2026', 'Opinión', 'Candidatos', 'Publicidad',
];

export const DENUNCIA_CATEGORIES = [
  'Corrupción', 'Servicios', 'Seguridad', 'Infraestructura', 'Medio Ambiente', 'Otro',
];

export const FORO_CATEGORIES = [
  'Política', 'Sociedad', 'Economía', 'Educación', 'Salud',
];

export const CONFIG: AppConfig = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxunahYUGHoDybOALZopQYyfvKnhRO06wsimsbxtWWomkAXjMf2IGcDFkRQni7V66Y24A/exec',
  SPREADSHEET_ID: '1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ',
  SITE_NAME: 'EncuestaPe',
  SITE_SLOGAN: 'La voz del Perú en datos',
  REFRESH_INTERVAL: 30000,
  DNI_LENGTH: 8,
  WHATSAPP_NUMBER: '51921647291',
  DEMO_MODE: true,
};

export const REGIONES_PERU: Record<RegionCode, RegionInfo> = {
  AMAZONAS: { nombre: 'Amazonas' },
  ANCASH: { nombre: 'Áncash' },
  APURIMAC: { nombre: 'Apurímac' },
  AREQUIPA: { nombre: 'Arequipa' },
  AYACUCHO: { nombre: 'Ayacucho' },
  CAJAMARCA: { nombre: 'Cajamarca' },
  CALLAO: { nombre: 'Callao' },
  CUSCO: { nombre: 'Cusco' },
  HUANCAVELICA: { nombre: 'Huancavelica' },
  HUANUCO: { nombre: 'Huánuco' },
  ICA: { nombre: 'Ica' },
  JUNIN: { nombre: 'Junín' },
  LA_LIBERTAD: { nombre: 'La Libertad' },
  LAMBAYEQUE: { nombre: 'Lambayeque' },
  LIMA: { nombre: 'Lima' },
  LORETO: { nombre: 'Loreto' },
  MADRE_DE_DIOS: { nombre: 'Madre de Dios' },
  MOQUEGUA: { nombre: 'Moquegua' },
  PASCO: { nombre: 'Pasco' },
  PIURA: { nombre: 'Piura' },
  PUNO: { nombre: 'Puno' },
  SAN_MARTIN: { nombre: 'San Martín' },
  TACNA: { nombre: 'Tacna' },
  TUMBES: { nombre: 'Tumbes' },
  UCAYALI: { nombre: 'Ucayali' },
  NACIONAL: { nombre: 'Nacional' },
};

export const TIPOS_ELECCION: Record<TipoEleccionCode, TipoEleccionInfo> = {
  PRESIDENTE: { nombre: 'Presidente', scope: 'nacional' },
  DIPUTADOS: { nombre: 'Diputados', scope: 'regional' },
  SENADORES: { nombre: 'Senadores', scope: 'regional' },
  PARLAMENTO_ANDINO: { nombre: 'Parlamento Andino', scope: 'nacional' },
  MUNICIPAL: { nombre: 'Municipal', scope: 'regional' },
  GENERAL: { nombre: 'General', scope: 'both' },
};
