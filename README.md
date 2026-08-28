# CapaciHub

Sistema de gestion de capacitaciones (local-first).

## Requisitos

- Node.js 18+
- npm

## Instalacion y arranque

```bash
cd CapaciHub
git pull origin main
npm install
npm run dev
```

Abre la URL de Vite (ej. http://localhost:5173).

**No uses Live Server** con HTML antiguo.

## Si hay errores al actualizar

```bash
git fetch origin
git reset --hard origin/main
rm -rf node_modules package-lock.json
npm install
npm run dev
```

Si la base de datos local falla (schema viejo), en el navegador:
DevTools → Application → IndexedDB → eliminar **CapaciHub** → recargar.

## Funciones

| Modulo | Que hace |
|--------|----------|
| **Vault** | Notas markdown, wiki links, tags |
| **Grafo** | Mapa de relaciones (arrastrable) |
| **Cronograma** | Eventos anuales, duplicar ano, export PDF/Word |
| **Archivos** | Subir, ver PDF/imagenes/PPTX/DOCX/Excel, renombrar, mover |
| **Examenes** | Crear preguntas, URL para rendir, resultados |
| **Auditoria** | Resumen + export JSON |

## Stack

React 19 · TypeScript · Vite · Tailwind 4 · IndexedDB (idb) · jsPDF · mammoth · SheetJS · JSZip

Datos solo en el navegador (IndexedDB).
