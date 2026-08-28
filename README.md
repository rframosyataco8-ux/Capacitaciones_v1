# CapaciHub

Sistema local de capacitaciones: vault tipo Obsidian, archivos tipo OneDrive, cronograma anual, examenes y grafo.

## Arranque rapido

```bash
git pull origin main
npm install
npm run dev
```

Abre http://localhost:5173

## Edicion de archivos (sin servidor)

| Formato | Al abrir |
|---------|----------|
| `.docx` / `.html` | Editor Word (barra Inicio/Insertar, zoom, guardar) |
| `.xlsx` | Tabla editable + Guardar Excel |
| `.pdf` | Vista + boton Editar PDF (texto/resaltado) |
| `.pptx` | Diapositivas (texto + imagenes) |
| `.txt` / `.md` | Edicion de texto |

## OnlyOffice (opcional, casi Office Online)

Si tienes Docker Desktop:

```bash
docker compose up -d
```

OnlyOffice queda en http://localhost:8080  
Ahi puedes subir y editar Word/Excel/PPT con experiencia muy cercana a Microsoft Office.

## Datos

Todo se guarda en **IndexedDB del navegador** (local-first). No se sube a la nube.
