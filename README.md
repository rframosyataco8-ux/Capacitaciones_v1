# CapaciHub

Sistema de gestión de capacitaciones (vault + cronograma + archivos + exámenes + auditoría).

## Qué es real (ya no es solo prototipo)

- **Datos persistentes** en el navegador (IndexedDB): se guardan al cerrar y reabrir.
- **Cronograma anual**: crear, eliminar, cambiar de año, duplicar al año siguiente.
- **Almacenamiento de archivos**: subir PDF, PPT, Word, Excel, imágenes; carpetas; descargar.
- **Notas tipo Obsidian**: árbol, enlaces `[[wiki]]`, backlinks, tags, propiedades.
- **Grafo** generado a partir de notas, eventos y exámenes reales.
- **Exámenes**: alta básica con metadatos.
- **Auditoría**: resumen + exportar JSON del año.

## Cómo abrirlo

Los módulos ES (`import`) **no funcionan** abriendo el HTML con doble clic (`file://`). Usa un servidor local:

```bash
cd CapaciHub
npx --yes serve .
```

O en VS Code: extensión **Live Server** → Open with Live Server.

Luego entra a la URL que indique (ej. `http://localhost:3000`).

## Uso rápido

1. **Cronograma** (icono ▦): `+ Capacitación`, elige año, `Duplicar año → siguiente`.
2. **Archivos** (📁): sube o arrastra PPT/PDF/Word; crea carpetas.
3. **Vault** (☰): notas y enlaces; `+` nueva nota; **Editar** para cambiar el markdown.
4. **Grafo** (◈): red de relaciones.
5. **Auditoría** (✓): exporta JSON para el cierre de año.

## Estructura

```
CapaciHub/
  index.html
  css/app.css
  js/db.js      # IndexedDB
  js/app.js     # UI + lógica
  README.md
```

## Siguiente nivel (cuando quieras)

- Backend + multiusuario
- Editor markdown completo en pantalla
- Constructor de exámenes tipo Forms
- Sincronización OneDrive / SharePoint
