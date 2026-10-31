# 🗝️ Expediente Escapista — Panel Privado de Escape Rooms

Aplicación web interactiva conectada **exclusivamente en tiempo real a Google Sheets** mediante **Google Cloud OAuth 2.0**.

> 🔒 **Privacidad total:** El repositorio no almacena ningún dato estático de la hoja de cálculo. Solo los usuarios cuya cuenta de Google tenga **permiso de lectura o edición en la hoja de cálculo `Escapes`** pueden autenticarse y visualizar la información.

🌐 **Web publicada en GitHub Pages:** [https://mejiaslab.github.io/escapes/](https://mejiaslab.github.io/escapes/)

---

## Características incluidas

- **Control de acceso real basado en permisos de Google Sheets** (`719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com`):
  - Solicita inicio de sesión con Google y permiso `spreadsheets.readonly`.
  - Consulta directamente `https://sheets.googleapis.com/v4/spreadsheets/.../values/Datos!A1:AO1000` con el token OAuth del usuario: si la cuenta no tiene acceso compartido a la hoja, Google deniega la lectura (`403`) y el panel permanece bloqueado.
  - Al cerrar sesión se revoca el token OAuth y se limpian todos los datos en memoria.
- **Recuento global e individual** de salas registradas y visitadas por cada miembro del grupo (e invitados `+`), con filtro rápido al hacer clic.
- **Ranking Top 10** de mejores salas con carteles oficiales, medallas de podio y vistas opcionales (*Media Global*, *Nota General*, *Miguel*, *Sara*).
- **Salas pendientes filtrables por provincia**, temática y buscador, destacando premios **TERPECA / ERA**.
- **Historial completo de salas visitadas** ordenado por **fecha descendiente** con **paginación** configurable y ficha modal detallada.
- **Gráfica de salas visitadas por año** y **mapa interactivo** con agrupación inteligente (`MarkerCluster`).
- **Estadísticas adicionales**: radar de 7 criterios de valoración, temáticas jugadas vs. pendientes, alineaciones habituales del equipo y empresas mejor valoradas.

---

## Requisitos en Google Cloud y Google Sheets

1. **Habilitar Google Sheets API** en el proyecto de Google Cloud `719597836416`:
   - [Activar Google Sheets API en Google Cloud Console](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=719597836416)
2. **Orígenes de JavaScript autorizados** en el Client ID `719597836416-s3lfcptc71809rjbk3f720ilhv8rnpk6.apps.googleusercontent.com`:
   - `https://mejiaslab.github.io`
   - *(Opcional para desarrollo local)* `http://localhost:8000`
3. **Permisos de acceso**:
   - Comparte la hoja de cálculo **Escapes** en Google Drive/Sheets (como *Lector* o *Editor*) únicamente con las cuentas de Google que deban poder ver los datos en la web.
   - Si la pantalla de consentimiento OAuth en Google Cloud está en modo *Pruebas (Testing)*, añade también esos correos en **Usuarios de prueba (Test users)**.
