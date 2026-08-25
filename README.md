# CapaciHub — Sistema de Gestión de Capacitaciones

**Diseño limpio estilo Google Material Design + potencia de OneDrive + organización tipo Obsidian.**

Creado para que tengas **todo a la mano** para las auditorías de fin de año y el control total del cronograma de capacitaciones.

## ¿Qué incluye este prototipo?

Abre el archivo `index.html` en cualquier navegador moderno (Chrome, Edge, Firefox).

### Módulos

1. **Dashboard**  
   Resumen de cumplimiento, próximas capacitaciones, estado de preparación de auditoría y accesos rápidos.

2. **Cronograma**  
   - Vista de calendario mensual  
   - Selector de año (2026 / 2027)  
   - Tabla de todas las capacitaciones  
   - Botón para crear nuevas y “Duplicar año” (para preparar el cronograma del año siguiente)

3. **Capacitaciones (Catálogo)**  
   Fichas de cada tema con duración, instructor, cantidad de archivos y estado (obligatoria, recurrente, ISO…).

4. **Almacenamiento** (estilo OneDrive / Google Drive mejorado)  
   - Estructura recomendada: **Año → Tema → Materiales / Asistencias / Exámenes / Certificados**  
   - Vista de lista con nombre, fecha, tamaño y tipo  
   - Fin del caos del Explorador de Windows

5. **Exámenes** (estilo Google Forms)  
   - Lista de exámenes activos y borradores  
   - Constructor visual de preguntas (opción múltiple, checkbox…)  
   - Vinculación a capacitaciones  
   - Nota mínima y resultados

6. **Base de Conocimiento** (estilo Obsidian)  
   - Notas enlazadas con `[[enlaces]]`  
   - Procedimientos, checklists, lecciones aprendidas  
   - Siempre actualizados y conectados a las capacitaciones

7. **Reportes / Auditoría**  
   - Generación de paquetes de evidencia  
   - Checklist de fin de año  
   - Matriz de cumplimiento, resultados de exámenes, certificados, historial de versiones

## Diseño

- Tipografía Roboto / Google Sans  
- Colores primarios de Google (#1a73e8)  
- Cards con elevación suave  
- Navegación lateral limpia  
- Responsive (funciona en móvil y escritorio)  
- Material Icons

## Cómo usar el prototipo ahora mismo

1. Abre `index.html` con doble clic o arrástralo a Chrome.
2. Navega por el menú lateral.
3. Prueba los botones “Nueva capacitación” y “Crear examen” (abren modales).
4. Cambia de mes en el cronograma y selecciona el año 2027.

> **Nota:** Es un prototipo de interfaz (frontend). Los datos son de demostración. No guarda cambios reales todavía.

---

## Visión del sistema real (próximo paso)

Para tener un sistema **completo y en producción** se recomienda:

### Opción recomendada (rápida y potente)

| Componente          | Tecnología recomendada                          | Por qué |
|---------------------|--------------------------------------------------|--------|
| Frontend            | React + Vite o Next.js + Tailwind + Material Web | Diseño Google nativo y moderno |
| Backend + Auth      | Firebase (Auth + Firestore) o Supabase           | Rápido, seguro, gratis al inicio |
| Almacenamiento archivos | Firebase Storage o Google Drive API / OneDrive API | Integración real con lo que ya usan |
| Exámenes            | SurveyJS (open source) o Google Forms embebido + webhook | Creador profesional tipo Forms |
| Calendario          | FullCalendar o integración con Google Calendar   | Cronograma sincronizado |
| Reportes            | Generación PDF (jsPDF / Puppeteer) + Excel       | Paquete de auditoría con un clic |
| Notas (Obsidian)    | Markdown + editor (TipTap o CodeMirror) + grafo de enlaces | Base de conocimiento real |

### Estructura de carpetas ideal en el almacenamiento

```
/Capacitaciones
  /2026
    /NR-12_Seguridad_Industrial
      /01_Materiales
      /02_Listas_Asistencia
      /03_Examenes_y_Resultados
      /04_Certificados
      /05_Fotos_y_Evidencias
    /Primeros_Auxilios
    /ISO_45001
  /2027
    ...
  /Politicas_y_Procedimientos
  /Base_Conocimiento (notas .md)
```

### Funcionalidades extra para auditoría

- Control de versiones de materiales
- Firma digital de listas de asistencia
- Matriz de competencias por puesto
- Alertas automáticas de vencimiento
- Dashboard de cumplimiento en tiempo real
- Exportación de “paquete de auditoría” (ZIP con todos los PDFs + Excel resumen)

---

## ¿Podemos con el reto?

**Sí, 100%.**  

Este prototipo ya demuestra la combinación:

- **Google Material Design** → limpio, profesional, familiar  
- **OneDrive / Google Drive** → almacenamiento ordenado por carpetas lógicas  
- **Obsidian** → base de conocimiento con enlaces  
- **Google Forms** → creador de exámenes integrado  
- **Enfoque auditoría** → checklist + reportes listos

Cuando quieras pasar del prototipo al sistema real (con base de datos, usuarios, subida real de archivos, etc.) solo dime y lo construimos paso a paso (o te dejo el stack completo listo para desplegar).

---

**Archivo principal:** `index.html`  
Ábrelo y explora. ¡Todo está a la mano!
