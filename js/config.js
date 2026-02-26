/* ============================================
   EncuestaPe — Configuration
   ============================================ */

const CONFIG = {
  // Google Apps Script Web App URL — reemplazar con tu deployment URL
  API_URL: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
  SPREADSHEET_ID: '1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ',
  SITE_NAME: 'EncuestaPe',
  SITE_SLOGAN: 'La voz del Perú en datos',
  REFRESH_INTERVAL: 30000,
  DNI_LENGTH: 8,
  WHATSAPP_NUMBER: '51921647291',

  // Modo demo: usa datos locales en lugar de la API
  DEMO_MODE: true,
};

// ────────────────────────────────────────────────────
// Regiones del Perú (25 departamentos + Nacional)
// ────────────────────────────────────────────────────
const REGIONES_PERU = {
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
  NACIONAL: { nombre: 'Nacional' }
};

// ────────────────────────────────────────────────────
// Tipos de elección
// ────────────────────────────────────────────────────
const TIPOS_ELECCION = {
  PRESIDENTE: { nombre: 'Presidente', scope: 'nacional' },
  DIPUTADOS: { nombre: 'Diputados', scope: 'regional' },
  SENADORES: { nombre: 'Senadores', scope: 'regional' },
  PARLAMENTO_ANDINO: { nombre: 'Parlamento Andino', scope: 'nacional' },
  MUNICIPAL: { nombre: 'Municipal', scope: 'regional' },
  GENERAL: { nombre: 'General', scope: 'both' }
};

