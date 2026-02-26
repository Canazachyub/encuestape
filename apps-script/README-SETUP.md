# Configuración de Google Apps Script — EncuestaPe

## Pasos

1. Abre https://docs.google.com/spreadsheets/d/1Mje93_WZ6gMh8cnTrdnznwY-AEzSE-DBIRmgz50xKDQ/edit
2. Crea las siguientes hojas (pestañas):
   - **Encuestas** — Headers: id, titulo, descripcion, estado, opciones, meta_votos, fecha_inicio, fecha_fin, categoria, visible
   - **Votos** — Headers: encuesta_id, dni_hash, opcion, timestamp, region
   - **Config** — Columnas: clave, valor (admin_user, admin_pass_hash, site_title, etc.)
   - **Suscriptores** — Headers: email, fecha_suscripcion
3. Ve a **Extensiones > Apps Script**
4. Copia el contenido de `Code.gs` en el editor
5. Guarda y haz clic en **Implementar > Nueva implementación**
6. Tipo: **Aplicación web**
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
7. Copia la URL del deployment y pégala en `js/config.js` como `API_URL`
8. En la hoja Config, agrega: admin_user = admin, admin_pass_hash = (SHA-256 de tu contraseña)

## Datos de ejemplo
Agrega al menos 1-2 encuestas de ejemplo en la hoja "Encuestas" para que el sitio funcione.
