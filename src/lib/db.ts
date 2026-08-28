import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface Note {
  id: string
  path: string
  title: string
  body: string
  tags: string[]
  props: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  title: string
  date: string
  time: string
  tipo: string
  estado: string
  asistentes: number
  cupo: number
  year: number
  updatedAt: string
}

export interface FileItem {
  id: string
  name: string
  folder: string
  type: string
  size: number
  blob: Blob | null
  linkedNoteId: string | null
  createdAt: string
}

export interface Exam {
  id: string
  title: string
  preguntas: number
  notaMin: number
  estado: string
  respuestas: number
  promedio: number | null
  linkedEvent?: string
  updatedAt: string
}

interface CapaciDB extends DBSchema {
  notes: { key: string; value: Note; indexes: { path: string; updatedAt: string } }
  events: { key: string; value: Event; indexes: { date: string; year: number } }
  files: { key: string; value: FileItem; indexes: { folder: string; name: string } }
  exams: { key: string; value: Exam }
}

let dbPromise: Promise<IDBPDatabase<CapaciDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CapaciDB>('CapaciHub', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('notes')) {
          const s = db.createObjectStore('notes', { keyPath: 'id' })
          s.createIndex('path', 'path')
          s.createIndex('updatedAt', 'updatedAt')
        }
        if (!db.objectStoreNames.contains('events')) {
          const s = db.createObjectStore('events', { keyPath: 'id' })
          s.createIndex('date', 'date')
          s.createIndex('year', 'year')
        }
        if (!db.objectStoreNames.contains('files')) {
          const s = db.createObjectStore('files', { keyPath: 'id' })
          s.createIndex('folder', 'folder')
          s.createIndex('name', 'name')
        }
        if (!db.objectStoreNames.contains('exams')) {
          db.createObjectStore('exams', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

const uid = (p: string) => `${p}_${crypto.randomUUID().slice(0, 8)}`

export async function listNotes() {
  return (await getDB()).getAll('notes')
}
export async function saveNote(note: Partial<Note> & { title: string }) {
  const db = await getDB()
  const now = new Date().toISOString()
  const full: Note = {
    id: note.id || uid('n'),
    path: note.path || `General/${note.title}.md`,
    title: note.title,
    body: note.body ?? '',
    tags: note.tags ?? [],
    props: note.props ?? {},
    createdAt: note.createdAt || now,
    updatedAt: now,
  }
  await db.put('notes', full)
  return full
}
export async function deleteNote(id: string) {
  await (await getDB()).delete('notes', id)
}

export async function listEvents(year?: number) {
  const db = await getDB()
  if (year == null) return db.getAll('events')
  return db.getAllFromIndex('events', 'year', year)
}
export async function saveEvent(ev: Partial<Event> & { title: string; date: string }) {
  const db = await getDB()
  const full: Event = {
    id: ev.id || uid('e'),
    title: ev.title,
    date: ev.date,
    time: ev.time || '09:00',
    tipo: ev.tipo || 'Presencial',
    estado: ev.estado || 'Programada',
    asistentes: ev.asistentes ?? 0,
    cupo: ev.cupo ?? 30,
    year: parseInt(ev.date.slice(0, 4), 10),
    updatedAt: new Date().toISOString(),
  }
  await db.put('events', full)
  return full
}
export async function deleteEvent(id: string) {
  await (await getDB()).delete('events', id)
}

export async function listFiles(folder?: string) {
  const db = await getDB()
  if (!folder) return db.getAll('files')
  return db.getAllFromIndex('files', 'folder', folder)
}
export async function saveFile(f: { name: string; folder?: string; type?: string; size?: number; blob?: Blob }) {
  const db = await getDB()
  const item: FileItem = {
    id: uid('f'),
    name: f.name,
    folder: f.folder || 'General',
    type: f.type || 'application/octet-stream',
    size: f.size ?? f.blob?.size ?? 0,
    blob: f.blob ?? null,
    linkedNoteId: null,
    createdAt: new Date().toISOString(),
  }
  await db.put('files', item)
  return item
}
export async function getFile(id: string) {
  return (await getDB()).get('files', id)
}
export async function deleteFile(id: string) {
  await (await getDB()).delete('files', id)
}

export async function listExams() {
  return (await getDB()).getAll('exams')
}
export async function saveExam(ex: Partial<Exam> & { title: string }) {
  const db = await getDB()
  const full: Exam = {
    id: ex.id || uid('x'),
    title: ex.title,
    preguntas: ex.preguntas ?? 10,
    notaMin: ex.notaMin ?? 70,
    estado: ex.estado || 'Borrador',
    respuestas: ex.respuestas ?? 0,
    promedio: ex.promedio ?? null,
    linkedEvent: ex.linkedEvent,
    updatedAt: new Date().toISOString(),
  }
  await db.put('exams', full)
  return full
}
export async function deleteExam(id: string) {
  await (await getDB()).delete('exams', id)
}

export async function seedIfEmpty() {
  const notes = await listNotes()
  if (notes.length > 0) return false
  const y = new Date().getFullYear()
  await saveNote({
    id: 'n_proc',
    path: '2026/NR-12 Seguridad/Procedimiento.md',
    title: 'Procedimiento NR-12 — Seguridad en Máquinas',
    body: `Este procedimiento aplica a todas las áreas de producción. Vinculado a [[Matriz de competencias]] y al examen NR-12.\n\n## 1. Objetivo\nGarantizar la seguridad en el uso de máquinas y equipos (NR-12).\n\n## 2. Responsabilidades\n- **Operador:** verificar protecciones al inicio de turno.\n- **Supervisor:** inspección semanal.\n- **SST:** capacitación anual y control de versiones.\n\n## 3. Evidencias\n- Lista de asistencia\n- Resultados de examen (mín. 70%)\n- Registro fotográfico\n- Versión del material`,
    tags: ['obligatoria', 'nr12', 'seguridad'],
    props: { tipo: 'Obligatoria', duracion: '4h', instructor: 'Ing. Pérez', estado: 'Programada' },
  })
  await saveNote({
    id: 'n_matriz',
    path: 'Base de Conocimiento/Matriz de competencias.md',
    title: 'Matriz de competencias',
    body: `Matriz puestos × capacitaciones obligatorias.\n\nRelacionado: [[Procedimiento NR-12 — Seguridad en Máquinas]] y [[Checklist auditoría]].`,
    tags: ['matriz', 'competencias'],
  })
  await saveNote({
    id: 'n_check',
    path: 'Base de Conocimiento/Checklist auditoría.md',
    title: 'Checklist auditoría',
    body: `Evidencias para auditoría de fin de año.\n\n- Cronograma firmado\n- Asistencias\n- Exámenes\n- Referencia: [[Procedimiento NR-12 — Seguridad en Máquinas]]`,
    tags: ['auditoria', 'checklist'],
  })
  await saveEvent({ id: 'e1', title: 'NR-12 Seguridad Industrial', date: `${y}-09-12`, time: '09:00', tipo: 'Presencial', estado: 'Programada', asistentes: 28, cupo: 30 })
  await saveEvent({ id: 'e2', title: 'Riesgos Psicosociales', date: `${y}-09-18`, time: '14:00', tipo: 'Virtual', estado: 'Confirmada', asistentes: 45, cupo: 50 })
  await saveEvent({ id: 'e3', title: 'ISO 45001', date: `${y}-10-05`, time: '08:30', tipo: 'Presencial', estado: 'Pendiente', asistentes: 0, cupo: 25 })
  await saveExam({ id: 'x1', title: 'Evaluación NR-12', preguntas: 10, notaMin: 70, estado: 'Activo', respuestas: 42, promedio: 82, linkedEvent: 'e1' })
  return true
}
