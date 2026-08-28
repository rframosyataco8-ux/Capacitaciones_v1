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
  area?: string
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

export interface ExamQuestion {
  id: string
  text: string
  options: string[]
  correctIndex: number
  points: number
}

export interface Exam {
  id: string
  title: string
  description: string
  preguntas: number
  notaMin: number
  estado: 'Borrador' | 'Activo' | 'Cerrado'
  respuestas: number
  promedio: number | null
  linkedEvent?: string
  folder?: string
  questions: ExamQuestion[]
  theme: string
  shareToken: string
  updatedAt: string
}

export interface ExamAttempt {
  id: string
  examId: string
  nombre: string
  email?: string
  answers: number[]
  score: number
  percent: number
  approved: boolean
  createdAt: string
}

interface CapaciDB extends DBSchema {
  notes: { key: string; value: Note; indexes: { path: string; updatedAt: string } }
  events: { key: string; value: Event; indexes: { date: string; year: number } }
  files: { key: string; value: FileItem; indexes: { folder: string; name: string } }
  exams: { key: string; value: Exam }
  attempts: { key: string; value: ExamAttempt; indexes: { examId: string } }
}

let dbPromise: Promise<IDBPDatabase<CapaciDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CapaciDB>('CapaciHub', 3, {
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
        if (!db.objectStoreNames.contains('attempts')) {
          const s = db.createObjectStore('attempts', { keyPath: 'id' })
          s.createIndex('examId', 'examId')
        }
      },
    })
  }
  return dbPromise
}

const uid = (p: string) => p + '_' + crypto.randomUUID().slice(0, 8)

export async function listNotes() {
  return (await getDB()).getAll('notes')
}
export async function saveNote(note: Partial<Note> & { title: string }) {
  const db = await getDB()
  const now = new Date().toISOString()
  const full: Note = {
    id: note.id || uid('n'),
    path: note.path || 'General/' + note.title + '.md',
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
    area: ev.area,
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
export async function updateFile(id: string, patch: Partial<Pick<FileItem, 'name' | 'folder' | 'blob' | 'type' | 'size'>>) {
  const db = await getDB()
  const existing = await db.get('files', id)
  if (!existing) throw new Error('Archivo no encontrado')
  const updated: FileItem = { ...existing, ...patch, size: patch.blob?.size ?? patch.size ?? existing.size }
  await db.put('files', updated)
  return updated
}

export async function listExams() {
  return (await getDB()).getAll('exams')
}
export async function getExam(id: string) {
  return (await getDB()).get('exams', id)
}
export async function getExamByToken(token: string) {
  const all = await listExams()
  return all.find(e => e.shareToken === token) || null
}
export async function saveExam(ex: Partial<Exam> & { title: string }) {
  const db = await getDB()
  const existing = ex.id ? await db.get('exams', ex.id) : null
  const full: Exam = {
    id: ex.id || uid('x'),
    title: ex.title,
    description: ex.description ?? existing?.description ?? '',
    preguntas: ex.questions?.length ?? ex.preguntas ?? existing?.preguntas ?? 0,
    notaMin: ex.notaMin ?? existing?.notaMin ?? 70,
    estado: ex.estado || existing?.estado || 'Borrador',
    respuestas: ex.respuestas ?? existing?.respuestas ?? 0,
    promedio: ex.promedio ?? existing?.promedio ?? null,
    linkedEvent: ex.linkedEvent ?? existing?.linkedEvent,
    folder: ex.folder ?? existing?.folder ?? 'General',
    questions: ex.questions ?? existing?.questions ?? [],
    theme: ex.theme ?? existing?.theme ?? 'blue',
    shareToken: existing?.shareToken || crypto.randomUUID().slice(0, 10),
    updatedAt: new Date().toISOString(),
  }
  full.preguntas = full.questions.length
  await db.put('exams', full)
  return full
}
export async function deleteExam(id: string) {
  await (await getDB()).delete('exams', id)
}

export async function listAttempts(examId?: string) {
  const db = await getDB()
  if (!examId) return db.getAll('attempts')
  return db.getAllFromIndex('attempts', 'examId', examId)
}
export async function saveAttempt(att: Omit<ExamAttempt, 'id' | 'createdAt'> & { id?: string }) {
  const db = await getDB()
  const full: ExamAttempt = {
    id: att.id || uid('a'),
    examId: att.examId,
    nombre: att.nombre,
    email: att.email,
    answers: att.answers,
    score: att.score,
    percent: att.percent,
    approved: att.approved,
    createdAt: new Date().toISOString(),
  }
  await db.put('attempts', full)
  const exam = await db.get('exams', att.examId)
  if (exam) {
    const all = await listAttempts(att.examId)
    exam.respuestas = all.length
    exam.promedio = all.reduce((s, a) => s + a.percent, 0) / all.length
    await db.put('exams', exam)
  }
  return full
}

export async function seedIfEmpty() {
  const notes = await listNotes()
  if (notes.length > 0) return false
  const y = new Date().getFullYear()
  await saveNote({
    id: 'n_proc',
    path: '2026/NR-12 Seguridad/Procedimiento.md',
    title: 'Procedimiento NR-12 — Seguridad en Maquinas',
    body: 'Vinculado a [[Matriz de competencias]].\n\n## Objetivo\nGarantizar seguridad NR-12.\n\n## Evidencias\n- Asistencia\n- Examen',
    tags: ['obligatoria', 'nr12'],
    props: { tipo: 'Obligatoria', duracion: '4h' },
  })
  await saveNote({
    id: 'n_matriz',
    path: 'Base de Conocimiento/Matriz de competencias.md',
    title: 'Matriz de competencias',
    body: 'Relacionado: [[Procedimiento NR-12 — Seguridad en Maquinas]] y [[Checklist auditoria]].',
    tags: ['matriz'],
  })
  await saveNote({
    id: 'n_check',
    path: 'Base de Conocimiento/Checklist auditoria.md',
    title: 'Checklist auditoria',
    body: 'Referencia: [[Procedimiento NR-12 — Seguridad en Maquinas]]',
    tags: ['auditoria'],
  })
  await saveEvent({ id: 'e1', title: 'NR-12 Seguridad Industrial', date: y + '-09-12', time: '09:00', tipo: 'Presencial', estado: 'Programada', asistentes: 28, cupo: 30 })
  await saveEvent({ id: 'e2', title: 'Riesgos Psicosociales', date: y + '-09-18', time: '14:00', tipo: 'Virtual', estado: 'Confirmada', asistentes: 45, cupo: 50 })
  await saveExam({
    id: 'x1',
    title: 'Evaluacion NR-12',
    description: 'Examen de seguridad industrial',
    notaMin: 70,
    estado: 'Activo',
    folder: '2026/NR-12 Seguridad',
    theme: 'blue',
    questions: [
      { id: 'q1', text: 'Que es NR-12?', options: ['Norma de seguridad en maquinas', 'Norma ambiental', 'Norma de calidad', 'Ninguna'], correctIndex: 0, points: 1 },
      { id: 'q2', text: 'Quien inspecciona protecciones?', options: ['Solo SST', 'Operador y supervisor', 'Solo gerencia', 'Nadie'], correctIndex: 1, points: 1 },
    ],
  })
  return true
}
