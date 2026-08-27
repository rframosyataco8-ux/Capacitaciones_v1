/**
 * CapaciHub — capa de datos (IndexedDB)
 * Persistencia local real: notas, cronograma, archivos, exámenes
 */
const DB_NAME = 'CapaciHub';
const DB_VER = 1;

const STORES = {
  notes: 'notes',
  events: 'events',
  files: 'files',
  exams: 'exams',
  settings: 'settings'
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.notes)) {
        const s = db.createObjectStore(STORES.notes, { keyPath: 'id' });
        s.createIndex('path', 'path', { unique: false });
        s.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.events)) {
        const s = db.createObjectStore(STORES.events, { keyPath: 'id' });
        s.createIndex('date', 'date', { unique: false });
        s.createIndex('year', 'year', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.files)) {
        const s = db.createObjectStore(STORES.files, { keyPath: 'id' });
        s.createIndex('folder', 'folder', { unique: false });
        s.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.exams)) {
        db.createObjectStore(STORES.exams, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
    };
  });
}

function idbReq(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAll(store) {
  const db = await openDB();
  return idbReq(db.transaction(store).objectStore(store).getAll());
}

export async function getById(store, id) {
  const db = await openDB();
  return idbReq(db.transaction(store).objectStore(store).get(id));
}

export async function put(store, item) {
  const db = await openDB();
  return idbReq(db.transaction(store, 'readwrite').objectStore(store).put(item));
}

export async function remove(store, id) {
  const db = await openDB();
  return idbReq(db.transaction(store, 'readwrite').objectStore(store).delete(id));
}

export async function getByIndex(store, indexName, value) {
  const db = await openDB();
  const idx = db.transaction(store).objectStore(store).index(indexName);
  return idbReq(idx.getAll(value));
}

export async function listNotes() {
  return getAll(STORES.notes);
}

export async function saveNote(note) {
  note.updatedAt = new Date().toISOString();
  if (!note.createdAt) note.createdAt = note.updatedAt;
  if (!note.id) note.id = 'n_' + crypto.randomUUID().slice(0, 8);
  await put(STORES.notes, note);
  return note;
}

export async function deleteNote(id) {
  return remove(STORES.notes, id);
}

export async function listEvents(year) {
  if (year == null) return getAll(STORES.events);
  return getByIndex(STORES.events, 'year', year);
}

export async function saveEvent(ev) {
  if (!ev.id) ev.id = 'e_' + crypto.randomUUID().slice(0, 8);
  if (ev.date) ev.year = parseInt(String(ev.date).slice(0, 4), 10);
  ev.updatedAt = new Date().toISOString();
  await put(STORES.events, ev);
  return ev;
}

export async function deleteEvent(id) {
  return remove(STORES.events, id);
}

export async function listFiles(folder) {
  if (folder == null || folder === '') return getAll(STORES.files);
  return getByIndex(STORES.files, 'folder', folder);
}

export async function saveFile({ name, folder, type, size, blob, linkedNoteId }) {
  const item = {
    id: 'f_' + crypto.randomUUID().slice(0, 8),
    name,
    folder: folder || 'General',
    type: type || 'application/octet-stream',
    size: size || (blob && blob.size) || 0,
    blob: blob || null,
    linkedNoteId: linkedNoteId || null,
    createdAt: new Date().toISOString()
  };
  await put(STORES.files, item);
  return item;
}

export async function getFile(id) {
  return getById(STORES.files, id);
}

export async function deleteFile(id) {
  return remove(STORES.files, id);
}

export async function listExams() {
  return getAll(STORES.exams);
}

export async function saveExam(exam) {
  if (!exam.id) exam.id = 'x_' + crypto.randomUUID().slice(0, 8);
  exam.updatedAt = new Date().toISOString();
  await put(STORES.exams, exam);
  return exam;
}

export async function deleteExam(id) {
  return remove(STORES.exams, id);
}

export async function seedIfEmpty() {
  const notes = await listNotes();
  if (notes.length > 0) return false;

  const seedNotes = [
    {
      id: 'n_proc',
      path: '2026/NR-12 Seguridad/Procedimiento.md',
      title: 'Procedimiento NR-12 — Seguridad en Máquinas',
      body: `Este procedimiento aplica a todas las áreas de producción. Vinculado a [[Matriz de competencias]] y al examen NR-12.\n\n## 1. Objetivo\nGarantizar la seguridad en el uso de máquinas y equipos (NR-12).\n\n## 2. Responsabilidades\n- **Operador:** verificar protecciones al inicio de turno.\n- **Supervisor:** inspección semanal.\n- **SST:** capacitación anual y control de versiones.\n\n## 3. Evidencias\n- Lista de asistencia\n- Resultados de examen (mín. 70%)\n- Registro fotográfico\n- Versión del material`,
      tags: ['obligatoria', 'nr12', 'seguridad'],
      props: { tipo: 'Obligatoria', duracion: '4h', instructor: 'Ing. Pérez', estado: 'Programada' }
    },
    {
      id: 'n_matriz',
      path: 'Base de Conocimiento/Matriz de competencias.md',
      title: 'Matriz de competencias',
      body: `Matriz puestos × capacitaciones obligatorias.\n\nRelacionado: [[Procedimiento NR-12 — Seguridad en Máquinas]] y [[Checklist auditoría]].`,
      tags: ['matriz', 'competencias'],
      props: {}
    },
    {
      id: 'n_check',
      path: 'Base de Conocimiento/Checklist auditoría.md',
      title: 'Checklist auditoría',
      body: `Evidencias para auditoría de fin de año.\n\n- Cronograma firmado\n- Asistencias\n- Exámenes\n- Referencia: [[Procedimiento NR-12 — Seguridad en Máquinas]]`,
      tags: ['auditoria', 'checklist'],
      props: {}
    }
  ];

  for (const n of seedNotes) {
    n.createdAt = new Date().toISOString();
    n.updatedAt = n.createdAt;
    await put(STORES.notes, n);
  }

  const y = new Date().getFullYear();
  const seedEvents = [
    { id: 'e1', title: 'NR-12 Seguridad Industrial', date: `${y}-09-12`, time: '09:00', tipo: 'Presencial', estado: 'Programada', asistentes: 28, cupo: 30, year: y },
    { id: 'e2', title: 'Riesgos Psicosociales', date: `${y}-09-18`, time: '14:00', tipo: 'Virtual', estado: 'Confirmada', asistentes: 45, cupo: 50, year: y },
    { id: 'e3', title: 'ISO 45001', date: `${y}-10-05`, time: '08:30', tipo: 'Presencial', estado: 'Pendiente', asistentes: 0, cupo: 25, year: y }
  ];
  for (const e of seedEvents) {
    e.updatedAt = new Date().toISOString();
    await put(STORES.events, e);
  }

  await put(STORES.exams, {
    id: 'x1',
    title: 'Evaluación NR-12',
    linkedEvent: 'e1',
    preguntas: 10,
    notaMin: 70,
    estado: 'Activo',
    respuestas: 42,
    promedio: 82,
    updatedAt: new Date().toISOString()
  });

  return true;
}

export { STORES };
