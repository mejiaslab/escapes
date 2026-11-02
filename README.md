# 🗝️ Expediente Escapista — Panel Privado de Escape Rooms

Aplicación web interactiva conectada **exclusivamente en tiempo real a Google Sheets** mediante **Google Cloud OAuth 2.0**.

> 🔒 **Privacidad total:** El repositorio no almacena ningún dato estático de la hoja de cálculo. Solo los usuarios cuya cuenta de Google tenga **permiso de lectura o edición en la hoja de cálculo `Escapes`** pueden autenticarse y visualizar la información.

🌐 **Web publicada en GitHub Pages:** [https://mejiaslab.github.io/escapes/](https://mejiaslab.github.io/escapes/)

---

## Características incluidas

- **Control de acceso y sincronización real en Google Sheets** (`719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com`):
  - Solicita inicio de sesión con Google y permiso `spreadsheets` para lectura y guardado de valoraciones personales.
  - Consulta en tiempo real la hoja general `Datos` junto con las 5 hojas individuales (`Sara`, `Miguel`, `Rafa`, `Antonio`, `Joan`) mediante `values:batchGet`: si la cuenta no tiene acceso compartido a la hoja, Google deniega la lectura (`403`) y el panel permanece bloqueado.
  - Identifica automáticamente a cada integrante por su nombre de usuario de Google (`Sara`, `Miguel`, `Rafa = Rafael`, `Antonio`, `Joan`) y permite valorar **únicamente los escapes visitados por ese miembro**.
  - Al cerrar sesión se revoca el token OAuth y se limpian todos los datos en memoria.
- **Menú lateral agrupado por secciones** (con versión deslizable para móvil y enrutamiento por hash):
  - **Dashboard (pantalla principal)**: Resumen ejecutivo con KPIs interactivos, podio Top 3, últimas 5 salas visitadas, participación por integrante, próximas reservas y hoja de ruta por provincias.
  - **Mi Espacio (sección personal)**: Estadísticas individuales, evolución anual propia, radar personal frente al grupo, podio personal y gestor interactivo para puntuar las salas visitadas (7 criterios, excluyendo *Dificultad* del cálculo de la media).
  - **Salas Visitadas**: Historial completo ordenado por **fecha descendiente** con buscador, filtros por miembro/año, **paginación** configurable y ficha modal detallada con las notas de cada asistente.
  - **Salas Pendientes**: Próximos objetivos filtrables por provincia, temática y buscador, destacando reservas agendadas y premios **TERPECA / ERA**.
  - **Ranking Top 10**: Hall of Fame de mejores salas con carteles oficiales, medallas de podio y vistas opcionales (*Media Global*, *Nota General*, *Sara*, *Miguel*, *Rafa*, *Antonio*, *Joan*).
  - **Mapa de Conquistas**: Mapa interactivo a gran tamaño con agrupación inteligente (`MarkerCluster`) y desglose por provincias y municipios.
  - **Equipo**: Recuento global e individual por miembro (e invitados `+`), alineaciones míticas y efectividad por integrante.
  - **Estadísticas**: Evolución anual de salas y notas (calculadas como la media de todos los miembros que han valorado cada sala), radar de 7 criterios por miembro, ADN de temáticas, empresas de referencia y distribución de calificaciones.

---

## Requisitos en Google Cloud y Google Sheets

1. **Habilitar Google Sheets API** en el proyecto de Google Cloud `719597836416`:
   - [Activar Google Sheets API en Google Cloud Console](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=719597836416)
2. **Orígenes de JavaScript autorizados** en el Client ID `719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com`:
   - `https://mejiaslab.github.io`
   - *(Opcional para desarrollo local)* `http://localhost:8000`
3. **Permisos de acceso**:
   - Comparte la hoja de cálculo **Escapes** en Google Drive/Sheets como **Editor** con los integrantes que vayan a guardar sus valoraciones desde la web (o *Lector* si solo deben consultar).
   - Si la pantalla de consentimiento OAuth en Google Cloud está en modo *Pruebas (Testing)*, añade también esos correos en **Usuarios de prueba (Test users)**.