// ────────────────────────────────────────────────────
// Datos de demostración — 36 candidatos JNE 2026
// Referencia: IEP feb 2026, Ipsos feb 2026, CPI feb 2026
// Encuesta ciudadana EncuestaPe — Lopez Chau lidera
// ────────────────────────────────────────────────────
const _DEFAULT_DEMO_DATA = {
  encuestas: [
    {
      id: 'E01',
      titulo: 'Intención de voto — Elecciones Generales 2026',
      descripcion: '¿Por quién votaría si las elecciones presidenciales fueran hoy?',
      estado: 'activa',
      opciones: [
        { nombre: 'Pablo Alfonso Lopez Chau Nava', partido: 'Ahora Nacion', foto_url: 'https://mpesije.jne.gob.pe/apidocs/ddfa74eb-cae3-401c-a34c-35543ae83c57.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2980' },
        { nombre: 'Ronald Darwin Atencio Sotomayor', partido: 'Alianza Electoral Venceremos', foto_url: 'https://mpesije.jne.gob.pe/apidocs/bac0288d-3b21-45ac-8849-39f9177fb020.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/3025' },
        { nombre: 'Cesar Acuña Peralta', partido: 'Alianza para el Progreso', foto_url: 'https://mpesije.jne.gob.pe/apidocs/d6fe3cac-7061-474b-8551-0aa686a54bad.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/1257' },
        { nombre: 'Jose Daniel Williams Zapata', partido: 'Avanza Pais', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b60c471f-a6bb-4b42-a4b2-02ea38acbb0d.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2173' },
        { nombre: 'Ricardo Pablo Belmont Cassinelli', partido: 'Civico Obras', foto_url: 'https://mpesije.jne.gob.pe/apidocs/78647f15-d5d1-4ed6-8ac6-d599e83eeea3.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2941' },
        { nombre: 'Yonhy Lescano Ancieta', partido: 'Cooperacion Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b9db2b5c-02ff-4265-ae51-db9b1001ad70.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2995' },
        { nombre: 'Charlie Carrasco Salazar', partido: 'Democrata Unido Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/12fa17db-f28f-4330-9123-88549539b538.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2867' },
        { nombre: 'Alex Gonzales Castillo', partido: 'Democrata Verde', foto_url: 'https://mpesije.jne.gob.pe/apidocs/c0ae56bf-21c1-4810-890a-b25c8465bdd9.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2895' },
        { nombre: 'Armando Joaquin Masse Fernandez', partido: 'Democratico Federal', foto_url: 'https://mpesije.jne.gob.pe/apidocs/cb1adeb7-7d2f-430c-ae87-519137d8edfa.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2986' },
        { nombre: 'Alvaro Gonzalo Paz de la Barra Freigeiro', partido: 'Fe en el Peru', foto_url: '', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2898' },
        { nombre: 'Luis Fernando Olivera Vega', partido: 'Frente de la Esperanza', foto_url: 'https://mpesije.jne.gob.pe/apidocs/3e2312e1-af79-4954-abfa-a36669c1a9e9.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2857' },
        { nombre: 'Keiko Sofia Fujimori Higuchi', partido: 'Fuerza Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/251cd1c0-acc7-4338-bd8a-439ccb9238d0.jpeg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/1366' },
        { nombre: 'Fiorella Giannina Molinelli Aristondo', partido: 'Fuerza y Libertad', foto_url: 'https://mpesije.jne.gob.pe/apidocs/1de656b5-7593-4c60-ab7a-83d618a3d80d.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/3024' },
        { nombre: 'Wolfgang Mario Grozo Costa', partido: 'Integridad Democratica', foto_url: 'https://mpesije.jne.gob.pe/apidocs/064360d1-ce49-4abe-939c-f4de8b0130a2.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2985' },
        { nombre: 'Roberto Helbert Sanchez Palomino', partido: 'Juntos por el Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/bb7c7465-9c6e-44eb-ac7d-e6cc7f872a1a.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/1264' },
        { nombre: 'Rafael Jorge Belaunde Llosa', partido: 'Libertad Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/3302e45b-55c8-4979-a60b-2b11097abf1d.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2933' },
        { nombre: 'Carlos Gonsalo Alvarez Loayza', partido: 'Pais para Todos', foto_url: 'https://mpesije.jne.gob.pe/apidocs/2bd18177-d665-413d-9694-747d729d3e39.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2956' },
        { nombre: 'Pitter Enrique Valderrama Peña', partido: 'Partido Aprista Peruano', foto_url: 'https://mpesije.jne.gob.pe/apidocs/d72c4b29-e173-42b8-b40d-bdb6d01a526a.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2930' },
        { nombre: 'Jorge Nieto Montesinos', partido: 'Partido del Buen Gobierno', foto_url: 'https://mpesije.jne.gob.pe/apidocs/9ae56ed5-3d0f-49ff-8bb9-0390bad71816.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2961' },
        { nombre: 'Mesias Antonio Guevara Amasifuen', partido: 'Partido Morado', foto_url: 'https://mpesije.jne.gob.pe/apidocs/1b861ca7-3a5e-48b4-9024-08a92371e33b.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2840' },
        { nombre: 'Herbert Caller Gutierrez', partido: 'Patriotico del Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/6ad6c5ff-0411-4ddd-9cf7-b0623f373fcf.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2869' },
        { nombre: 'Francisco Ernesto Diez-Canseco Tavara', partido: 'Peru Accion', foto_url: 'https://mpesije.jne.gob.pe/apidocs/2d1bf7f2-6e88-4ea9-8ed2-975c1ae5fb92.jpg', logo_partido_url: 'https://sroppublico.jne.gob.pe/Consulta/Simbolo/GetSimbolo/2932', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2932' },
        { nombre: 'Vladimir Roy Cerron Rojas', partido: 'Peru Libre', foto_url: 'https://mpesije.jne.gob.pe/apidocs/82ee0ff2-2336-4aba-9590-e576f7564315.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2218' },
        { nombre: 'Carlos Ernesto Jaico Carranza', partido: 'Peru Moderno', foto_url: 'https://mpesije.jne.gob.pe/apidocs/7d91e14f-4417-4d61-89ba-3e686dafaa95.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2924' },
        { nombre: 'Mario Enrique Vizcarra Cornejo', partido: 'Peru Primero', foto_url: 'https://mpesije.jne.gob.pe/apidocs/ee7a080e-bc81-4c81-9e5e-9fd95ff459ab.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2925' },
        { nombre: 'Jose Leon Luna Galvez', partido: 'Podemos Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/a669a883-bf8a-417c-9296-c14b943c3943.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2731' },
        { nombre: 'Walter Gilmer Chirinos Purizaga', partido: 'PRIN', foto_url: 'https://mpesije.jne.gob.pe/apidocs/a2d0f631-fe47-4c41-92ba-7ed9f4095520.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2921' },
        { nombre: 'Maria Soledad Perez Tello de Rodriguez', partido: 'Primero la Gente', foto_url: 'https://mpesije.jne.gob.pe/apidocs/073703ca-c427-44f0-94b1-a782223a5e10.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2931' },
        { nombre: 'Paul Davis Jaimes Blanco', partido: 'Progresemos', foto_url: 'https://mpesije.jne.gob.pe/apidocs/929e1a63-335d-4f3a-ba26-f3c7ff136213.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2967' },
        { nombre: 'Napoleon Becerra Garcia', partido: 'PTE Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/bab206cb-b2d5-41ec-bde8-ef8cf3e0a2df.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2939' },
        { nombre: 'Rafael Bernardo Lopez Aliaga Cazorla', partido: 'Renovacion Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b2e00ae2-1e50-4ad3-a103-71fc7e4e8255.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/22' },
        { nombre: 'Antonio Ortiz Villano', partido: 'Salvemos al Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/8e6b9124-2883-4143-8768-105f2ce780eb.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2927' },
        { nombre: 'Alfonso Carlos Espa y Garces-Alvear', partido: 'Sicreo', foto_url: 'https://mpesije.jne.gob.pe/apidocs/85935f77-6c46-4eab-8c7e-2494ffbcece0.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2935' },
        { nombre: 'George Patrick Forsyth Sommer', partido: 'Somos Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b1d60238-c797-4cba-936e-f13de6a34cc7.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/14' },
        { nombre: 'Rosario del Pilar Fernandez Bazan', partido: 'Un Camino Diferente', foto_url: 'https://mpesije.jne.gob.pe/apidocs/ac0b0a59-ead5-4ef1-8ef8-8967e322d6ca.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/2998' },
        { nombre: 'Roberto Enrique Chiabra Leon', partido: 'Unidad Nacional', foto_url: 'https://mpesije.jne.gob.pe/apidocs/5c703ce9-ba1e-4490-90bf-61006740166f.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/formula-presidencial/3023' },
        'Voto en blanco / No precisa',
        'Aún no he decidido'
      ],
      meta_votos: 5000,
      fecha_inicio: '2026-02-09',
      fecha_fin: '2026-03-09',
      categoria: 'ELECCIONES',
      region: 'NACIONAL',
      tipo_eleccion: 'PRESIDENTE',
      total_votos: 873
    },
    {
      id: 'E02',
      titulo: 'Aprobación de gestión municipal — Puno 2026',
      descripcion: '¿Aprueba o desaprueba la gestión del alcalde actual de Puno?',
      estado: 'activa',
      opciones: ['Apruebo totalmente', 'Apruebo parcialmente', 'Desapruebo parcialmente', 'Desapruebo totalmente', 'No sabe / No opina'],
      meta_votos: 2000,
      fecha_inicio: '2026-02-10',
      fecha_fin: '2026-03-30',
      categoria: 'MUNICIPAL',
      region: 'PUNO',
      tipo_eleccion: 'MUNICIPAL',
      total_votos: 890
    },
    {
      id: 'E03',
      titulo: 'Satisfacción ciudadana — Segundo semestre 2025',
      descripcion: '¿Cómo califica la situación general del país en los últimos 6 meses?',
      estado: 'cerrada',
      opciones: ['Muy buena', 'Buena', 'Regular', 'Mala', 'Muy mala'],
      meta_votos: 1200,
      fecha_inicio: '2025-07-01',
      fecha_fin: '2025-12-31',
      categoria: 'GENERAL',
      region: 'NACIONAL',
      tipo_eleccion: 'GENERAL',
      total_votos: 1200
    },
    {
      id: 'E04',
      titulo: 'Diputados por Puno — Elecciones 2026',
      descripcion: 'Encuesta de intención de voto para Diputados por Puno — Elecciones Generales 2026. 35 candidatos inscritos.',
      estado: 'activa',
      opciones: [
        { nombre: 'Camapaza Quispe Mirella Shirley', partido: 'Ahora Nacion', foto_url: 'https://mpesije.jne.gob.pe/apidocs/2061d1c2-6e33-4984-8c30-8164d61babfd.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2980/70212664' },
        { nombre: 'Sonco Villanueva Helard Bladimir', partido: 'Ahora Nacion', foto_url: 'https://mpesije.jne.gob.pe/apidocs/51e0f0d8-3b5a-4ca2-b969-bc892642c00e.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2980/46307918' },
        { nombre: 'Bernal Salas Javier Alcides', partido: 'Renovacion Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b5e9c565-35ff-4242-a200-4ab8a373090f.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/22/02408529' },
        { nombre: 'Condori Flores Remigio', partido: 'Juntos por el Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/01517b31-d1ad-46ae-8e61-04d93a3e9c53.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/1264/01223056' },
        { nombre: 'Tinta Ccoa Betty', partido: 'Fuerza Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/b1e9b5c2-bfb2-4b15-b0f0-a0a70fa0d2f5.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/1366/40877801' },
        { nombre: 'Ramos Conde Mateo', partido: 'Peru Libre', foto_url: 'https://mpesije.jne.gob.pe/apidocs/0a097e88-1fef-468c-bf82-152feb7a6d9a.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2218/01335368' },
        { nombre: 'Jilapa Santander Walter', partido: 'Alianza para el Progreso', foto_url: 'https://mpesije.jne.gob.pe/apidocs/6ee353e8-8c59-4c9a-8750-367ba61e70b3.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/1257/02446803' },
        { nombre: 'Cauna Morales Hermes Evelio', partido: 'Somos Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/e27988e1-89c3-4d33-be39-e3e2f548a87f.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/14/01329345' },
        { nombre: 'Parisaca Chavez Isabel Roxana', partido: 'Libertad Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/cb1ace42-3219-482c-bf8a-3bd0c5c9f326.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2933/01334971' },
        { nombre: 'Gonzales Huaman Oscar', partido: 'Cooperacion Popular', foto_url: 'https://mpesije.jne.gob.pe/apidocs/9385b9b4-306b-41ff-bcf1-25fe302110e8.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2995/80669127' },
        { nombre: 'Apaza Quispe Saulo Nicolas', partido: 'Podemos Peru', foto_url: 'https://mpesije.jne.gob.pe/apidocs/17e898bf-8730-43be-bf16-73f276edbe97.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2731/42459027' },
        { nombre: 'Luque Mamani Juan', partido: 'Peru Moderno', foto_url: 'https://mpesije.jne.gob.pe/apidocs/3009e17a-2bff-45cc-a1e7-18bb5ebc47c7.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2924/01486057' },
        { nombre: 'Huaman Meza Victor Julio', partido: 'Avanza Pais', foto_url: 'https://mpesije.jne.gob.pe/apidocs/7a34aa53-d537-456c-8fef-dbda6038c0da.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2173/02422834' },
        { nombre: 'Yampara Aquise Pedro Ronald', partido: 'Partido Aprista', foto_url: 'https://mpesije.jne.gob.pe/apidocs/a027e9d5-0758-42f1-b4f2-1f22af76f97c.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/2930/46720999' },
        { nombre: 'Flores Quispe Ivan Joel', partido: 'Fuerza y Libertad', foto_url: 'https://mpesije.jne.gob.pe/apidocs/f2508d9e-ed08-42ab-917a-846f9fc24d33.jpg', logo_partido_url: '', url_hoja_vida: 'https://votoinformado.jne.gob.pe/hoja-vida/3024/01308537' }
      ],
      meta_votos: 5000,
      fecha_inicio: '2026-02-20',
      fecha_fin: '2026-04-13',
      categoria: 'ELECCIONES',
      region: 'PUNO',
      tipo_eleccion: 'DIPUTADOS',
      total_votos: 130
    }
  ],

  resultados: {
    'E01': {
      encuesta_id: 'E01',
      total_votos: 873,
      resultados: [
        { opcion: 'Pablo Alfonso Lopez Chau Nava', cantidad: 140, porcentaje: '16.0' },
        { opcion: 'Rafael Bernardo Lopez Aliaga Cazorla', cantidad: 125, porcentaje: '14.3' },
        { opcion: 'Keiko Sofia Fujimori Higuchi', cantidad: 85, porcentaje: '9.7' },
        { opcion: 'George Patrick Forsyth Sommer', cantidad: 55, porcentaje: '6.3' },
        { opcion: 'Cesar Acuña Peralta', cantidad: 50, porcentaje: '5.7' },
        { opcion: 'Vladimir Roy Cerron Rojas', cantidad: 40, porcentaje: '4.6' },
        { opcion: 'Jose Leon Luna Galvez', cantidad: 35, porcentaje: '4.0' },
        { opcion: 'Yonhy Lescano Ancieta', cantidad: 30, porcentaje: '3.4' },
        { opcion: 'Aún no he decidido', cantidad: 28, porcentaje: '3.2' },
        { opcion: 'Mario Enrique Vizcarra Cornejo', cantidad: 25, porcentaje: '2.9' },
        { opcion: 'Jose Daniel Williams Zapata', cantidad: 25, porcentaje: '2.9' },
        { opcion: 'Carlos Gonsalo Alvarez Loayza', cantidad: 22, porcentaje: '2.5' },
        { opcion: 'Voto en blanco / No precisa', cantidad: 20, porcentaje: '2.3' },
        { opcion: 'Jorge Nieto Montesinos', cantidad: 20, porcentaje: '2.3' },
        { opcion: 'Alvaro Gonzalo Paz de la Barra Freigeiro', cantidad: 18, porcentaje: '2.1' },
        { opcion: 'Rafael Jorge Belaunde Llosa', cantidad: 16, porcentaje: '1.8' },
        { opcion: 'Roberto Enrique Chiabra Leon', cantidad: 15, porcentaje: '1.7' },
        { opcion: 'Fiorella Giannina Molinelli Aristondo', cantidad: 14, porcentaje: '1.6' },
        { opcion: 'Ricardo Pablo Belmont Cassinelli', cantidad: 13, porcentaje: '1.5' },
        { opcion: 'Maria Soledad Perez Tello de Rodriguez', cantidad: 12, porcentaje: '1.4' },
        { opcion: 'Luis Fernando Olivera Vega', cantidad: 11, porcentaje: '1.3' },
        { opcion: 'Francisco Ernesto Diez-Canseco Tavara', cantidad: 10, porcentaje: '1.1' },
        { opcion: 'Roberto Helbert Sanchez Palomino', cantidad: 9, porcentaje: '1.0' },
        { opcion: 'Mesias Antonio Guevara Amasifuen', cantidad: 9, porcentaje: '1.0' },
        { opcion: 'Alex Gonzales Castillo', cantidad: 8, porcentaje: '0.9' },
        { opcion: 'Herbert Caller Gutierrez', cantidad: 7, porcentaje: '0.8' },
        { opcion: 'Ronald Darwin Atencio Sotomayor', cantidad: 6, porcentaje: '0.7' },
        { opcion: 'Pitter Enrique Valderrama Peña', cantidad: 5, porcentaje: '0.6' },
        { opcion: 'Wolfgang Mario Grozo Costa', cantidad: 4, porcentaje: '0.5' },
        { opcion: 'Napoleon Becerra Garcia', cantidad: 3, porcentaje: '0.3' },
        { opcion: 'Charlie Carrasco Salazar', cantidad: 3, porcentaje: '0.3' },
        { opcion: 'Armando Joaquin Masse Fernandez', cantidad: 2, porcentaje: '0.2' },
        { opcion: 'Walter Gilmer Chirinos Purizaga', cantidad: 2, porcentaje: '0.2' },
        { opcion: 'Alfonso Carlos Espa y Garces-Alvear', cantidad: 2, porcentaje: '0.2' },
        { opcion: 'Carlos Ernesto Jaico Carranza', cantidad: 1, porcentaje: '0.1' },
        { opcion: 'Paul Davis Jaimes Blanco', cantidad: 1, porcentaje: '0.1' },
        { opcion: 'Antonio Ortiz Villano', cantidad: 1, porcentaje: '0.1' },
        { opcion: 'Rosario del Pilar Fernandez Bazan', cantidad: 1, porcentaje: '0.1' }
      ],
      ultima_actualizacion: new Date().toISOString()
    },
    'E04': {
      encuesta_id: 'E04',
      total_votos: 130,
      resultados: [
        { opcion: 'Camapaza Quispe Mirella Shirley', cantidad: 28, porcentaje: '21.5' },
        { opcion: 'Condori Flores Remigio', cantidad: 18, porcentaje: '13.8' },
        { opcion: 'Bernal Salas Javier Alcides', cantidad: 15, porcentaje: '11.5' },
        { opcion: 'Sonco Villanueva Helard Bladimir', cantidad: 13, porcentaje: '10.0' },
        { opcion: 'Tinta Ccoa Betty', cantidad: 11, porcentaje: '8.5' },
        { opcion: 'Ramos Conde Mateo', cantidad: 9, porcentaje: '6.9' },
        { opcion: 'Jilapa Santander Walter', cantidad: 8, porcentaje: '6.2' },
        { opcion: 'Cauna Morales Hermes Evelio', cantidad: 6, porcentaje: '4.6' },
        { opcion: 'Parisaca Chavez Isabel Roxana', cantidad: 5, porcentaje: '3.8' },
        { opcion: 'Gonzales Huaman Oscar', cantidad: 4, porcentaje: '3.1' },
        { opcion: 'Apaza Quispe Saulo Nicolas', cantidad: 4, porcentaje: '3.1' },
        { opcion: 'Luque Mamani Juan', cantidad: 3, porcentaje: '2.3' },
        { opcion: 'Huaman Meza Victor Julio', cantidad: 2, porcentaje: '1.5' },
        { opcion: 'Yampara Aquise Pedro Ronald', cantidad: 2, porcentaje: '1.5' },
        { opcion: 'Flores Quispe Ivan Joel', cantidad: 2, porcentaje: '1.5' }
      ],
      ultima_actualizacion: new Date().toISOString()
    },
    'E02': {
      encuesta_id: 'E02',
      total_votos: 890,
      resultados: [
        { opcion: 'Desapruebo totalmente', cantidad: 312, porcentaje: '35.1' },
        { opcion: 'Desapruebo parcialmente', cantidad: 223, porcentaje: '25.1' },
        { opcion: 'Apruebo parcialmente', cantidad: 178, porcentaje: '20.0' },
        { opcion: 'No sabe / No opina', cantidad: 98, porcentaje: '11.0' },
        { opcion: 'Apruebo totalmente', cantidad: 79, porcentaje: '8.9' }
      ],
      ultima_actualizacion: new Date().toISOString()
    },
    'E03': {
      encuesta_id: 'E03',
      total_votos: 1200,
      resultados: [
        { opcion: 'Regular', cantidad: 420, porcentaje: '35.0' },
        { opcion: 'Mala', cantidad: 336, porcentaje: '28.0' },
        { opcion: 'Muy mala', cantidad: 216, porcentaje: '18.0' },
        { opcion: 'Buena', cantidad: 168, porcentaje: '14.0' },
        { opcion: 'Muy buena', cantidad: 60, porcentaje: '5.0' }
      ],
      ultima_actualizacion: new Date().toISOString()
    }
  },

  estadisticas: {
    total_votos: 3093,
    total_encuestas: 4,
    regiones: 24,
    precision: 95.5
  },

  votosRegistrados: {}
};

// Load saved data from localStorage, or use defaults
// Auto-merge new encuestas from _DEFAULT if saved data is outdated
const DEMO_DATA = (function() {
  try {
    const saved = localStorage.getItem('encuestape_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.votosRegistrados = parsed.votosRegistrados || {};
      parsed.estadisticas = parsed.estadisticas || _DEFAULT_DEMO_DATA.estadisticas;
      // Merge any new default encuestas not in saved data
      _DEFAULT_DEMO_DATA.encuestas.forEach(defEnc => {
        if (!parsed.encuestas.find(e => e.id === defEnc.id)) {
          parsed.encuestas.push(JSON.parse(JSON.stringify(defEnc)));
          if (_DEFAULT_DEMO_DATA.resultados[defEnc.id]) {
            parsed.resultados[defEnc.id] = JSON.parse(JSON.stringify(_DEFAULT_DEMO_DATA.resultados[defEnc.id]));
          }
        }
      });
      parsed.estadisticas = _DEFAULT_DEMO_DATA.estadisticas;
      return parsed;
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(_DEFAULT_DEMO_DATA));
})();

// Persist current state to localStorage
function saveDemoData() {
  try {
    localStorage.setItem('encuestape_data', JSON.stringify(DEMO_DATA));
  } catch (e) { /* ignore quota errors */ }
}

// Reset to factory defaults
function resetDemoData() {
  localStorage.removeItem('encuestape_data');
  location.reload();
}
