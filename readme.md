# 🗳️ EncuestaPe.com — Plataforma de Encuestas Electorales del Perú

> **Plataforma web profesional de encuestas de opinión pública y electoral**, con sistema de votación por DNI, resultados en tiempo real y panel administrativo. Desplegable en GitHub Pages con dominio propio.

---

## 📋 ÍNDICE

1. [Visión del Proyecto](#1-visión-del-proyecto)
2. [Identidad de Marca](#2-identidad-de-marca)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Stack Tecnológico](#4-stack-tecnológico)
5. [Estructura de Archivos](#5-estructura-de-archivos)
6. [Diseño Visual — Lineamientos](#6-diseño-visual--lineamientos)
7. [Página Principal (Landing Page)](#7-página-principal-landing-page)
8. [Sistema de Votación](#8-sistema-de-votación)
9. [Google Sheets — Backend](#9-google-sheets--backend)
10. [Panel Administrativo /admin](#10-panel-administrativo-admin)
11. [Dashboard de Resultados en Tiempo Real](#11-dashboard-de-resultados-en-tiempo-real)
12. [Responsive y Mobile First](#12-responsive-y-mobile-first)
13. [Despliegue en GitHub Pages](#13-despliegue-en-github-pages)
14. [Dominio Propio](#14-dominio-propio)
15. [Instrucciones de Implementación para Claude Code](#15-instrucciones-de-implementación-para-claude-code)

---

## 1. VISIÓN DEL PROYECTO

**EncuestaPe.com** es una plataforma de encuestas electorales y de opinión pública orientada al Perú. Permite a los ciudadanos participar en encuestas activas registrando su DNI (Documento Nacional de Identidad), garantizando un voto único por persona. Los resultados se muestran en tiempo real en la página principal con gráficos animados y datos actualizados.

### Objetivos principales:
- Ofrecer un sitio web profesional, elegante y confiable para encuestas públicas
- Permitir votación con validación de DNI (8 dígitos, un solo voto por persona)
- Almacenar todos los votos en Google Sheets como backend sin servidor
- Mostrar resultados en tiempo real con gráficos interactivos en el landing page
- Proveer un panel de administración protegido en la ruta `/admin` con autenticación
- Desplegar como sitio estático en GitHub Pages con dominio propio `encuestape.com`

### Público objetivo:
- Ciudadanos peruanos interesados en participar en encuestas de opinión
- Medios de comunicación que buscan datos de intención de voto
- Analistas políticos y consultores electorales
- Instituciones que requieren sondeos de opinión pública

---

## 2. IDENTIDAD DE MARCA

### Nombre y dominio
- **Nombre**: EncuestaPe
- **Dominio**: `encuestape.com`
- **Eslogan**: "La voz del Perú en datos"

### Paleta de colores

```
PRIMARIO (Azul Marino Profundo):   #0A1E3D
SECUNDARIO (Azul Institucional):   #1A4B8C
ACENTO (Dorado Peruano):           #D4A012
ACENTO SECUNDARIO (Rojo Bandera):  #D91023
ÉXITO (Verde):                     #1B8C5A
ALERTA (Ámbar):                    #E6A817
ERROR (Rojo):                      #C0392B
FONDO CLARO:                       #F2F4F8
FONDO OSCURO:                      #060E1A
TEXTO PRINCIPAL:                   #0F1C2E
TEXTO SECUNDARIO:                  #5A6B7F
BORDE SUTIL:                       #D8DFE8
```

### Tipografía (Google Fonts)

```
TÍTULOS DISPLAY:    "DM Serif Display", serif
SUBTÍTULOS:         "Outfit", sans-serif (weight 600-700)
CUERPO DE TEXTO:    "Outfit", sans-serif (weight 300-400)
NÚMEROS/DATOS:      "JetBrains Mono", monospace
BOTONES/UI:         "Outfit", sans-serif (weight 500)
```

### Logotipo
- Ícono: Silueta estilizada del mapa del Perú formada por barras de gráfico estadístico
- El mapa se compone de 3-4 barras verticales de diferentes alturas en degradé dorado
- Texto "EncuestaPe" a la derecha, con "Pe" en color dorado #D4A012
- Versión compacta: solo el ícono del mapa-gráfico para favicon y mobile

### Tono visual
- **Estética**: Institucional-editorial, inspirada en medios serios como The Economist, FiveThirtyEight
- **Ambiente**: Profesional, confiable, moderno, con toques peruanos sutiles
- **Fotografía**: Fondos con imágenes del Perú (Plaza de Armas, mapa satelital, paisajes urbanos) con overlays oscuros semitransparentes
- **Iconografía**: Línea fina, monocolor, estilo Lucide o Phosphor Icons

---

## 3. ARQUITECTURA DEL SISTEMA

### Diagrama general

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB PAGES (Frontend)                   │
│                    encuestape.com                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  LANDING PAGE │  │  /votar      │  │  /admin           │  │
│  │  (index.html) │  │  (Sistema de │  │  (Dashboard con   │  │
│  │               │  │   votación)  │  │   autenticación)  │  │
│  │  - Hero       │  │              │  │                   │  │
│  │  - Contadores │  │  - Input DNI │  │  - Login          │  │
│  │  - Encuestas  │  │  - Validar   │  │  - CRUD Encuestas │  │
│  │    activas    │  │  - Selección │  │  - Resultados     │  │
│  │  - Resultados │  │  - Confirmar │  │  - Exportar data  │  │
│  │  - Blog       │  │  - Gracias   │  │  - Configuración  │  │
│  │  - Footer     │  │              │  │                   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────────┘  │
│         │                 │                  │               │
│         └─────────────────┼──────────────────┘               │
│                           │                                  │
│                    FETCH / POST                               │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│              GOOGLE APPS SCRIPT (Backend/API)                 │
│              (Deployed as Web App)                             │
│                                                               │
│  Endpoints:                                                   │
│  GET  ?action=getEncuestas      → Lista encuestas activas     │
│  GET  ?action=getResultados&id= → Resultados de una encuesta  │
│  GET  ?action=getEstadisticas   → Contadores generales        │
│  POST ?action=validarDNI        → Verifica si DNI ya votó     │
│  POST ?action=registrarVoto     → Registra voto + DNI + hora  │
│  POST ?action=loginAdmin        → Autenticación admin         │
│  GET  ?action=getAdminData      → Data completa para admin    │
│  POST ?action=crearEncuesta     → Crear nueva encuesta        │
│  POST ?action=editarEncuesta    → Editar encuesta existente   │
│  POST ?action=cerrarEncuesta    → Cerrar/pausar encuesta      │
│                                                               │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────┐
│                GOOGLE SHEETS (Base de Datos)                   │
│                                                                │
│  Hoja: "Encuestas"                                             │
│  ┌──────┬──────────────────┬────────┬───────────┬──────────┐  │
│  │  ID  │ Título           │ Estado │ Opciones  │ Fecha    │  │
│  ├──────┼──────────────────┼────────┼───────────┼──────────┤  │
│  │  E01 │ Intención de voto│ activa │ JSON[...] │ 2026-02  │  │
│  │  E02 │ Aprobación alcal │ activa │ JSON[...] │ 2026-02  │  │
│  │  E03 │ Encuesta cerrada │cerrada │ JSON[...] │ 2026-01  │  │
│  └──────┴──────────────────┴────────┴───────────┴──────────┘  │
│                                                                │
│  Hoja: "Votos"                                                 │
│  ┌──────┬────────────┬──────────┬───────────┬───────────────┐ │
│  │EncID │ DNI (hash) │ Opción   │ Timestamp │ Región        │ │
│  ├──────┼────────────┼──────────┼───────────┼───────────────┤ │
│  │ E01  │ a3f8c...   │ Opción A │ 2026-02-23│ Puno          │ │
│  │ E01  │ b7d2e...   │ Opción B │ 2026-02-23│ Lima          │ │
│  └──────┴────────────┴──────────┴───────────┴───────────────┘ │
│                                                                │
│  Hoja: "Config"                                                │
│  ┌──────────────────┬──────────────────────────────┐          │
│  │ admin_user       │ admin                        │          │
│  │ admin_pass_hash  │ SHA256(contraseña)           │          │
│  │ site_title       │ EncuestaPe                   │          │
│  │ whatsapp         │ +51XXXXXXXXX                 │          │
│  └──────────────────┴──────────────────────────────┘          │
│                                                                │
│  URL: https://docs.google.com/spreadsheets/d/               │
│  1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ/edit          │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Flujo de usuario para votar

```
1. Usuario llega al Landing Page → ve encuestas activas con resultados parciales
2. Hace clic en "Participar" en una encuesta activa
3. Se abre el formulario de votación (sección /votar o modal)
4. PASO 1: Ingresa su DNI (8 dígitos)
   → Se envía POST a Apps Script → valida formato
   → Verifica en hoja "Votos" si ese DNI (hash) ya votó en esta encuesta
   → Si ya votó: muestra mensaje "Ya registraste tu voto en esta encuesta"
   → Si no ha votado: continúa al paso 2
5. PASO 2: Muestra las opciones de la encuesta
   → Usuario selecciona su opción
6. PASO 3: Pantalla de confirmación
   → "¿Confirmas tu voto por [Opción X]?"
   → Botón "Confirmar Voto"
7. Se envía POST con: encuesta_id, dni_hash, opción, timestamp, región
8. Apps Script registra en hoja "Votos"
9. Se muestra pantalla de agradecimiento con resultados actualizados
10. El landing page se actualiza automáticamente (polling cada 30 segundos)
```

---

## 4. STACK TECNOLÓGICO

### Frontend (Sitio estático — GitHub Pages)

| Tecnología | Uso | Detalle |
|---|---|---|
| **HTML5 semántico** | Estructura | Páginas index.html, votar/index.html, admin/index.html |
| **CSS3 puro + Variables CSS** | Estilos | Sin frameworks CSS. Custom properties para temas y colores |
| **JavaScript Vanilla (ES6+)** | Lógica | Módulos ES6, fetch API, DOM manipulation, routing por hash |
| **Chart.js 4.x** | Gráficos | Barras horizontales, donas, líneas para resultados en tiempo real |
| **AOS.js** | Animaciones scroll | Fade-up, fade-in para secciones del landing |
| **Google Fonts** | Tipografía | DM Serif Display + Outfit + JetBrains Mono |
| **Lucide Icons (CDN)** | Iconografía | Íconos SVG ligeros y consistentes |

### Backend (Google Apps Script)

| Tecnología | Uso | Detalle |
|---|---|---|
| **Google Apps Script** | API/Backend | Desplegado como Web App con acceso "Anyone" |
| **Google Sheets** | Base de datos | Hojas: Encuestas, Votos, Config |
| **SHA-256 (JS)** | Hashing DNI | Los DNI se almacenan hasheados, nunca en texto plano |
| **CORS handling** | Seguridad | Apps Script maneja CORS automáticamente como Web App |

### Despliegue

| Servicio | Uso |
|---|---|
| **GitHub Pages** | Hosting del frontend estático |
| **GitHub Actions** | CI/CD automático en push a main |
| **Dominio propio** | encuestape.com → CNAME a GitHub Pages |
| **Google Apps Script Web App** | Backend API público |

---

## 5. ESTRUCTURA DE ARCHIVOS

```
encuestape.com/
│
├── index.html                    # Landing page principal
├── CNAME                         # Archivo para dominio propio (encuestape.com)
├── README.md                     # Este archivo
├── .nojekyll                     # Evitar procesamiento Jekyll en GitHub Pages
│
├── votar/
│   └── index.html                # Página del sistema de votación
│
├── admin/
│   └── index.html                # Panel administrativo con login
│
├── resultados/
│   └── index.html                # Página pública de resultados detallados
│
├── css/
│   ├── variables.css             # Variables CSS globales (colores, fuentes, espaciado)
│   ├── base.css                  # Reset, tipografía base, utilidades
│   ├── components.css            # Botones, cards, badges, modales, formularios
│   ├── landing.css               # Estilos específicos del landing page
│   ├── votar.css                 # Estilos del formulario de votación
│   ├── admin.css                 # Estilos del panel administrativo
│   └── responsive.css            # Media queries y ajustes mobile
│
├── js/
│   ├── config.js                 # URLs de API, constantes globales, configuración
│   ├── api.js                    # Módulo de comunicación con Google Apps Script
│   ├── landing.js                # Lógica del landing: cargar encuestas, contadores, resultados
│   ├── votar.js                  # Lógica del flujo de votación: DNI → voto → confirmación
│   ├── admin.js                  # Lógica del panel admin: login, CRUD, dashboard
│   ├── charts.js                 # Configuración y renderizado de gráficos Chart.js
│   └── utils.js                  # Funciones utilitarias: hash SHA-256, formateo, validaciones
│
├── assets/
│   ├── logo.svg                  # Logo principal EncuestaPe
│   ├── logo-white.svg            # Logo versión blanca para fondos oscuros
│   ├── favicon.ico               # Favicon
│   ├── favicon-32.png            # Favicon 32x32
│   ├── apple-touch-icon.png      # Ícono para iOS
│   ├── og-image.jpg              # Imagen para Open Graph (compartir en RRSS)
│   ├── hero-bg.jpg               # Imagen de fondo del hero (Perú, institucional)
│   └── pattern.svg               # Patrón decorativo para fondos de secciones
│
├── apps-script/
│   ├── Code.gs                   # Google Apps Script principal (copiar a Apps Script)
│   └── README-SETUP.md           # Instrucciones para configurar el Apps Script
│
└── .github/
    └── workflows/
        └── deploy.yml            # GitHub Actions para despliegue automático
```

---

## 6. DISEÑO VISUAL — LINEAMIENTOS

### Estética general
- **Dirección**: Editorial institucional con alma peruana. Inspirado en plataformas serias como FiveThirtyEight y The Economist, pero con calidez y color peruano.
- **Diferenciador memorable**: El efecto de "datos vivos" — números que se actualizan con animación suave, barras que crecen en tiempo real, contadores que pulsan. La sensación de que el sitio está vivo y la democracia está en movimiento.

### Fondos y texturas
- Hero: Fotografía del Perú (paisaje urbano o institucional) con overlay degradé de `#060E1A` al 85% opacidad + patrón geométrico sutil (líneas diagonales finas en 3% opacidad)
- Secciones alternas: Fondo `#F2F4F8` (claro) y `#FFFFFF` (blanco) para ritmo visual
- Sección de resultados: Fondo `#060E1A` (oscuro) con texto claro para contraste dramático
- Bordes de cards: `1px solid #D8DFE8` con `box-shadow: 0 2px 12px rgba(10,30,61,0.06)`

### Botones

```css
/* Botón primario */
.btn-primary {
  background: #D4A012;
  color: #0A1E3D;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  padding: 14px 32px;
  border-radius: 6px;
  border: none;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 0.85rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(212, 160, 18, 0.3);
}
.btn-primary:hover {
  background: #B8890F;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 160, 18, 0.4);
}

/* Botón secundario */
.btn-secondary {
  background: transparent;
  color: #FFFFFF;
  border: 1.5px solid rgba(255,255,255,0.4);
  padding: 14px 32px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}
.btn-secondary:hover {
  border-color: #D4A012;
  color: #D4A012;
}
```

### Cards de encuestas

```css
.encuesta-card {
  background: #FFFFFF;
  border: 1px solid #D8DFE8;
  border-radius: 12px;
  padding: 28px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.encuesta-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #D4A012, #1A4B8C);
}
.encuesta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(10, 30, 61, 0.12);
  border-color: #1A4B8C;
}
```

### Animaciones clave

```css
/* Contadores numéricos — efecto "dato vivo" */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Barras de resultados que crecen */
@keyframes barGrow {
  from { width: 0%; }
  to { width: var(--bar-width); }
}

/* Pulso sutil en badge "EN VIVO" */
@keyframes livePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(27, 140, 90, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(27, 140, 90, 0); }
}

.badge-live::before {
  content: '';
  width: 8px;
  height: 8px;
  background: #1B8C5A;
  border-radius: 50%;
  animation: livePulse 2s infinite;
}
```

---

## 7. PÁGINA PRINCIPAL (LANDING PAGE)

### Estructura completa del `index.html`

#### SECCIÓN 1 — NAVBAR

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo EncuestaPe]        Inicio  Encuestas  Resultados  Contacto│
│                                                    [🔴 EN VIVO]  │
└──────────────────────────────────────────────────────────────────┘
```

- Navbar fija (sticky) con fondo transparente que se vuelve `#0A1E3D` sólido al hacer scroll
- Logo a la izquierda, links de navegación a la derecha
- Badge "EN VIVO" con pulso animado cuando hay encuestas activas
- Transición suave de transparente a sólido: `backdrop-filter: blur(12px)`
- Mobile: hamburguesa con menú slide-in desde la derecha

#### SECCIÓN 2 — HERO BANNER

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Fondo: foto Perú + overlay azul oscuro 85% + patrón diagonal] │
│                                                                  │
│              LA VOZ DEL PERÚ                                     │
│              EN DATOS                                            │
│                                                                  │
│              Participa en las encuestas que definen              │
│              el futuro del país. Tu opinión importa.             │
│                                                                  │
│        [ PARTICIPAR AHORA ]     [ VER RESULTADOS ]               │
│                                                                  │
│                                                                  │
│   ┌─ Dato destacado ─────────────────────────────────────────┐   │
│   │ 📊 Encuesta activa: Intención de voto 2026 — 2,418      │   │
│   │    participantes y contando...                            │   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Título principal: `DM Serif Display`, 56px desktop / 36px mobile, color blanco
- Subtítulo: `Outfit` 300, 20px, color rgba(255,255,255,0.7)
- Botón primario "PARTICIPAR AHORA": dorado `#D4A012`
- Botón secundario "VER RESULTADOS": borde blanco semitransparente
- Dato destacado en barra inferior del hero: fondo `rgba(255,255,255,0.08)`, backdrop-blur
- Altura hero: `min-height: 90vh` desktop, `min-height: 70vh` mobile
- Animaciones: título fade-up 0.6s, subtítulo fade-up 0.8s, botones fade-up 1.0s, dato 1.2s

#### SECCIÓN 3 — CONTADORES DE IMPACTO

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│   │  12,847   │  │    8+     │  │   24+     │  │   98.2%   │   │
│   │  Votos    │  │ Encuestas │  │ Regiones  │  │ Precisión │   │
│   │ registrados│  │ realizadas│  │ cubiertas │  │ verificada│   │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Fondo: `#FFFFFF` con borde superior `4px solid #D4A012`
- Números: `JetBrains Mono`, 42px, weight 700, color `#0A1E3D`
- Animación: conteo progresivo (countUp) al entrar en viewport con IntersectionObserver
- Los valores se cargan dinámicamente desde Google Sheets (hoja Config o calculados de Votos)
- Separadores verticales sutiles entre contadores en desktop

#### SECCIÓN 4 — ENCUESTAS ACTIVAS

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ENCUESTAS ACTIVAS                                              │
│   Participa y haz que tu voz cuente                              │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│  │▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│  │▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔│ │
│   │  [🟢 ACTIVA]    │  │  [🟢 ACTIVA]    │  │  [⚫ CERRADA]   │ │
│   │                 │  │                 │  │                 │ │
│   │  Intención de   │  │  Aprobación de  │  │  Satisfacción   │ │
│   │  voto 2026      │  │  gestión        │  │  ciudadana      │ │
│   │  Elecciones     │  │  municipal      │  │  2025-II        │ │
│   │  Generales      │  │  Puno 2026      │  │                 │ │
│   │                 │  │                 │  │                 │ │
│   │  ████████░░ 68% │  │  ██████░░░░ 42% │  │  ██████████ 100%│ │
│   │  2,418 / 3,500  │  │  890 / 2,000    │  │  1,200 / 1,200  │ │
│   │                 │  │                 │  │                 │ │
│   │ [PARTICIPAR →]  │  │ [PARTICIPAR →]  │  │ [VER RESULTADOS]│ │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Fondo sección: `#F2F4F8`
- Título sección: `DM Serif Display`, 36px, centrado
- Cards con borde superior degradé (dorado → azul)
- Badge de estado:
  - `ACTIVA`: fondo `#E8F5E9`, texto `#1B8C5A`, punto verde pulsante
  - `CERRADA`: fondo `#ECEFF1`, texto `#5A6B7F`
  - `PRÓXIMA`: fondo `#FFF8E1`, texto `#E6A817`
- Barra de progreso: fondo `#E8ECF2`, relleno degradé `#1A4B8C` → `#D4A012`
- Datos cargados dinámicamente desde API: `GET ?action=getEncuestas`
- Auto-refresh cada 30 segundos

#### SECCIÓN 5 — RESULTADOS EN TIEMPO REAL (Preview)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Fondo oscuro #060E1A]                                          │
│                                                                  │
│   RESULTADOS EN TIEMPO REAL                    [● EN VIVO]       │
│                                                                  │
│   Intención de voto — Elecciones Generales 2026                  │
│                                                                  │
│   Candidato A (Partido X)                                        │
│   ████████████████████████████████░░░░░  35.2%    (851 votos)    │
│                                                                  │
│   Candidato B (Partido Y)                                        │
│   ██████████████████████████░░░░░░░░░░  28.7%    (694 votos)     │
│                                                                  │
│   Candidato C (Partido Z)                                        │
│   █████████████████░░░░░░░░░░░░░░░░░░  18.1%    (438 votos)     │
│                                                                  │
│   Indecisos / No precisa                                         │
│   ████████████░░░░░░░░░░░░░░░░░░░░░░░  12.4%    (300 votos)     │
│                                                                  │
│   Otros candidatos                                               │
│   ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5.6%    (135 votos)    │
│                                                                  │
│   Total: 2,418 participantes                                     │
│   Última actualización: hace 45 segundos                         │
│                                                                  │
│   [ VER TODOS LOS RESULTADOS → ]                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Fondo: `#060E1A` con patrón de puntos sutiles
- Barras: degradé de `#D4A012` a `#1A4B8C`, altura 36px, border-radius 4px
- Porcentajes: `JetBrains Mono`, bold, blanco
- Conteo de votos: `Outfit` 300, color `rgba(255,255,255,0.5)`
- Badge "EN VIVO": punto verde pulsante + texto
- Animación: barras crecen de 0% a su valor real al entrar en viewport
- Se renderiza con Chart.js (barras horizontales) o custom HTML/CSS bars
- Datos: `GET ?action=getResultados&id=E01`
- Auto-refresh cada 30 segundos con transición suave de valores

#### SECCIÓN 6 — CÓMO FUNCIONA

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ¿CÓMO PARTICIPAR?                                              │
│                                                                  │
│   ┌──────┐          ┌──────┐          ┌──────┐                   │
│   │  01  │ ──────── │  02  │ ──────── │  03  │                   │
│   │      │          │      │          │      │                   │
│   │ 🪪   │          │ 🗳️   │          │ 📊   │                   │
│   │      │          │      │          │      │                   │
│   │Ingresa│         │Emite  │         │  Ve   │                  │
│   │tu DNI │         │tu voto│         │ los   │                  │
│   │       │         │       │         │result.│                  │
│   └──────┘          └──────┘          └──────┘                   │
│                                                                  │
│   Registra tu       Selecciona tu     Los resultados se          │
│   documento de      opción de forma   actualizan al              │
│   identidad para    segura y          instante en la             │
│   verificar tu      confidencial.     plataforma.                │
│   participación     Un voto por DNI.                             │
│   única.                                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Fondo: `#FFFFFF`
- Números de paso: círculos de 56px, fondo `#0A1E3D`, texto `#D4A012`, `DM Serif Display`
- Línea conectora entre pasos: línea punteada `#D8DFE8`
- Íconos: Lucide Icons, 28px, color `#1A4B8C`
- Animación: cada paso aparece secuencialmente con AOS fade-up y delay incremental

#### SECCIÓN 7 — CONFIANZA Y CREDIBILIDAD

```
┌──────────────────────────────────────────────────────────────────┐
│  [Fondo #F2F4F8]                                                 │
│                                                                  │
│   TRANSPARENCIA Y METODOLOGÍA                                    │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │ "Nuestras encuestas utilizan metodología rigurosa con     │   │
│   │  verificación por DNI para garantizar la representatividad│   │
│   │  de cada muestra. Todos los datos son públicos y          │   │
│   │  verificables en tiempo real."                            │   │
│   │                                                — EncuestaPe│   │
│   └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│   🔒 Voto único       📊 Datos abiertos     🛡️ DNI verificado    │
│   por DNI                y transparentes       y hasheado        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### SECCIÓN 8 — NEWSLETTER + CTA

```
┌──────────────────────────────────────────────────────────────────┐
│  [Fondo degradé: #0A1E3D → #1A4B8C]                             │
│                                                                  │
│   RECIBE LOS RESULTADOS ANTES QUE NADIE                          │
│                                                                  │
│   Suscríbete y te enviaremos los resultados de cada              │
│   encuesta apenas se publiquen.                                  │
│                                                                  │
│   ┌──────────────────────────────────┐  ┌────────────────┐       │
│   │  tucorreo@ejemplo.com            │  │  SUSCRIBIRME   │       │
│   └──────────────────────────────────┘  └────────────────┘       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Input: fondo `rgba(255,255,255,0.1)`, borde `rgba(255,255,255,0.2)`, texto blanco
- Botón: dorado `#D4A012`, texto oscuro
- Los emails se guardan en una hoja "Suscriptores" del Google Sheet

#### SECCIÓN 9 — FOOTER

```
┌──────────────────────────────────────────────────────────────────┐
│  [Fondo #060E1A]                                                 │
│                                                                  │
│  [Logo blanco EncuestaPe]     Navegación    Contacto    Legal    │
│                               - Inicio      - Email     - Términos│
│  La voz del Perú              - Encuestas   - WhatsApp  - Privac. │
│  en datos.                    - Resultados  - Teléfono  - Cookies │
│                               - Nosotros                         │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│  © 2026 EncuestaPe.com — Todos los derechos reservados           │
│  [FB] [X] [IG] [LinkedIn]                                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### ELEMENTO FLOTANTE — WHATSAPP

```css
.whatsapp-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: #25D366;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.4);
  z-index: 1000;
  transition: transform 0.3s ease;
}
.whatsapp-float:hover {
  transform: scale(1.1);
}
```

---

## 8. SISTEMA DE VOTACIÓN

### Página `/votar/index.html`

El sistema de votación es un flujo multi-paso elegante y seguro.

### Flujo visual detallado

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Logo EncuestaPe]                              [← Volver]       │
│                                                                  │
│  ═══════════════════════════════════════════════════════          │
│  PASO 1 de 3 ——————————●○○                                       │
│  ═══════════════════════════════════════════════════════          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐      │
│  │                                                        │      │
│  │   VERIFICA TU IDENTIDAD                                │      │
│  │                                                        │      │
│  │   Ingresa tu DNI para participar en esta encuesta.     │      │
│  │   Tu documento será verificado y encriptado.           │      │
│  │   No almacenamos tu DNI en texto plano.                │      │
│  │                                                        │      │
│  │   ┌────────────────────────────────────────────┐       │      │
│  │   │  🪪  Número de DNI                         │       │      │
│  │   │     ________________________________________│       │      │
│  │   │     76543210                                │       │      │
│  │   └────────────────────────────────────────────┘       │      │
│  │                                                        │      │
│  │   ✓ 8 dígitos detectados                               │      │
│  │                                                        │      │
│  │                          [ VERIFICAR DNI → ]           │      │
│  │                                                        │      │
│  │   🔒 Tu DNI se encripta antes de enviarse.             │      │
│  │      Privacidad garantizada.                           │      │
│  │                                                        │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Paso 1 — Verificación de DNI

**Input de DNI:**
- Campo numérico, máximo 8 dígitos
- Validación en tiempo real: muestra check verde al completar 8 dígitos
- Feedback visual: borde cambia de `#D8DFE8` a `#1B8C5A` cuando es válido
- Placeholder: "Ingresa tu DNI de 8 dígitos"
- Ícono de candado junto al campo

**Lógica de verificación:**
```javascript
// 1. Validar formato (8 dígitos numéricos)
// 2. Generar hash SHA-256 del DNI en el frontend
// 3. Enviar POST a Apps Script:
//    { action: "validarDNI", encuesta_id: "E01", dni_hash: "a3f8c..." }
// 4. Apps Script busca en hoja "Votos" si existe ese hash para esa encuesta
// 5. Respuesta: { permitido: true/false, mensaje: "..." }
```

**Si el DNI ya votó:**
```
┌─────────────────────────────────────────┐
│  ⚠️ YA PARTICIPASTE                     │
│                                         │
│  Este DNI ya registró su voto en        │
│  esta encuesta. Solo se permite una     │
│  participación por documento.           │
│                                         │
│  [ VER RESULTADOS ]  [ VOLVER AL INICIO]│
└─────────────────────────────────────────┘
```

### Paso 2 — Selección de voto

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  PASO 2 de 3 ——————————————●○                                    │
│                                                                  │
│  INTENCIÓN DE VOTO — ELECCIONES GENERALES 2026                   │
│                                                                  │
│  ¿Por quién votaría si las elecciones fueran hoy?                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  ○  Candidato A — Partido X                             │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │  ●  Candidato B — Partido Y                    ✓        │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │  ○  Candidato C — Partido Z                             │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │  ○  Candidato D — Partido W                             │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │  ○  Voto en blanco / No precisa                         │     │
│  ├─────────────────────────────────────────────────────────┤     │
│  │  ○  Aún no he decidido                                  │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  [ ← ANTERIOR ]                        [ SIGUIENTE → ]          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Diseño de opciones:**
- Radio buttons custom: círculos de 20px, borde `#D8DFE8`, seleccionado `#1A4B8C` con relleno
- Opción seleccionada: fondo `#EBF2FA`, borde izquierdo `4px solid #1A4B8C`
- Hover: fondo `#F2F4F8`
- Transición suave en selección
- Debe seleccionar una opción para continuar (botón deshabilitado si no hay selección)

### Paso 3 — Confirmación

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  PASO 3 de 3 ——————————————————●                                 │
│                                                                  │
│  CONFIRMA TU VOTO                                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │                                                         │     │
│  │  Encuesta:  Intención de voto 2026                      │     │
│  │  Tu voto:   Candidato B — Partido Y                     │     │
│  │                                                         │     │
│  │  ⚠️ Esta acción no se puede deshacer.                   │     │
│  │     Una vez confirmado, no podrás cambiar tu voto.      │     │
│  │                                                         │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                  │
│  [ ← CAMBIAR VOTO ]              [ ✓ CONFIRMAR VOTO ]           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Paso 4 — Agradecimiento y resultados

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│              ✓                                                    │
│                                                                  │
│  ¡GRACIAS POR PARTICIPAR!                                        │
│                                                                  │
│  Tu voto ha sido registrado exitosamente.                        │
│                                                                  │
│  ┌─ Resultados actuales ─────────────────────────────────────┐   │
│  │  Candidato A  ████████████████      35.2%                 │   │
│  │  Candidato B  ████████████          28.7%                 │   │
│  │  Candidato C  ████████              18.1%                 │   │
│  │  Otros        ██████                18.0%                 │   │
│  │                                                           │   │
│  │  Total: 2,419 participantes                               │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [ COMPARTIR EN WHATSAPP ]  [ COMPARTIR EN FACEBOOK ]            │
│  [ VOLVER AL INICIO ]                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 9. GOOGLE SHEETS — BACKEND

### Configuración de la hoja de cálculo

**URL del Spreadsheet:**
```
https://docs.google.com/spreadsheets/d/1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ/edit
```

### Estructura de hojas (pestañas)

#### Hoja 1: `Encuestas`

| Columna | Campo | Tipo | Ejemplo |
|---|---|---|---|
| A | id | String | E01 |
| B | titulo | String | Intención de voto 2026 |
| C | descripcion | String | ¿Por quién votaría si las elecciones... |
| D | estado | String | activa / cerrada / proxima |
| E | opciones | JSON String | `["Candidato A - Partido X","Candidato B - Partido Y","Voto en blanco"]` |
| F | meta_votos | Number | 3500 |
| G | fecha_inicio | Date | 2026-02-01 |
| H | fecha_fin | Date | 2026-03-15 |
| I | categoria | String | ELECCIONES / MUNICIPAL / REGIONAL |
| J | visible | Boolean | TRUE / FALSE |

#### Hoja 2: `Votos`

| Columna | Campo | Tipo | Ejemplo |
|---|---|---|---|
| A | encuesta_id | String | E01 |
| B | dni_hash | String | a3f8c7b2e9d... (SHA-256) |
| C | opcion | String | Candidato B - Partido Y |
| D | timestamp | DateTime | 2026-02-23T14:32:00 |
| E | region | String | Puno (opcional, auto-detectado) |

#### Hoja 3: `Config`

| Columna A (clave) | Columna B (valor) |
|---|---|
| admin_user | admin |
| admin_pass_hash | (SHA-256 de la contraseña) |
| site_title | EncuestaPe |
| site_slogan | La voz del Perú en datos |
| whatsapp | +51999999999 |
| contact_email | contacto@encuestape.com |
| total_encuestas | (se calcula automático) |
| total_votos | (se calcula automático) |
| regiones_cubiertas | 24 |

#### Hoja 4: `Suscriptores`

| Columna | Campo |
|---|---|
| A | email |
| B | fecha_suscripcion |

### Google Apps Script — Código principal (`Code.gs`)

El archivo `apps-script/Code.gs` debe contener:

```javascript
// ============================================
// EncuestaPe.com — Google Apps Script Backend
// ============================================

const SPREADSHEET_ID = '1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ';
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

// --- CORS Handler ---
function doGet(e) {
  const action = e.parameter.action;
  let result;

  switch(action) {
    case 'getEncuestas':
      result = getEncuestas();
      break;
    case 'getResultados':
      result = getResultados(e.parameter.id);
      break;
    case 'getEstadisticas':
      result = getEstadisticas();
      break;
    case 'getAdminData':
      result = getAdminData(e.parameter.token);
      break;
    default:
      result = { error: 'Acción no válida' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  let result;

  switch(action) {
    case 'validarDNI':
      result = validarDNI(data.encuesta_id, data.dni_hash);
      break;
    case 'registrarVoto':
      result = registrarVoto(data);
      break;
    case 'loginAdmin':
      result = loginAdmin(data.user, data.pass_hash);
      break;
    case 'crearEncuesta':
      result = crearEncuesta(data);
      break;
    case 'editarEncuesta':
      result = editarEncuesta(data);
      break;
    case 'cerrarEncuesta':
      result = cerrarEncuesta(data.id);
      break;
    case 'suscribir':
      result = suscribirEmail(data.email);
      break;
    default:
      result = { error: 'Acción no válida' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Funciones principales ---

function getEncuestas() {
  const sheet = ss.getSheetByName('Encuestas');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const encuestas = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[9] === true || row[9] === 'TRUE') { // visible
      const votosSheet = ss.getSheetByName('Votos');
      const votos = votosSheet.getDataRange().getValues();
      const totalVotos = votos.filter(v => v[0] === row[0]).length;

      encuestas.push({
        id: row[0],
        titulo: row[1],
        descripcion: row[2],
        estado: row[3],
        opciones: JSON.parse(row[4]),
        meta_votos: row[5],
        fecha_inicio: row[6],
        fecha_fin: row[7],
        categoria: row[8],
        total_votos: totalVotos
      });
    }
  }
  return { encuestas };
}

function getResultados(encuestaId) {
  const votosSheet = ss.getSheetByName('Votos');
  const votos = votosSheet.getDataRange().getValues();
  const encuestaVotos = votos.filter(v => v[0] === encuestaId);

  const conteo = {};
  encuestaVotos.forEach(v => {
    const opcion = v[2];
    conteo[opcion] = (conteo[opcion] || 0) + 1;
  });

  const total = encuestaVotos.length;
  const resultados = Object.entries(conteo).map(([opcion, cantidad]) => ({
    opcion,
    cantidad,
    porcentaje: total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0
  }));

  resultados.sort((a, b) => b.cantidad - a.cantidad);

  return {
    encuesta_id: encuestaId,
    total_votos: total,
    resultados,
    ultima_actualizacion: new Date().toISOString()
  };
}

function validarDNI(encuestaId, dniHash) {
  const votosSheet = ss.getSheetByName('Votos');
  const votos = votosSheet.getDataRange().getValues();
  const yaVoto = votos.some(v => v[0] === encuestaId && v[1] === dniHash);

  return {
    permitido: !yaVoto,
    mensaje: yaVoto
      ? 'Este DNI ya registró su voto en esta encuesta.'
      : 'DNI verificado. Puedes proceder a votar.'
  };
}

function registrarVoto(data) {
  const votosSheet = ss.getSheetByName('Votos');

  // Doble verificación
  const votos = votosSheet.getDataRange().getValues();
  const yaVoto = votos.some(v => v[0] === data.encuesta_id && v[1] === data.dni_hash);

  if (yaVoto) {
    return { exito: false, mensaje: 'Voto duplicado detectado.' };
  }

  votosSheet.appendRow([
    data.encuesta_id,
    data.dni_hash,
    data.opcion,
    new Date().toISOString(),
    data.region || 'No especificada'
  ]);

  return { exito: true, mensaje: 'Voto registrado exitosamente.' };
}

function getEstadisticas() {
  const votosSheet = ss.getSheetByName('Votos');
  const encuestasSheet = ss.getSheetByName('Encuestas');
  const totalVotos = Math.max(0, votosSheet.getLastRow() - 1);
  const totalEncuestas = Math.max(0, encuestasSheet.getLastRow() - 1);

  return {
    total_votos: totalVotos,
    total_encuestas: totalEncuestas,
    regiones: 24,
    precision: 98.2
  };
}

function loginAdmin(user, passHash) {
  const configSheet = ss.getSheetByName('Config');
  const config = configSheet.getDataRange().getValues();
  const configMap = {};
  config.forEach(row => { configMap[row[0]] = row[1]; });

  if (user === configMap['admin_user'] && passHash === configMap['admin_pass_hash']) {
    // Token simple (en producción usar algo más robusto)
    const token = Utilities.getUuid();
    // Guardar token temporalmente
    const props = PropertiesService.getScriptProperties();
    props.setProperty('admin_token', token);
    props.setProperty('admin_token_time', new Date().getTime().toString());

    return { exito: true, token };
  }

  return { exito: false, mensaje: 'Credenciales inválidas.' };
}

function getAdminData(token) {
  const props = PropertiesService.getScriptProperties();
  const savedToken = props.getProperty('admin_token');
  const tokenTime = parseInt(props.getProperty('admin_token_time') || '0');
  const now = new Date().getTime();

  // Token válido por 4 horas
  if (token !== savedToken || (now - tokenTime) > 4 * 60 * 60 * 1000) {
    return { error: 'No autorizado' };
  }

  return {
    encuestas: getEncuestas().encuestas,
    estadisticas: getEstadisticas(),
    votos_recientes: getVotosRecientes()
  };
}

function getVotosRecientes() {
  const sheet = ss.getSheetByName('Votos');
  const data = sheet.getDataRange().getValues();
  const ultimos = data.slice(-20).reverse();
  return ultimos.map(v => ({
    encuesta_id: v[0],
    opcion: v[2],
    timestamp: v[3],
    region: v[4]
  }));
}

function crearEncuesta(data) {
  const sheet = ss.getSheetByName('Encuestas');
  const lastRow = sheet.getLastRow();
  const newId = 'E' + String(lastRow).padStart(2, '0');

  sheet.appendRow([
    newId,
    data.titulo,
    data.descripcion,
    data.estado || 'activa',
    JSON.stringify(data.opciones),
    data.meta_votos || 1000,
    new Date().toISOString(),
    data.fecha_fin || '',
    data.categoria || 'GENERAL',
    true
  ]);

  return { exito: true, id: newId };
}

function editarEncuesta(data) {
  const sheet = ss.getSheetByName('Encuestas');
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      if (data.titulo) sheet.getRange(i+1, 2).setValue(data.titulo);
      if (data.descripcion) sheet.getRange(i+1, 3).setValue(data.descripcion);
      if (data.estado) sheet.getRange(i+1, 4).setValue(data.estado);
      if (data.opciones) sheet.getRange(i+1, 5).setValue(JSON.stringify(data.opciones));
      return { exito: true };
    }
  }
  return { exito: false, mensaje: 'Encuesta no encontrada.' };
}

function cerrarEncuesta(id) {
  return editarEncuesta({ id, estado: 'cerrada' });
}

function suscribirEmail(email) {
  const sheet = ss.getSheetByName('Suscriptores');
  sheet.appendRow([email, new Date().toISOString()]);
  return { exito: true };
}
```

### Pasos para configurar Apps Script

1. Ir a `https://script.google.com` y crear un nuevo proyecto
2. Copiar todo el código de `apps-script/Code.gs` al editor
3. Actualizar `SPREADSHEET_ID` con el ID del spreadsheet
4. Deploy → New deployment → Web App
5. Configurar:
   - Execute as: "Me"
   - Who has access: "Anyone"
6. Copiar la URL del deployment (será la `API_URL` en `js/config.js`)
7. Cada vez que se modifique el código, crear un NEW deployment

---

## 10. PANEL ADMINISTRATIVO `/admin`

### Pantalla de login

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Fondo oscuro #060E1A con patrón geométrico]                    │
│                                                                  │
│         ┌───────────────────────────────────────┐                │
│         │                                       │                │
│         │   [Logo EncuestaPe]                    │                │
│         │                                       │                │
│         │   PANEL DE ADMINISTRACIÓN              │                │
│         │                                       │                │
│         │   Usuario                              │                │
│         │   ┌───────────────────────────┐       │                │
│         │   │ admin                     │       │                │
│         │   └───────────────────────────┘       │                │
│         │                                       │                │
│         │   Contraseña                           │                │
│         │   ┌───────────────────────────┐       │                │
│         │   │ ••••••••                  │       │                │
│         │   └───────────────────────────┘       │                │
│         │                                       │                │
│         │   [ INGRESAR ]                         │                │
│         │                                       │                │
│         └───────────────────────────────────────┘                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

- Card centrada: fondo `#FFFFFF`, border-radius 16px, shadow dramático
- Input fields: estilo consistente con el resto del sitio
- Botón: dorado `#D4A012`, full-width dentro de la card
- Autenticación: hash SHA-256 de la contraseña se compara en Apps Script
- Token de sesión almacenado en sessionStorage (se pierde al cerrar pestaña)

### Dashboard principal (post-login)

```
┌──────────────────────────────────────────────────────────────────┐
│  [Sidebar oscuro]    DASHBOARD — EncuestaPe Admin                │
│                                                                  │
│  ┌────────────┐  ┌──────────────────────────────────────────────┐│
│  │             │  │                                              ││
│  │  📊 Dashboard│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    ││
│  │  📋 Encuestas│  │  │  12,847  │ │  8       │ │  3       │    ││
│  │  📈 Resultados│  │  │  Total   │ │  Total   │ │ Activas  │    ││
│  │  ⚙️ Config  │  │  │  votos   │ │ encuestas│ │  ahora   │    ││
│  │             │  │  └──────────┘ └──────────┘ └──────────┘    ││
│  │             │  │                                              ││
│  │  [Cerrar    │  │  VOTOS RECIENTES                             ││
│  │   sesión]   │  │  ┌──────────────────────────────────────┐   ││
│  │             │  │  │ E01 │ Candidato B │ hace 2 min │ Puno│   ││
│  │             │  │  │ E01 │ Candidato A │ hace 5 min │ Lima│   ││
│  │             │  │  │ E02 │ Opción 3    │ hace 8 min │ Arequipa││
│  │             │  │  └──────────────────────────────────────┘   ││
│  │             │  │                                              ││
│  │             │  │  GRÁFICO DE VOTOS POR HORA (Línea)           ││
│  │             │  │  ┌──────────────────────────────────────┐   ││
│  │             │  │  │  📈 (Chart.js line chart)             │   ││
│  │             │  │  └──────────────────────────────────────┘   ││
│  └────────────┘  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Secciones del admin

#### A. Dashboard
- KPIs en cards: total votos, total encuestas, encuestas activas, suscriptores
- Tabla de votos recientes (últimos 20) con auto-refresh
- Gráfico de línea: votos por hora del día actual
- Gráfico de dona: distribución de votos por encuesta

#### B. Gestión de encuestas
- Lista de todas las encuestas con estado, fecha, votos
- Botón "Nueva encuesta" → formulario modal:
  - Título, descripción, categoría
  - Campo dinámico para agregar opciones (add/remove)
  - Meta de votos
  - Fecha de cierre
  - Estado: activa / cerrada / próxima
- Acciones por encuesta: editar, cerrar, ver resultados
- Toggle de visibilidad (visible/oculta en landing)

#### C. Resultados detallados
- Selector de encuesta
- Gráfico de barras horizontales con porcentajes
- Gráfico de dona
- Tabla con detalle: opción, votos, porcentaje
- Filtros: por fecha, por región (si disponible)
- Botón: Exportar a CSV (genera descarga desde los datos)

#### D. Configuración
- Cambiar contraseña de admin
- Editar datos del sitio (título, slogan, WhatsApp)
- Ver/gestionar suscriptores al newsletter

### Diseño del admin
- Sidebar: fondo `#0A1E3D`, ancho 240px, links con íconos Lucide
- Contenido: fondo `#F2F4F8`, padding 32px
- Cards de KPI: fondo blanco, sombra sutil, número grande en `JetBrains Mono`
- Tablas: estilo minimal, filas alternas con fondo `#F8FAFB`
- Mobile: sidebar colapsable, contenido full-width

---

## 11. DASHBOARD DE RESULTADOS EN TIEMPO REAL

### Página `/resultados/index.html`

Página pública que muestra resultados expandidos de todas las encuestas.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Navbar]                                                        │
│                                                                  │
│  CENTRO DE RESULTADOS                              [● EN VIVO]   │
│  Datos actualizados en tiempo real                               │
│                                                                  │
│  ┌── Selector ──────────────────────────────────────────────┐    │
│  │ [▼ Intención de voto 2026] [▼ Todas las regiones]        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌── Gráfico principal ─────────────────────────────────────┐    │
│  │                                                           │    │
│  │   (Chart.js — Barras horizontales)                        │    │
│  │                                                           │    │
│  │   Candidato A  ████████████████████  35.2%  (851)         │    │
│  │   Candidato B  ██████████████       28.7%  (694)          │    │
│  │   Candidato C  ████████             18.1%  (438)          │    │
│  │   Indecisos    ██████               12.4%  (300)          │    │
│  │   Otros        ████                  5.6%  (135)          │    │
│  │                                                           │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌── Dona ────────┐  ┌── Info ──────────────────────────────┐    │
│  │                │  │                                       │    │
│  │   (Chart.js    │  │  Total participantes: 2,418           │    │
│  │    doughnut)   │  │  Meta: 3,500                          │    │
│  │                │  │  Progreso: 69.1%                      │    │
│  │                │  │  Inicio: 1 Feb 2026                   │    │
│  │                │  │  Cierre: 15 Mar 2026                  │    │
│  │                │  │  Última actualización: hace 30s       │    │
│  └────────────────┘  └───────────────────────────────────────┘    │
│                                                                  │
│  ┌── Tabla detallada ───────────────────────────────────────┐    │
│  │  # │ Opción              │ Votos │ Porcentaje │ Barra    │    │
│  │  1 │ Candidato A         │  851  │  35.2%     │ ████████ │    │
│  │  2 │ Candidato B         │  694  │  28.7%     │ ██████   │    │
│  │  3 │ Candidato C         │  438  │  18.1%     │ ████     │    │
│  │  4 │ Indecisos           │  300  │  12.4%     │ ███      │    │
│  │  5 │ Otros               │  135  │   5.6%     │ ██       │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [ COMPARTIR ] [ DESCARGAR PDF ] [ DESCARGAR CSV ]               │
│                                                                  │
│  [Footer]                                                        │
└──────────────────────────────────────────────────────────────────┘
```

### Configuración de Chart.js

```javascript
// Gráfico de barras horizontales
const barConfig = {
  type: 'bar',
  data: {
    labels: resultados.map(r => r.opcion),
    datasets: [{
      data: resultados.map(r => r.cantidad),
      backgroundColor: [
        '#D4A012', '#1A4B8C', '#0A1E3D', '#5A6B7F', '#D8DFE8'
      ],
      borderRadius: 4,
      barThickness: 36
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0A1E3D',
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'JetBrains Mono' }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { font: { family: 'JetBrains Mono', size: 12 } }
      },
      y: {
        grid: { display: false },
        ticks: { font: { family: 'Outfit', size: 14 } }
      }
    },
    animation: {
      duration: 1200,
      easing: 'easeOutQuart'
    }
  }
};
```

### Auto-refresh

```javascript
// Polling cada 30 segundos para actualizar resultados
setInterval(async () => {
  const data = await fetch(`${API_URL}?action=getResultados&id=${currentEncuestaId}`);
  const json = await data.json();
  updateCharts(json.resultados);
  updateCounters(json.total_votos);
}, 30000);
```

---

## 12. RESPONSIVE Y MOBILE FIRST

### Breakpoints

```css
/* Mobile first */
/* Base: 0 - 576px (mobile) */
/* sm: 576px+ (mobile landscape) */
/* md: 768px+ (tablet) */
/* lg: 1024px+ (desktop) */
/* xl: 1280px+ (desktop grande) */

@media (max-width: 768px) {
  .hero-title { font-size: 32px; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .encuestas-grid { grid-template-columns: 1fr; }
  .admin-sidebar { transform: translateX(-100%); position: fixed; }
  .admin-sidebar.active { transform: translateX(0); }
  .results-layout { flex-direction: column; }
}
```

### Reglas mobile
- Navbar: hamburguesa con menú slide-in
- Hero: título 32px, un solo botón principal
- Contadores: grid 2x2
- Cards de encuesta: 1 columna, full-width
- Formulario de voto: opciones full-width, botones grandes (min 48px height)
- Gráficos: se adaptan al ancho del contenedor
- Admin: sidebar oculto por defecto, toggle con botón
- Tablas: scroll horizontal en móvil
- WhatsApp flotante: siempre visible, `bottom: 16px; right: 16px`

---

## 13. DESPLIEGUE EN GITHUB PAGES

### Pasos

1. Crear repositorio en GitHub: `encuestape/encuestape.github.io` o `encuestape/web`
2. Subir todos los archivos del proyecto
3. Ir a Settings → Pages → Source: "Deploy from a branch" → Branch: `main` → Folder: `/ (root)`
4. Crear archivo `CNAME` en la raíz con el contenido: `encuestape.com`
5. Crear archivo `.nojekyll` vacío en la raíz (evita procesamiento Jekyll)
6. El sitio estará disponible en `https://encuestape.github.io` o `https://encuestape.com`

### GitHub Actions (opcional — `.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
```

---

## 14. DOMINIO PROPIO

### Configuración DNS para `encuestape.com`

En el panel del registrador de dominio, crear estos registros:

```
Tipo    Nombre    Valor
A       @         185.199.108.153
A       @         185.199.109.153
A       @         185.199.110.153
A       @         185.199.111.153
CNAME   www       encuestape.github.io
```

### Verificación
- Esperar propagación DNS (hasta 48h)
- En GitHub → Settings → Pages → Custom domain: escribir `encuestape.com`
- Activar "Enforce HTTPS"

---

## 15. INSTRUCCIONES DE IMPLEMENTACIÓN PARA CLAUDE CODE

### Orden de ejecución

Claude Code debe seguir este orden preciso para construir el proyecto:

```
FASE 1: SETUP Y ESTRUCTURA
─────────────────────────
1. Crear la estructura de carpetas y archivos vacíos
2. Crear variables.css con toda la paleta, tipografía y espaciado
3. Crear base.css con reset, tipografía base y utilidades
4. Crear config.js con la URL del API y constantes

FASE 2: BACKEND (Google Apps Script)
─────────────────────────────────────
5. Crear apps-script/Code.gs con todo el código del backend
6. Crear apps-script/README-SETUP.md con instrucciones de configuración
7. Configurar las hojas del spreadsheet (Encuestas, Votos, Config, Suscriptores)
   con los headers correctos

FASE 3: MÓDULOS JS CORE
────────────────────────
8. Crear js/utils.js — funciones SHA-256, formateo de números, validaciones
9. Crear js/api.js — módulo de comunicación con Google Apps Script
10. Crear js/charts.js — configuración base de Chart.js

FASE 4: LANDING PAGE
────────────────────
11. Crear index.html con TODA la estructura semántica del landing
    (navbar, hero, contadores, encuestas, resultados, cómo funciona,
     credibilidad, newsletter, footer, WhatsApp flotante)
12. Crear css/landing.css con todos los estilos del landing
13. Crear css/components.css con botones, cards, badges, modales
14. Crear js/landing.js con la lógica del landing
    (cargar encuestas, contadores animados, resultados en tiempo real, newsletter)

FASE 5: SISTEMA DE VOTACIÓN
────────────────────────────
15. Crear votar/index.html con el flujo completo multi-paso
16. Crear css/votar.css con estilos del formulario
17. Crear js/votar.js con la lógica completa
    (validar DNI → hash → verificar → mostrar opciones → confirmar → registrar → gracias)

FASE 6: PANEL ADMIN
────────────────────
18. Crear admin/index.html con login + dashboard + gestión
19. Crear css/admin.css con estilos del panel
20. Crear js/admin.js con la lógica completa
    (login → dashboard → CRUD encuestas → resultados → configuración)

FASE 7: RESULTADOS PÚBLICOS
────────────────────────────
21. Crear resultados/index.html con la página de resultados expandidos
22. Reutilizar charts.js para los gráficos

FASE 8: RESPONSIVE
──────────────────
23. Crear css/responsive.css con todas las media queries

FASE 9: ASSETS Y META
──────────────────────
24. Crear el logo SVG (logo.svg y logo-white.svg)
25. Crear el patrón decorativo (pattern.svg)
26. Crear favicon.ico
27. Crear CNAME con "encuestape.com"
28. Crear .nojekyll
29. Crear .github/workflows/deploy.yml

FASE 10: REVISIÓN FINAL
────────────────────────
30. Verificar que todos los links internos funcionan
31. Verificar responsive en todos los breakpoints
32. Verificar que el flujo de votación es coherente
33. Verificar que los gráficos se renderizan correctamente
34. Optimizar imágenes y assets
```

### Variables críticas a configurar

```javascript
// js/config.js
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
  SPREADSHEET_ID: '1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ',
  SITE_NAME: 'EncuestaPe',
  REFRESH_INTERVAL: 30000,  // 30 segundos
  DNI_LENGTH: 8,
  WHATSAPP_NUMBER: '51999999999',
};
```

### CDNs a incluir en los HTML

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=JetBrains+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Chart.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>

<!-- AOS (Animate on Scroll) -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>

<!-- Lucide Icons -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/lucide.min.js"></script>
```

### Notas importantes para la implementación

1. **SHA-256 en el frontend**: Usar la Web Crypto API nativa del navegador para generar el hash del DNI antes de enviarlo. Nunca enviar el DNI en texto plano al servidor.

```javascript
async function hashDNI(dni) {
  const encoder = new TextEncoder();
  const data = encoder.encode(dni);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

2. **CORS con Apps Script**: Las Web Apps de Google Apps Script manejan CORS automáticamente. Para POST, usar `mode: 'no-cors'` no es necesario si se usa `ContentService` correctamente. Si hay problemas de CORS, usar la técnica de redirect: enviar como formulario con `fetch(url, { method: 'POST', redirect: 'follow', body: JSON.stringify(data) })`.

3. **Seguridad del admin**: El token de sesión se guarda en `sessionStorage` (se borra al cerrar la pestaña). En cada request al admin, se envía el token que se valida en Apps Script. El token expira en 4 horas.

4. **GitHub Pages y SPA**: GitHub Pages no soporta rutas dinámicas. Cada "página" es un directorio con su propio `index.html`. No usar History API para routing; usar estructura de directorios o hash routing.

5. **Datos de ejemplo**: Agregar datos de ejemplo en las hojas para que el sitio no se vea vacío. Crear al menos 2 encuestas con opciones de ejemplo y algunos votos ficticios.

6. **Performance**: Minimizar el número de llamadas API. En el landing, hacer una sola llamada a `getEncuestas` que incluya todo lo necesario. Los resultados detallados se cargan solo cuando el usuario los solicita.

7. **Accesibilidad**: Incluir `aria-labels`, roles semánticos, contraste adecuado (WCAG AA), y navegación por teclado en el formulario de votación.

---

## RESUMEN EJECUTIVO

**EncuestaPe.com** es una plataforma de encuestas electorales que funciona como sitio estático en GitHub Pages, usando Google Sheets + Apps Script como backend serverless. El flujo principal es: ciudadano ingresa su DNI → se verifica que no haya votado → emite su voto → el resultado se actualiza en tiempo real en el landing page. Un panel admin protegido permite gestionar encuestas, ver estadísticas y exportar datos. Todo el diseño sigue una estética editorial institucional con identidad peruana, tipografía elegante y gráficos animados que transmiten profesionalismo y confianza.