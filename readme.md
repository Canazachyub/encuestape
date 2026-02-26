# EncuestaPe.com

Plataforma de encuestas electorales y opinión pública del Perú. Votación por DNI, resultados en tiempo real, portal de noticias y panel administrativo.

**Sitio:** [encuestape.com](https://encuestape.com)

---

## Stack

- **Frontend:** React 18 + TypeScript 5 + Vite 5
- **Backend:** Google Apps Script + Google Sheets
- **Deploy:** GitHub Pages + GitHub Actions
- **Dominio:** encuestape.com (Hostinger DNS → GitHub Pages)

## Características

### Encuestas
- 59 encuestas con candidatos oficiales JNE 2026 (presidencial, senadores, diputados, parlamento andino)
- Votación con verificación de DNI (un voto por persona)
- Resultados en tiempo real con barras animadas y logos de partido
- Mapa interactivo del Perú con estadísticas por región
- Filtros por tipo de elección y región

### Portal de Noticias (`/noticias`)
- 15 noticias en 12 categorías (Local, Regional, Policial, Política, Cultural, Espectáculos, Internacional, Economía, Elecciones 2026, Opinión, Candidatos, Publicidad)
- Denuncias ciudadanas anónimas con sistema de apoyo
- Foro del día con votación tipo encuesta
- Sección "El Pueblo Vota" con resultados en vivo
- Artículos individuales con hero banner, compartir por WhatsApp

### Panel Admin (`/admin`)
- Dashboard con KPIs y gráficos (Chart.js)
- CRUD completo: encuestas, noticias, denuncias, foro
- Galería de imágenes organizada por día
- Gestión de estado de denuncias (pendiente → revisada → publicada)
- Exportación CSV de resultados

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
├── context/             # DemoDataContext, AuthContext
├── pages/               # Landing, Votar, Resultados, Noticias, Articulo, Admin
├── services/            # API (demo/producción), Storage (localStorage)
├── types/               # TypeScript interfaces
└── utils/               # format, hash, helpers, validators
css/                     # variables, base, components, landing, admin, noticias, mapa, votar
apps-script/Code.gs      # Google Apps Script backend completo
```

## Google Sheets Backend

El `apps-script/Code.gs` gestiona 8 hojas:

| Hoja | Contenido |
|------|-----------|
| Encuestas | Encuestas con opciones JSON (candidatos + fotos + logos) |
| Votos | Registros de votos con DNI hash, timestamp, región |
| Config | Credenciales admin, configuración del sitio |
| Suscriptores | Newsletter emails |
| Noticias | Artículos con categoría, imagen, autor, fecha |
| Denuncias | Denuncias ciudadanas anónimas |
| Foro | Preguntas del día con opciones y votos |
| Imagenes | URLs de imágenes organizadas por carpeta/día |

### Setup en Apps Script
1. Crear proyecto en [script.google.com](https://script.google.com)
2. Pegar contenido de `apps-script/Code.gs`
3. Ejecutar `setupSheets()` → crea las 8 hojas
4. Ejecutar `poblarEncuestaE01()` → encuesta presidencial con 36 candidatos
5. Ejecutar `generarVotosDemo()` → 873 votos en 14 días
6. Ejecutar `poblarTodoPortalNoticias()` → noticias + denuncias + foro
7. Implementar como Web App (Ejecutar como: yo, Acceso: cualquiera)

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Genera dist/
```

## Deploy

El sitio se despliega automáticamente con GitHub Actions al hacer push a `main`.

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
