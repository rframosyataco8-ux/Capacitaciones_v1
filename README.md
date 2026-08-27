# CapaciHub

Sistema **real** de gestión de capacitaciones (datos locales, no solo maqueta).

## Qué hace de verdad

| Módulo | Función |
|--------|--------|
| **Cronograma** | Crear capacitaciones del año, cambiar año, **duplicar al siguiente** |
| **Archivos** | Subir/arrastrar PDF, PPT, Word, Excel, imágenes; carpetas; descargar |
| **Vault** | Notas con `[[wiki]]`, tags, propiedades, backlinks |
| **Grafo** | Red desde notas / eventos / exámenes reales |
| **Exámenes** | Alta de evaluaciones |
| **Auditoría** | Resumen + **exportar JSON** del año |

Todo se guarda en el **navegador (IndexedDB)** y persiste al cerrar.

## Cómo abrirlo

```bash
cd CapaciHub
git pull origin main
```

Abre `index.html` en **Chrome, Edge o Firefox** (navegador reciente).

Verás un momento “Cargando CapaciHub…” y luego la app completa.

## Flujo en la empresa

1. **Cronograma** → `+ Capacitación` por cada fecha del año.
2. Plan del próximo año → `Duplicar año → siguiente`.
3. **Archivos** → PPT, PDF, asistencias, fotos.
4. **Vault** → procedimientos y matrices enlazados.
5. **Auditoría** → exporta JSON cuando pidan evidencias.

Repo: https://github.com/rframosyataco8-ux/CapaciHub
