# EncuestaPe.com

Plataforma de encuestas electorales y opinión pública del Perú. Votación por DNI, resultados en tiempo real, portal de noticias y panel administrativo.

**Sitio:** [encuestape.com](https://encuestape.com)

---

## Stack

- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **Charts:** Chart.js 4 + react-chartjs-2
- **Backend:** Google Apps Script + Google Sheets (base de datos)
- **Deploy:** GitHub Pages (manual con `gh-pages` o GitHub Actions)
- **Dominio:** encuestape.com (Hostinger DNS → GitHub Pages)

## Características

### Encuestas
- 59 encuestas con candidatos oficiales JNE 2026 (presidencial, senadores, diputados, parlamento andino)
- Votación con verificación de DNI (un voto por persona por encuesta)
- Resultados en tiempo real con barras animadas, logos de partido y fotos de candidatos
- Mapa interactivo SVG del Perú con estadísticas por región
- Filtros por tipo de elección y región
- Vista dashboard con gráficos de barras y dona
- Exportación CSV de resultados

### Portal de Noticias (`/noticias`)
- 15 noticias en 12 categorías (Local, Regional, Policial, Política, Cultural, Espectáculos, Internacional, Economía, Elecciones 2026, Opinión, Candidatos, Publicidad)
- Denuncias ciudadanas anónimas con sistema de apoyo
- Foro del día con votación tipo encuesta
- Sección "El Pueblo Vota" con resultados en vivo
- Artículos individuales con hero banner, compartir por WhatsApp

### Panel Admin (`/admin`)
- Dashboard con KPIs y gráficos
- CRUD completo: encuestas, noticias, denuncias, foro
- Galería de imágenes organizada por día
- Gestión de estado de denuncias (pendiente → revisada → publicada)
- Exportación CSV de resultados

### Seguridad Anti-fraude
- Verificación de DNI: un voto por persona por encuesta
- CAPTCHA escalonado por dispositivo:
  - 0–4 votos: sin verificación adicional
  - 5–6 votos: CAPTCHA matemático (suma/resta)
  - 7+ votos: Google reCAPTCHA v2 ("No soy un robot")
- Tracking de votos por dispositivo vía localStorage
- Auto-aumento de meta de votos (x2) al alcanzar el objetivo

### UX / Performance
- Diseño responsive (desktop, tablet, móvil)
- Carga inicial optimizada: un solo endpoint `getAllPublicData` para toda la data pública
- Contadores animados con re-animación al recibir datos reales
- Estado de carga con animación pulse mientras se obtienen datos del API
- Auto-refresh de resultados en tiempo real

## Estructura

```
src/
├── components/
│   ├── charts/          # BarChart, DoughnutChart, LineChart, ResultBars
│   ├── encuesta/        # EncuestaCard, EncuestaGrid
│   ├── landing/         # Hero, Map, News, Results, Stats, Trust, Newsletter
│   ├── layout/          # Navbar, Footer, MobileMenu, WhatsAppFloat
│   └── map/             # PeruMap, MapSidebar, MapTooltip, regionPaths
├── config/
│   ├── constants.ts     # Regiones, categorías, tipos de elección
│   └── demo-data.ts     # 59 encuestas + 873 votos + noticias + denuncias + foro
├── context/             # DemoDataContext (dual-mode: demo/producción), AuthContext
├── hooks/               # useAutoRefresh, useAnimateCounter, useIntersectionObserver
├── pages/               # Landing, Votar, Resultados, Noticias, Articulo, Admin
├── services/            # API (demo/producción), Storage (localStorage)
├── types/               # TypeScript interfaces
└── utils/               # format, hash, helpers, validators
css/                     # variables, base, components, landing, admin, noticias, mapa, votar, responsive
apps-script/Code.gs      # Google Apps Script backend completo
```

## Google Sheets Backend

El `apps-script/Code.gs` gestiona 9 hojas:

| Hoja | Contenido |
|------|-----------|
| Encuestas | Encuestas con opciones JSON (candidatos + fotos + logos) |
| Candidatos | Datos de candidatos: nombre, partido, logo, foto, número, hoja de vida |
| Votos | Registros de votos con DNI, timestamp, región |
| Config | Credenciales admin, configuración del sitio |
| Suscriptores | Newsletter emails |
| Noticias | Artículos con categoría, imagen, autor, fecha |
| Denuncias | Denuncias ciudadanas anónimas con votos de apoyo |
| Foro | Preguntas del día con opciones JSON y votos |
| Imagenes | URLs de imágenes organizadas por carpeta/día |

### Endpoints API

**GET (públicos):**
| action | Descripción |
|--------|-------------|
| `getAllPublicData` | Retorna encuestas + noticias + denuncias + foro + estadísticas en una sola llamada |
| `getEncuestas` | Lista de encuestas |
| `getResultados` | Resultados de una encuesta por ID |
| `getEstadisticas` | Estadísticas generales (votos, encuestas, regiones, precisión) |
| `getNoticias` | Noticias publicadas |
| `getDenuncias` | Denuncias ciudadanas |
| `getForo` | Preguntas del foro |
| `getImagenes` | Galería de imágenes |

**POST (mutaciones):**
| action | Acceso | Descripción |
|--------|--------|-------------|
| `registrarVoto` | Público | Registra voto con validación de DNI y región |
| `crearEncuesta` | Admin | Crear encuesta |
| `editarEncuesta` | Admin | Editar encuesta existente |
| `cerrarEncuesta` | Admin | Cerrar encuesta |
| `crearNoticia` | Admin | Crear noticia |
| `editarNoticia` | Admin | Editar noticia |
| `eliminarNoticia` | Admin | Eliminar noticia |
| `crearDenuncia` | Público | Crear denuncia anónima |
| `apoyarDenuncia` | Público | +1 voto de apoyo |
| `votarForo` | Público | Votar en pregunta del foro |
| `suscribirEmail` | Público | Newsletter |

### Setup en Apps Script
1. Crear proyecto en [script.google.com](https://script.google.com)
2. Pegar contenido de `apps-script/Code.gs`
3. Configurar `SPREADSHEET_ID` con el ID de tu Google Sheet
4. Ejecutar `setupSheets()` → crea las 9 hojas con encabezados formateados
5. Ejecutar `poblarEncuestaE01()` → encuesta presidencial con 36 candidatos
6. Ejecutar `generarVotosDemo()` → 873 votos simulados en 14 días
7. Ejecutar `poblarTodoPortalNoticias()` → noticias + denuncias + foro
8. Implementar como Web App (Ejecutar como: yo, Acceso: cualquiera)
9. Copiar URL del deploy y configurar en `src/config/constants.ts` → `API_URL`

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Genera dist/
```

Para modo demo (sin backend): `DEMO_MODE = true` en `src/config/constants.ts`

## Deploy

### Opción 1: Manual con gh-pages
```bash
npm run build
npx gh-pages -d dist
```

### Opción 2: GitHub Actions (automático al push a main)
**Workflow:** `.github/workflows/deploy.yml`
- Instala dependencias, ejecuta `npm run build`
- Genera `404.html` (copia de `index.html` para SPA routing)
- Incluye `CNAME` para dominio custom
- Despliega a GitHub Pages

### DNS (Hostinger)
| Tipo | Nombre | Valor |
|------|--------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | canazachyub.github.io |

## Credenciales demo

- **Admin:** `admin` / `admin`
- **DNI para votar:** cualquier número de 8 dígitos

## Licencia

Proyecto privado — EncuestaPe.com
