import Dexie, { type Table } from 'dexie'

export type SessionStatus = 'Programada' | 'Realizada' | 'Pendiente'

export interface Session {
  date: string
  status: SessionStatus
}

export interface Capacitacion {
  id?: number
  codigo: string
  year: number
  item: number
  tema: string
  responsable: string
  sessions: Session[]
  fechas?: string[]
  periodoTexto: string
  estado: 'Programada' | 'Realizada' | 'Pendiente' | 'Borrador'
  examId?: number | null
  notas?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialFolder {
  id?: number
  year: number
  tema: string
  path: string
  createdAt: string
}

export interface MaterialFile {
  id?: number
  folderPath: string
  name: string
  type: string
  size: number
  blob?: Blob
  createdAt: string
}

export interface ExamQuestion {
  id: string
  tipo: 'multiple' | 'verdadero_falso' | 'abierta'
  texto: string
  opciones?: string[]
  correcta?: string | number
}

export interface Exam {
  id?: number
  titulo: string
  capacitacionId?: number | null
  tema?: string
  estado: 'Borrador' | 'Activo' | 'Cerrado'
  preguntas: ExamQuestion[]
  createdAt: string
  updatedAt: string
}

class CapacitacionesDB extends Dexie {
  capacitaciones!: Table<Capacitacion, number>
  folders!: Table<MaterialFolder, number>
  files!: Table<MaterialFile, number>
  exams!: Table<Exam, number>

