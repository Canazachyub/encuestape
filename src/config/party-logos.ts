// ============================================
// Diccionario de logos oficiales de partidos
// políticos del Perú — Elecciones 2026
// ============================================

export interface PartyInfo {
  nombre: string;
  abbr: string;
  logo: string;
  color: string;
}

/**
 * Mapa normalizado: clave = nombre en minúsculas sin tildes.
 * Se busca por coincidencia parcial para flexibilidad.
 */
const PARTY_LOGOS: PartyInfo[] = [
  { nombre: 'Alianza Venceremos', abbr: 'AV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Logo_de_Alianza_Venceremos.jpg/220px-Logo_de_Alianza_Venceremos.jpg', color: '#0d5c2a' },
  { nombre: 'Partido Patriotico del Peru', abbr: 'PPP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Partido_Patri%C3%B3tico_del_Per%C3%BA_%28logo%29.svg/120px-Partido_Patri%C3%B3tico_del_Per%C3%BA_%28logo%29.svg.png', color: '#1a3a7a' },
  { nombre: 'Partido Civico Obras', abbr: 'PCO', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Logo_del_Partido_C%C3%ADvico_Obras.jpg/220px-Logo_del_Partido_C%C3%ADvico_Obras.jpg', color: '#e67e22' },
  { nombre: 'FREPAP', abbr: 'FREPAP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/FREPAP_logo.png/120px-FREPAP_logo.png', color: '#8B6914' },
  { nombre: 'Frente Popular Agricola', abbr: 'FREPAP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/FREPAP_logo.png/120px-FREPAP_logo.png', color: '#8B6914' },
  { nombre: 'Frente Popular Agricola FIA del Peru', abbr: 'FREPAP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/FREPAP_logo.png/120px-FREPAP_logo.png', color: '#8B6914' },
  { nombre: 'Partido Democrata Verde', abbr: 'PDV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Dem%C3%B3crata_Verde_%28logo%29.svg/120px-Dem%C3%B3crata_Verde_%28logo%29.svg.png', color: '#27ae60' },
  { nombre: 'Partido del Buen Gobierno', abbr: 'PBG', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/PBG_Logo.jpg/220px-PBG_Logo.jpg', color: '#2c3e50' },
  { nombre: 'Peru Accion', abbr: 'PPA', logo: '', color: '#c0392b' },
  { nombre: 'Partido PRIN', abbr: 'PRIN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Partido_Pol%C3%ADtico_PRIN_-_S%C3%ADmbolo.png/120px-Partido_Pol%C3%ADtico_PRIN_-_S%C3%ADmbolo.png', color: '#e74c3c' },
  { nombre: 'Progresemos', abbr: 'PP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Logo_de_Progresemos.jpg/220px-Logo_de_Progresemos.jpg', color: '#3498db' },
  { nombre: 'Partido Si Creo', abbr: 'PSC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Logo_de_si_creo.jpg/220px-Logo_de_si_creo.jpg', color: '#2ecc71' },
  { nombre: 'Partido Pais Para Todos', abbr: 'PPT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Logo_de_Pais_para_todos.jpg/220px-Logo_de_Pais_para_todos.jpg', color: '#1a3a7a' },
  { nombre: 'Pais Para Todos', abbr: 'PPT', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Logo_de_Pais_para_todos.jpg/220px-Logo_de_Pais_para_todos.jpg', color: '#1a3a7a' },
  { nombre: 'Frente de la Esperanza', abbr: 'FE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Frente_Esperanza.png/120px-Frente_Esperanza.png', color: '#e67e22' },
  { nombre: 'Peru Libre', abbr: 'PL', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Partido_Pol%C3%ADtico_Nacional_Per%C3%BA_Libre.png/120px-Partido_Pol%C3%ADtico_Nacional_Per%C3%BA_Libre.png', color: '#c0392b' },
  { nombre: 'Ciudadanos por el Peru', abbr: 'CP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Logo_de_Ciudadanos_por_el_Per%C3%BA.jpg/220px-Logo_de_Ciudadanos_por_el_Per%C3%BA.jpg', color: '#2980b9' },
  { nombre: 'Primero La Gente', abbr: 'PLG', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Logo_de_Primero_la_Gente.jpg/220px-Logo_de_Primero_la_Gente.jpg', color: '#f39c12' },
  { nombre: 'Juntos por el Peru', abbr: 'JP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Logo_juntos_por_el_Peru.svg/120px-Logo_juntos_por_el_Peru.svg.png', color: '#2d8a2d' },
  { nombre: 'Podemos Peru', abbr: 'POD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Logo_Podemos_Per%C3%BA.png/120px-Logo_Podemos_Per%C3%BA.png', color: '#3498db' },
  { nombre: 'Partido Democratico Federal', abbr: 'PDF', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Logo_de_Democratico_federal.jpg/220px-Logo_de_Democratico_federal.jpg', color: '#1a5276' },
  { nombre: 'Fe en el Peru', abbr: 'FEP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/FE_EN_EL_PER%C3%9A_LOGO.png/120px-FE_EN_EL_PER%C3%9A_LOGO.png', color: '#d4a012' },
  { nombre: 'Integridad Democratica', abbr: 'ID', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Logo_de_Integridad_democratica.jpg/220px-Logo_de_Integridad_democratica.jpg', color: '#1a5a8a' },
  { nombre: 'Fuerza Popular', abbr: 'FP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Popular_Force_logo.png/120px-Popular_Force_logo.png', color: '#e74c3c' },
  { nombre: 'Alianza Para el Progreso', abbr: 'APP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Logoapp.png/120px-Logoapp.png', color: '#2980b9' },
  { nombre: 'Cooperacion Popular', abbr: 'CP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Logo_Cooperacion_Popular_Peru.png/120px-Logo_Cooperacion_Popular_Peru.png', color: '#e67e22' },
  { nombre: 'Ahora Nacion', abbr: 'AN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Logo_Ahora_Naci%C3%B3n_2026.jpg/220px-Logo_Ahora_Naci%C3%B3n_2026.jpg', color: '#c0392b' },
  { nombre: 'Libertad Popular', abbr: 'LP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Logo_de_Libertad_Popular.jpg/220px-Logo_de_Libertad_Popular.jpg', color: '#2c3e50' },
  { nombre: 'Un Camino Diferente', abbr: 'UCD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Logo_de_Un_camino_diferente.jpg/220px-Logo_de_Un_camino_diferente.jpg', color: '#8e44ad' },
  { nombre: 'Avanza Pais', abbr: 'AP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Avanza_Pa%C3%ADs_Logo_2017-20.jpg/220px-Avanza_Pa%C3%ADs_Logo_2017-20.jpg', color: '#2c3e50' },
  { nombre: 'Peru Moderno', abbr: 'PM', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Logo_de_Per%C3%BA_moderno.jpg/220px-Logo_de_Per%C3%BA_moderno.jpg', color: '#3498db' },
  { nombre: 'Peru Primero', abbr: 'PPR', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Logo_de_Per%C3%BA_Primero.jpg/220px-Logo_de_Per%C3%BA_Primero.jpg', color: '#6a3aaa' },
  { nombre: 'Salvemos al Peru', abbr: 'SP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Salvemos_al_Per%C3%BA_-_Logo.jpg/220px-Salvemos_al_Per%C3%BA_-_Logo.jpg', color: '#16a085' },
  { nombre: 'Somos Peru', abbr: 'SP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Logo_Partido_Democr%C3%A1tico_Somos_Per%C3%BA.png/120px-Logo_Partido_Democr%C3%A1tico_Somos_Per%C3%BA.png', color: '#e74c3c' },
  { nombre: 'Partido Aprista Peruano', abbr: 'APRA', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Logo_Apra.gif/120px-Logo_Apra.gif', color: '#c0392b' },
  { nombre: 'Renovacion Popular', abbr: 'RP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Logo_de_Renovaci%C3%B3n_Popular_%28Per%C3%BA%29.png/120px-Logo_de_Renovaci%C3%B3n_Popular_%28Per%C3%BA%29.png', color: '#2980b9' },
  { nombre: 'Partido Democratico Unido Peru', abbr: 'PDUP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Logo_de_partido_democratico_unido_peru.jpg/220px-Logo_de_partido_democratico_unido_peru.jpg', color: '#1a5276' },
  { nombre: 'Alianza Fuerza y Libertad', abbr: 'AFL', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Logo_de_Alianza_Fuerza_y_Libertad.jpg/220px-Logo_de_Alianza_Fuerza_y_Libertad.jpg', color: '#e67e22' },
  { nombre: 'Partido de los Trabajadores y Emprendedores', abbr: 'PTE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Logo_PTE_PERU.jpg/220px-Logo_PTE_PERU.jpg', color: '#2c3e50' },
  { nombre: 'Alianza Unidad Nacional', abbr: 'UN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Unidad_Nacional_2025.jpg/220px-Unidad_Nacional_2025.jpg', color: '#1a3a7a' },
  { nombre: 'Unidad Nacional', abbr: 'UN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Unidad_Nacional_2025.jpg/220px-Unidad_Nacional_2025.jpg', color: '#1a3a7a' },
  { nombre: 'Partido Morado', abbr: 'PM', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Logo_Partido_Morado.png/120px-Logo_Partido_Morado.png', color: '#7c3aed' },
  { nombre: 'Accion Popular', abbr: 'AP', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Acci%C3%B3n_Popular.png/120px-Acci%C3%B3n_Popular.png', color: '#c0392b' },
  { nombre: 'Victoria Nacional', abbr: 'VN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Logo_de_Victoria_Nacional.png/120px-Logo_de_Victoria_Nacional.png', color: '#e67e22' },
  { nombre: 'Democracia Directa', abbr: 'DD', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/S%C3%ADmbolo_del_Movimiento_Pol%C3%ADtico_Democracia_Directa.svg/120px-S%C3%ADmbolo_del_Movimiento_Pol%C3%ADtico_Democracia_Directa.svg.png', color: '#e74c3c' },
];

/**
 * Normaliza un string quitando tildes, puntos y pasando a minúsculas
 */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.·]/g, '')
    .trim();
}

/**
 * Busca el partido por nombre (coincidencia parcial flexible).
 * Primero intenta match exacto, luego "contiene".
 */
export function findPartyLogo(partyName: string): PartyInfo | null {
  if (!partyName) return null;
  const needle = normalize(partyName);

  // Exact match first
  const exact = PARTY_LOGOS.find(p => normalize(p.nombre) === needle);
  if (exact) return exact;

  // Best partial match — pick the one with the longest overlap
  let best: PartyInfo | null = null;
  let bestLen = 0;

  for (const p of PARTY_LOGOS) {
    const pNorm = normalize(p.nombre);
    if (needle.includes(pNorm) || pNorm.includes(needle)) {
      const overlap = Math.min(needle.length, pNorm.length);
      if (overlap > bestLen) {
        bestLen = overlap;
        best = p;
      }
    }
  }
  return best;
}

export { PARTY_LOGOS };
