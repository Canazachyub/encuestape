# EncuestaPe.com

Plataforma de encuestas electorales y opinión pública del Perú. Votación por DNI, resultados en tiempo real, portal de noticias y panel administrativo.

**Sitio:** [encuestape.com](https://encuestape.com)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18 + TypeScript 5 + Vite 5 |
| **Charts** | Chart.js 4 + react-chartjs-2 |
| **Backend** | Google Apps Script + Google Sheets (base de datos) |
| **Almacenamiento** | Google Drive API (imágenes) |
| **Anti-bot** | Google reCAPTCHA v2 + CAPTCHA matemático |
| **Deploy** | GitHub Pages + GitHub Actions (CI/CD automático) |
| **Dominio** | encuestape.com (Hostinger DNS → GitHub Pages) |
| **Routing** | React Router v6 (SPA con 404.html fallback) |

---

## Páginas y Secciones

### Inicio / Landing (`/`)

| Sección | Descripción |
|---------|-------------|
| **Hero** | Título principal, botones CTA, contador EN VIVO de votos, guía "¿Cómo votar?" en 3 pasos |
| **Stats** | Contadores animados: votos registrados, encuestas realizadas, regiones cubiertas, % precisión |
| **Encuestas Activas** | Grid de cards con progreso, categoría, región y botones votar/resultados |
| **Resultados Preview** | Dashboard con barras de resultados, fotos de candidatos, logos de partido, filtros por categoría y región |
| **Noticias** | Carousel interactivo de 2 slides: grid de noticias recientes + tarjetas destacadas horizontales |
| **Mapa del Perú** | Mapa SVG interactivo con tooltip por región y sidebar de estadísticas |
| **Cómo Funciona** | 3 pasos: Elige encuesta → Selecciona candidato → Confirma voto |
| **Credibilidad** | Cita institucional + features de confianza |
| **Newsletter** | Formulario de suscripción por email |
| **Footer** | Links, redes sociales, información legal |

### Votar (`/votar/:id`)

| Paso | Descripción |
|------|-------------|
| **1. Verificación DNI** | Input de 8 dígitos, validación contra votos previos |
| **2. Seleccionar Candidato** | Grid de candidatos con foto, partido, logo y número |
| **3. Confirmar Voto** | Resumen del voto con botón de confirmación |
| **4. Resultado** | Confirmación exitosa con opción de compartir por WhatsApp/redes |

**Sistema CAPTCHA escalonado:**
- 0-4 votos desde el dispositivo: sin verificación adicional
- 5-6 votos: CAPTCHA matemático (suma/resta aleatoria)
- 7+ votos: Google reCAPTCHA v2 ("No soy un robot")

### Resultados (`/resultados`)

- Filtros por tipo de elección (Presidencial, Senadores, Diputados, Parlamento Andino, Municipal)
- Filtros por región (25 departamentos + Nacional)
- Barras animadas con porcentaje, foto del candidato, logo de partido y número
- Link a hoja de vida JNE por candidato
- Exportación CSV de resultados
- Vista dashboard con gráficos de barras y dona

### Noticias (`/noticias`)

- 12 categorías: Local, Regional, Policial, Política, Cultural, Espectáculos, Internacional, Economía, Elecciones 2026, Opinión, Candidatos, Publicidad
- Artículos individuales (`/noticias/:id`) con hero banner y compartir por WhatsApp
- Denuncias ciudadanas anónimas con sistema de votos de apoyo
- Foro del día con votación tipo encuesta
- Sección "El Pueblo Vota" con resultados en vivo de la encuesta principal

### Panel Admin (`/admin`)

| Módulo | Funcionalidades |
|--------|----------------|
| **Dashboard** | KPIs en tiempo real, gráficos de votos por día, distribución por región |
| **Encuestas** | Crear, editar, cerrar encuestas. Gestionar candidatos con foto, partido, logo, número |
| **Noticias** | CRUD completo con editor de contenido, categorías, imagen desde Drive |
| **Denuncias** | Gestión de estado: pendiente → revisada → publicada |
| **Foro** | Crear preguntas del día con opciones de votación |
| **Galería** | Subida de imágenes a Google Drive, organización por día, vista previa |
| **Resultados** | Tabla de conteos, exportación CSV |

---

## Seguridad Anti-fraude

| Capa | Mecanismo |
|------|-----------|
| **DNI** | Un voto por persona por encuesta (validación server-side) |
| **CAPTCHA escalonado** | Math CAPTCHA (5-6 votos) → reCAPTCHA v2 (7+ votos) por dispositivo |
| **Device tracking** | localStorage para conteo de votos por dispositivo |
| **Auto-scaling** | Meta de votos se duplica automáticamente al alcanzar el objetivo (5000 → 10000 → 20000...) |
| **Token admin** | Sesiones con token, auto-logout si expira o no está autorizado |

---

## Arquitectura

### Frontend

```
src/
├── components/
│   ├── charts/          # BarChart, DoughnutChart, LineChart, ResultBars
│   ├── encuesta/        # EncuestaCard, EncuestaGrid
│   ├── landing/         # HeroSection, MapSection, NewsSection, ResultsSection,
│   │                    # StatsSection, TrustSection, NewsletterSection
│   ├── layout/          # Navbar, Footer, MobileMenu, WhatsAppFloat
│   └── map/             # PeruMap, MapSidebar, MapTooltip, regionPaths
├── config/
│   ├── constants.ts     # API_URL, regiones, categorías, tipos de elección
│   └── demo-data.ts     # 59 encuestas + 873 votos + noticias + denuncias + foro
├── context/
│   ├── AuthContext.tsx   # Login/logout con token, auto-logout
│   └── DemoDataContext.tsx  # Provider dual: demo (localStorage) / producción (API)
├── hooks/
│   ├── useAutoRefresh.ts        # Polling de resultados en tiempo real
│   ├── useAnimateCounter.ts     # Contadores con easeOutCubic animation
│   └── useIntersectionObserver.ts  # Scroll-triggered animations + viewport check
├── pages/
│   ├── LandingPage.tsx    # Página principal con todas las secciones
│   ├── VotarPage.tsx      # Flujo de votación en 4 pasos
│   ├── ResultadosPage.tsx # Dashboard de resultados con filtros
│   ├── NoticiasPage.tsx   # Portal de noticias con denuncias y foro
│   ├── ArticuloPage.tsx   # Artículo individual
│   └── AdminPage.tsx      # Panel de administración completo
├── services/
│   ├── api.ts           # Capa API: demo mode vs producción, cache 30s TTL
│   └── storage.ts       # localStorage para datos demo y device tracking
├── styles/
│   └── animations.css   # Scroll animations (reemplaza AOS library)
├── types/
│   └── index.ts         # Interfaces TypeScript para toda la app
└── utils/
    ├── format.ts        # formatNumber, formatDate
    ├── hash.ts          # hashDNI para anonimización
    ├── helpers.ts       # Utilidades generales
    └── validators.ts    # Validación de DNI y inputs

css/
├── variables.css    # CSS custom properties (colores, tipografía, espaciado)
├── base.css         # Reset, tipografía base, utilidades globales
├── components.css   # Botones, cards, badges, progress bars, tablas
├── landing.css      # Hero, stats, encuestas, resultados, noticias, footer
├── admin.css        # Dashboard, formularios, galería, sidebar
├── noticias.css     # Portal de noticias, artículos, denuncias, foro
├── mapa.css         # Mapa SVG del Perú, tooltips, sidebar
├── votar.css        # Flujo de votación, candidatos, confirmación
└── responsive.css   # Breakpoints: 1024px, 768px, 480px

apps-script/
└── Code.gs          # Backend completo en Google Apps Script
```

### Backend (Google Apps Script)

**Base de datos:** Google Sheets con 9 hojas:

| Hoja | Columnas principales | Descripción |
|------|---------------------|-------------|
| **Encuestas** | id, titulo, descripcion, estado, opciones (JSON), meta_votos, fechas, categoria, region, tipo_eleccion | Encuestas con candidatos |
| **Candidatos** | nombre, partido, logo_url, foto_url, numero, url_hoja_vida | Datos de candidatos JNE |
| **Votos** | encuesta_id, opcion, dni_hash, timestamp, region, ip | Registro de votos |
| **Conteos** | encuesta_id, opcion, cantidad | Conteo agregado para resultados rápidos |
| **Config** | clave, valor | Credenciales admin, configuración |
| **Suscriptores** | email, fecha | Newsletter |
| **Noticias** | id, titulo, extracto, contenido, categoria, imagen_url, autor, fecha, publicado, destacado | Artículos |
| **Denuncias** | id, titulo, descripcion, categoria, region, fecha, estado, votos_apoyo | Denuncias ciudadanas |
| **Foro** | id, pregunta, descripcion, opciones (JSON), fecha, activa, categoria, total_votos | Preguntas del día |

**Almacenamiento de imágenes:** Google Drive (carpeta `1KiO_7LbOn5q0TPGAkonCL1uS6AE3DNcX`) con permisos públicos para visualización.

### Endpoints API

**GET (públicos):**

| action | Descripción |
|--------|-------------|
| `getAllPublicData` | Encuestas + noticias + denuncias + foro + estadísticas (una sola llamada) |
| `getEncuestas` | Lista de encuestas |
| `getResultados&id=X` | Resultados de una encuesta (lee de hoja Conteos) |
| `getEstadisticas` | Totales: votos, encuestas, regiones, precisión |
| `getNoticias` | Noticias publicadas |
| `getDenuncias` | Denuncias ciudadanas |
| `getForo` | Preguntas del foro |
| `getImagenes` | Galería de imágenes |

**POST (mutaciones):**

| action | Acceso | Descripción |
|--------|--------|-------------|
| `registrarVoto` | Público | Voto con DNI + región + reCAPTCHA. Auto-duplica meta_votos al alcanzar objetivo |
| `login` | Público | Autenticación admin, retorna token |
| `getAdminData` | Admin | Dashboard completo con estadísticas |
| `crearEncuesta` | Admin | Crear encuesta con opciones JSON |
| `editarEncuesta` | Admin | Editar encuesta existente |
| `cerrarEncuesta` | Admin | Cambiar estado a "cerrada" |
| `crearNoticia` | Admin | Crear artículo de noticias |
| `editarNoticia` | Admin | Editar artículo |
| `eliminarNoticia` | Admin | Eliminar artículo |
| `subirImagenDrive` | Admin | Subir imagen Base64 a Google Drive (timeout: 60s) |
| `crearDenuncia` | Público | Crear denuncia anónima |
| `apoyarDenuncia` | Público | +1 voto de apoyo a denuncia |
| `votarForo` | Público | Votar en pregunta del foro |
| `suscribirEmail` | Público | Suscripción newsletter |

---

## UX y Performance

| Optimización | Detalle |
|-------------|---------|
| **Carga inicial** | Un solo endpoint `getAllPublicData` para toda la data pública |
| **Cache API** | Respuestas cacheadas 30 segundos en memoria (TTL) |
| **Animaciones** | IntersectionObserver con detección inmediata de viewport (sin flash en SPA navigation) |
| **Contadores** | Animación easeOutCubic de 2s, re-anima al recibir datos reales |
| **Loading states** | Pulse animation mientras se obtienen datos |
| **Auto-refresh** | Polling automático de resultados en tiempo real |
| **Responsive** | 3 breakpoints: desktop (>1024), tablet (768-1024), móvil (<768) |
| **Scroll suave** | Navegación entre secciones con smooth scroll nativo |
| **Imágenes** | Lazy loading, referrerPolicy no-referrer para Drive thumbnails |

---

## Setup

### 1. Desarrollo local

```bash
git clone https://github.com/canazachyub/encuestape.git
cd encuestape
npm install
npm run dev        # http://localhost:5173
```

Para modo demo (sin backend): `DEMO_MODE = true` en `src/config/constants.ts`

### 2. Configurar Backend (Google Apps Script)

1. Crear proyecto en [script.google.com](https://script.google.com)
2. Pegar contenido de `apps-script/Code.gs`
3. Configurar `SPREADSHEET_ID` con el ID de tu Google Sheet
4. Ejecutar `setupSheets()` → crea las 9 hojas con encabezados formateados
5. Ejecutar `poblarEncuestaE01()` → encuesta presidencial con 36 candidatos
6. Ejecutar `generarVotosDemo()` → votos simulados
7. Ejecutar `poblarTodoPortalNoticias()` → noticias + denuncias + foro
8. Ejecutar `testDrivePermiso()` → autorizar permisos de Google Drive (lectura + escritura)
9. Implementar como Web App (Ejecutar como: yo, Acceso: cualquiera)
10. Copiar URL del deploy y configurar en `src/config/constants.ts` → `API_URL`

**Importante:** Cada vez que se agreguen nuevas APIs (ej: DriveApp), se debe crear un nuevo deploy y re-autorizar permisos.

### 3. Deploy a GitHub Pages

**Automático (recomendado):** Push a `main` → GitHub Actions ejecuta build y deploy.

**Manual:**
```bash
npm run build
npx gh-pages -d dist
```

### 4. DNS (Hostinger → GitHub Pages)

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | canazachyub.github.io |

---

## Variables de Configuración

En `src/config/constants.ts`:

| Variable | Descripción |
|----------|-------------|
| `API_URL` | URL del deploy de Google Apps Script |
| `DEMO_MODE` | `true` = datos locales, `false` = API real |
| `SITE_NAME` | "EncuestaPe" |
| `REFRESH_INTERVAL` | Intervalo de auto-refresh (ms) |
| `DNI_LENGTH` | 8 (DNI peruano) |
| `WHATSAPP_NUMBER` | Número para botón flotante de WhatsApp |
| `RECAPTCHA_SITE_KEY` | Clave pública de Google reCAPTCHA v2 |

---

## Credenciales Demo

- **Admin:** `admin` / `admin`
- **DNI para votar:** cualquier número de 8 dígitos

---

## Licencia

Proyecto privado — EncuestaPe.com