  constructor() {
    super('CapacitacionesDB_v3')
    this.version(1).stores({
      capacitaciones: '++id, codigo, year, tema, responsable, estado',
      folders: '++id, year, tema, path',
      files: '++id, folderPath, name',
      exams: '++id, titulo, capacitacionId, estado, updatedAt',
    })
  }
}

export const db = new CapacitacionesDB()

function sessionsFromDates(dates: string[]): Session[] {
  return dates.map((date) => ({ date, status: 'Programada' as const }))
}

function periodoFromSessions(sessions: Session[], year: number): string {
  if (sessions.length === 0) return '—'
  if (sessions.length === 1) {
    const [y, m, d] = sessions[0].date.split('-')
    return `${d}/${m}/${y}`
  }
  return `${sessions.length} sesiones · ${year}`
}

const SEED_RAW: { tema: string; responsable: string; fechas: string[] }[] = [
  { tema: 'Proceso de transformación de grano de cacao (producción)', responsable: 'Tco. Fiorella Moscayza', fechas: ['2026-04-01', '2026-06-03', '2026-09-01'] },
  { tema: 'Sistema HACCP', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-01-21', '2026-02-03', '2026-03-03', '2026-04-21', '2026-06-03', '2026-07-21', '2026-09-08', '2026-12-08'] },
  { tema: 'Buenas prácticas de Manufactura', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-01-27', '2026-04-14', '2026-06-16', '2026-08-27', '2026-12-01'] },
  { tema: 'Microbiología', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-04-22', '2026-09-15'] },
  { tema: 'ETAS', responsable: 'Tco. Fiorella Moscaiza', fechas: ['2026-04-22', '2026-09-15'] },
  { tema: 'Control de Plagas', responsable: 'Empresa control plagas Samger', fechas: ['2026-01-12', '2026-04-14', '2026-10-13'] },
  { tema: 'Sistema de Gestión de Inocuidad de Alimentos', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-02-10', '2026-05-14', '2026-08-04', '2026-10-14'] },
  { tema: 'Alergenos', responsable: 'Tco. Fiorella Moscayza', fechas: ['2026-05-14', '2026-10-20'] },
  { tema: 'Organismos Genéticamente Modificados', responsable: 'Tco. Fiorella Moscayza', fechas: ['2026-05-14', '2026-10-20'] },
  { tema: "PCC's", responsable: 'Blga. Nereyda Huachua', fechas: ['2026-01-13', '2026-03-10', '2026-04-23', '2026-07-01', '2026-12-08'] },
  { tema: 'Prevención de Contaminación de Objetos Extraños', responsable: 'Tco. Fiorella Moscaiza', fechas: ['2026-02-17', '2026-04-25', '2026-07-01', '2026-07-15', '2026-10-01', '2026-11-24', '2026-12-08'] },
  { tema: 'Uso y Mantenimiento de Instrumentos y equipos de medición', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-08-12'] },
  { tema: 'Higiene y Saneamiento', responsable: 'Tco. Fiorella Moscayza', fechas: ['2026-02-24', '2026-03-17', '2026-05-27', '2026-08-11', '2026-11-10', '2026-12-22'] },
  { tema: 'Trazabilidad', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-05-20', '2026-11-17'] },
  { tema: 'KOSHER - RAINFOREST ALLIANCE', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-04-06', '2026-11-03'] },
  { tema: 'PRODUCTOS ORGÁNICOS: NOP - EU', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-02-05', '2026-03-24', '2026-04-07', '2026-07-14', '2026-08-26', '2026-12-15'] },
  { tema: 'DEFENSA DE LOS ALIMENTOS', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-06-23', '2026-08-18'] },
  { tema: 'POLÍTICA DE CALIDAD - INOCUIDAD', responsable: 'Ing. Carlos Villanueva', fechas: ['2026-02-24', '2026-11-03'] },
  { tema: 'ETIQUETADO Y ENVASADO DE PRODUCTOS', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-08-04'] },
  { tema: 'REPARACIONES TEMPORALES', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-10-06'] },
  { tema: 'PREVENCIÓN DE LA COVID-19', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-02-24', '2026-03-10', '2026-04-21', '2026-07-14', '2026-11-03', '2026-12-01'] },
  { tema: 'Tránsito de personal, uso de uniforme', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-04-07'] },
  { tema: 'Autenticidad - Vulnerabilidad', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-02-26', '2026-07-14'] },
  { tema: '5S', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-07-25', '2026-11-24'] },
  { tema: 'Uso de los casilleros, disposición de ropa de trabajo, ropa de calle y zapatos', responsable: 'Blga. Nereyda Huachua', fechas: ['2026-04-21'] },
  { tema: 'Uso correcto de registros de producción', responsable: 'Tco. Fiorella Moscayza', fechas: ['2026-04-22'] },
  { tema: 'Halal: concepto Halal, Haram y Mashbooh, mercado y controles internos', responsable: 'Certificadora: Fambras Halal', fechas: ['2026-11-03'] },
  { tema: 'Manejo seguro de sustancias químicas utilizadas en el programa de control de plagas', responsable: 'Empresa control plagas Samger', fechas: ['2026-03-21'] },
  { tema: 'Manejo adecuado de residuos como parte del Manejo Integrado de Plagas (MIP)', responsable: 'Empresa control plagas Samger', fechas: ['2026-03-21'] },
]

export async function seedIfEmpty() {
  try {
    const count = await db.capacitaciones.count()
    if (count > 0) return

    const now = new Date().toISOString()
    const year = 2026

    await db.capacitaciones.bulkAdd(
      SEED_RAW.map((c, i) => {
        const sessions = sessionsFromDates(c.fechas)
        return {
          codigo: `CAP-${year}-${String(i + 1).padStart(3, '0')}`,
          year,
          item: i + 1,
          tema: c.tema,
          responsable: c.responsable,
          sessions,
          periodoTexto: periodoFromSessions(sessions, year),
          estado: 'Programada' as const,
          createdAt: now,
          updatedAt: now,
        }
      })
    )

    await db.folders.bulkAdd(
      SEED_RAW.map((c) => ({
        year,
        tema: c.tema,
        path: `Cronograma de Capacitaciones - ${year}/${c.tema}`,
        createdAt: now,
      }))
    )
  } catch (e) {
    console.error('seedIfEmpty', e)
  }
}

export function normalizeCap(c: Capacitacion): Capacitacion {
  if (c.sessions && c.sessions.length > 0) return c
  return { ...c, sessions: sessionsFromDates(c.fechas || []) }
}

export async function listCapacitaciones(year: number): Promise<Capacitacion[]> {
  const rows = await db.capacitaciones.where('year').equals(year).sortBy('item')
  return rows.map(normalizeCap)
}

export async function ensureFolder(year: number, tema: string) {
  const path = `Cronograma de Capacitaciones - ${year}/${tema}`
  const existing = await db.folders.where('path').equals(path).first()
  if (existing) return existing.id
  return db.folders.add({
    year,
    tema,
    path,
    createdAt: new Date().toISOString(),
  })
}

export async function saveCapacitacion(
  data: Omit<Capacitacion, 'createdAt' | 'updatedAt'> & { id?: number; createdAt?: string }
) {
  const now = new Date().toISOString()
  const sessions = data.sessions?.length
    ? data.sessions
    : sessionsFromDates(data.fechas || [])

  const { id, ...rest } = data
  const payload: Capacitacion = {
    ...rest,
    sessions,
    periodoTexto: data.periodoTexto || periodoFromSessions(sessions, data.year),
    updatedAt: now,
    createdAt: data.createdAt || now,
  }

  let resultId: number
  if (id != null) {
    await db.capacitaciones.update(id, payload)
    resultId = id
  } else {
    resultId = await db.capacitaciones.add(payload)
  }

  await ensureFolder(data.year, data.tema.trim())
  return resultId
}

export async function deleteCapacitacion(id: number) {
  await db.capacitaciones.delete(id)
}

export async function listFolders(year?: number) {
  if (year != null) return db.folders.where('year').equals(year).toArray()
  return db.folders.toArray()
}

export async function listFiles(folderPath: string) {
  return db.files.where('folderPath').equals(folderPath).toArray()
}

const MAX_FILE_SIZE = 25 * 1024 * 1024

export async function saveFile(meta: {
  folderPath: string
  name: string
  type: string
  size: number
  blob: Blob
}) {
  if (meta.size > MAX_FILE_SIZE) {
    throw new Error('Archivo demasiado grande (máx. 25 MB)')
  }
  const safeName = meta.name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 200)
  return db.files.add({
    folderPath: meta.folderPath,
    name: safeName,
    type: meta.type || 'application/octet-stream',
    size: meta.size,
    blob: meta.blob,
    createdAt: new Date().toISOString(),
  })
}

export async function deleteFile(id: number) {
  await db.files.delete(id)
}

export async function listExams() {
  try {
    return await db.exams.orderBy('updatedAt').reverse().toArray()
  } catch {
    return db.exams.toArray()
  }
}

export async function saveExam(
  data: Omit<Exam, 'createdAt' | 'updatedAt'> & { id?: number; createdAt?: string }
) {
  const now = new Date().toISOString()
  const { id, ...rest } = data
  if (id != null) {
    await db.exams.update(id, { ...rest, updatedAt: now })
    return id
  }
  return db.exams.add({
    ...rest,
    preguntas: data.preguntas || [],
    createdAt: now,
    updatedAt: now,
  })
}

export async function deleteExam(id: number) {
  await db.exams.delete(id)
}

export async function getStats(year: number) {
  const caps = await listCapacitaciones(year)
  const exams = await listExams()
  const files = await db.files.count()
  let sessions = 0
  let realizadas = 0
  let proximas = 0
  const now = new Date()
  const seen = new Set<string>()

  for (const c of caps) {
    for (const s of c.sessions || []) {
      sessions++
      if (s.status === 'Realizada') realizadas++
      const d = new Date(s.date + 'T12:00:00')
      const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (diff >= 0 && diff <= 7) {
        const key = `${c.id}-${s.date}`
        if (!seen.has(key)) {
          seen.add(key)
          proximas++
        }
      }
    }
  }

  return {
    temas: caps.length,
    sessions,
    realizadas,
    pendientes: sessions - realizadas,
    exams: exams.length,
    files,
    proximas,
  }
}

export { periodoFromSessions, sessionsFromDates }
