# Sistema de Capacitaciones v2

Sistema profesional de gestión de capacitaciones (local-first).

## Estructura de navegación

| Sección        | Descripción |
|----------------|-------------|
| **INICIO**     | Dashboard (calendario + métricas) + Grafo de conocimiento |
| **CRONOGRAMA** | Tabla profesional anual (ID, Tema, Fecha/Periodo, Responsable) + export Excel/Word/PDF |
| **EXAMENES**   | Constructor de exámenes tipo Forms, enlazados a capacitaciones |
| **DATA STORAGE** | Carpetas automáticas por año → tema (materiales PPTX, Word, videos…) |

## Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS v4
- TanStack Table
- Dexie (IndexedDB)
- React Router 7
- Lucide icons

## Arranque rápido

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Estado actual

Scaffold base con layout, sidebar y páginas placeholder.  
Siguiente: IndexedDB real, CRUD de cronograma, modal de visualización completo y auto-creación de carpetas.
