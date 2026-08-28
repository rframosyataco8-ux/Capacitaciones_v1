# CapaciHub

Sistema de gestión de capacitaciones — **stack moderno**.

## Stack

| Tecnología | Uso |
|------------|-----|
| **React 19** | UI |
| **TypeScript** | Tipado |
| **Vite** | Build y dev server |
| **Tailwind CSS 4** | Estilos (Material / Google) |
| **idb** | IndexedDB (datos locales) |
| **lucide-react** | Iconos |

## Cómo ejecutar

```bash
cd CapaciHub
git pull origin main
npm install
npm run dev
```

Abre la URL que indique Vite (ej. `http://localhost:5173`).

**Importante:** ya no uses Live Server con el HTML viejo. Este proyecto se abre con `npm run dev`.

## Scripts

- `npm run dev` — desarrollo con hot reload
- `npm run build` — producción → `dist/`
- `npm run preview` — previsualizar build

## Funciones

- **Vault** — notas, `[[wiki links]]`, tags, propiedades, backlinks
- **Cronograma** — crear/eliminar, año, duplicar al siguiente
- **Archivos** — PDF/PPT/Word, carpetas, descargar
- **Exámenes** — evaluaciones
- **Auditoría** — resumen + exportar JSON

Datos en el navegador (IndexedDB).

Repo: https://github.com/rframosyataco8-ux/CapaciHub
