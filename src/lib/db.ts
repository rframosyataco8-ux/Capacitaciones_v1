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
  parentId?: number | null
  color?: string
  isFavorite?: boolean
  isDeleted?: boolean
  deletedAt?: string | null
  createdAt: string
}

export interface MaterialFile {
  id?: number
  folderPath: string
  folderId?: number | null
  name: string
  type: string
  size: number
  blob?: Blob
  isFavorite?: boolean
  isDeleted?: boolean
  deletedAt?: string | null
  tags?: string[]
  createdAt: string
}

export type ExamQuestionType =
  | 'multiple'
  | 'casillas'
  | 'verdadero_falso'
  | 'abierta'
  | 'escala'
  | 'desplegable'

export interface ExamQuestion {
  id: string
  tipo: ExamQuestionType
  texto: string
  puntos: number
  opciones?: string[]
  correcta?: any // string | number | (string | number)[] | boolean
  explicacion?: string
  obligatoria?: boolean
  minEscala?: number
  maxEscala?: number
  etiquetaMin?: string
  etiquetaMax?: string
}

export interface ExamSettings {
  tiempoLimiteMinutos?: number
  notaMinimaAprobatoria?: number // ej. 14 de 20
  mezclarPreguntas?: boolean
  mostrarRespuestasAlTerminar?: boolean
  permitirReintentos?: boolean
  mensajeAprobado?: string
  mensajeDesaprobado?: string
  fechaInicio?: string
  fechaFin?: string
  themeId?: string // id del tema visual
  bannerUrl?: string
}

export interface Exam {
  id?: number
  titulo: string
  descripcion?: string
  capacitacionId?: number | null
  tema?: string
  estado: 'Borrador' | 'Activo' | 'Cerrado'
  preguntas: ExamQuestion[]
  config?: ExamSettings
  createdAt: string
  updatedAt: string
}

export interface ExamSubmission {
  id?: number
  examId: number
  capacitacionId?: number | null
  evaluadoNombre: string
  evaluadoDni?: string
  evaluadoArea?: string
  respuestas: Record<string, any>
  puntajeObtenido: number
  puntajeMaximo: number
  notaBase20: number
  porcentaje: number
  aprobado: boolean
  tiempoEmpleadoSegundos: number
  fecha: string
}

class CapacitacionesDB extends Dexie {
  capacitaciones!: Table<Capacitacion, number>
  folders!: Table<MaterialFolder, number>
  files!: Table<MaterialFile, number>
  exams!: Table<Exam, number>
  submissions!: Table<ExamSubmission, number>

  constructor() {
    super('CapacitacionesDB_v4')
    this.version(1).stores({
      capacitaciones: '++id, codigo, year, tema, responsable, estado',
      folders: '++id, year, tema, path, parentId, isFavorite, isDeleted',
      files: '++id, folderPath, folderId, name, isFavorite, isDeleted, type',
      exams: '++id, titulo, capacitacionId, estado, updatedAt',
      submissions: '++id, examId, capacitacionId, evaluadoNombre, aprobado, fecha, notaBase20',
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

export const SEED_EXAMS: Omit<Exam, 'id'>[] = [
  {
    titulo: 'Evaluación de Sistema HACCP y Puntos Críticos',
    descripcion: 'Evaluación técnica sobre principios de análisis de peligros y monitoreo de PCC en planta de cacao.',
    tema: 'Sistema HACCP',
    estado: 'Activo',
    config: {
      tiempoLimiteMinutos: 15,
      notaMinimaAprobatoria: 14,
      mezclarPreguntas: false,
      mostrarRespuestasAlTerminar: true,
      mensajeAprobado: '¡Excelente! Demuestras dominio sólido de los principios HACCP y control de PCC.',
      mensajeDesaprobado: 'Se sugiere repasar los límites críticos y acciones correctivas del plan HACCP.',
    },
    preguntas: [
      {
        id: 'q-haccp-1',
        tipo: 'multiple',
        texto: '¿Cuál es el primer principio del sistema HACCP?',
        puntos: 4,
        opciones: [
          'Establecer límites críticos',
          'Realizar un análisis de peligros',
          'Determinar los Puntos Críticos de Control (PCC)',
          'Establecer un sistema de vigilancia',
        ],
        correcta: 1,
        explicacion: 'El Principio 1 es realizar un análisis de peligros para identificar agentes biológicos, químicos o físicos.',
        obligatoria: true,
      },
      {
        id: 'q-haccp-2',
        tipo: 'casillas',
        texto: 'Seleccione cuáles de los siguientes son peligros físicos en el procesamiento de cacao:',
        puntos: 4,
        opciones: [
          'Fragmentos de metal o alambres',
          'Salmonella spp.',
          'Piedras o vidrios',
          'Micotoxinas / Ocratoxina A',
        ],
        correcta: [0, 2],
        explicacion: 'Metales, piedras y vidrios son peligros físicos. Salmonella es biológico y Ocratoxina A es químico.',
        obligatoria: true,
      },
      {
        id: 'q-haccp-3',
        tipo: 'verdadero_falso',
        texto: 'Un límite crítico separa lo aceptable de lo inaceptable en un PCC.',
        puntos: 4,
        opciones: ['Verdadero', 'Falso'],
        correcta: 0,
        explicacion: 'Correcto. El límite crítico es el criterio que diferencia la aceptabilidad de la inaceptabilidad del proceso.',
        obligatoria: true,
      },
      {
        id: 'q-haccp-4',
        tipo: 'multiple',
        texto: '¿Qué acción se debe tomar inmediatamente cuando se detecta una desviación en un límite crítico?',
        puntos: 4,
        opciones: [
          'Continuar la producción y avisar al final del turno',
          'Aplicar la acción correctiva establecida y retener el producto afectado',
          'Borrar el registro del monitor',
          'Disminuir la velocidad de la máquina',
        ],
        correcta: 1,
        explicacion: 'Ante una desviación se debe aplicar la acción correctiva documentada y segregar el lote afectado.',
        obligatoria: true,
      },
      {
        id: 'q-haccp-5',
        tipo: 'escala',
        texto: '¿Qué tan seguro te sientes aplicando las medidas preventivas en tu puesto de trabajo?',
        puntos: 4,
        minEscala: 1,
        maxEscala: 5,
        etiquetaMin: 'Poco seguro',
        etiquetaMax: 'Totalmente seguro',
        correcta: null,
        explicacion: 'Pregunta de autopercepción de competencia operativa.',
        obligatoria: false,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    titulo: 'Buenas Prácticas de Manufactura (BPM) e Higiene',
    descripcion: 'Control de higiene personal, vestimenta, lavado de manos y prevención de contaminación cruzada.',
    tema: 'Buenas prácticas de Manufactura',
    estado: 'Activo',
    config: {
      tiempoLimiteMinutos: 10,
      notaMinimaAprobatoria: 14,
      mezclarPreguntas: false,
      mostrarRespuestasAlTerminar: true,
      mensajeAprobado: '¡Felicitaciones! Cumples con los estándares BPM de planta.',
      mensajeDesaprobado: 'Por favor, refuerza los procedimientos de vestimenta e higiene.',
    },
    preguntas: [
      {
        id: 'q-bpm-1',
        tipo: 'multiple',
        texto: '¿Cuál es el tiempo mínimo recomendado para el frotado de manos con jabón desinfectante?',
        puntos: 5,
        opciones: ['5 segundos', '20 segundos', '1 minuto', '3 minutos'],
        correcta: 1,
        explicacion: 'El lavado riguroso de manos requiere al menos 20 segundos de fricción en palmas, dorso y entre dedos.',
        obligatoria: true,
      },
      {
        id: 'q-bpm-2',
        tipo: 'verdadero_falso',
        texto: 'Está permitido el ingreso a sala de procesos portando reloj, aretes o anillos lisos si están limpios.',
        puntos: 5,
        opciones: ['Verdadero', 'Falso'],
        correcta: 1,
        explicacion: 'Falso. Ninguna joya ni objeto personal está permitido en zonas de manipulación para evitar contaminación física.',
        obligatoria: true,
      },
      {
        id: 'q-bpm-3',
        tipo: 'casillas',
        texto: '¿En qué momentos es obligatorio lavarse y desinfectarse las manos?',
        puntos: 5,
        opciones: [
          'Antes de iniciar labores',
          'Después de tocarse el cabello o la mascarilla',
          'Después de usar los servicios higiénicos',
          'Al cambiar de actividad o manipular residuos',
        ],
        correcta: [0, 1, 2, 3],
        explicacion: 'Todas las situaciones señaladas exigen lavado inmediato de manos.',
        obligatoria: true,
      },
      {
        id: 'q-bpm-4',
        tipo: 'multiple',
        texto: 'Si un operario presenta síntomas de infección respiratoria o gastrointestinal, ¿qué debe hacer?',
        puntos: 5,
        opciones: [
          'Tomar una pastilla y continuar trabajando en silencio',
          'Reportar inmediatamente a su supervisor y al área médica',
          'Cambiar de uniforme por uno más abrigado',
          'Trabajar únicamente en almacén',
        ],
        correcta: 1,
        explicacion: 'Debe notificarse de inmediato para evitar riesgo de contaminación de los alimentos.',
        obligatoria: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function seedIfEmpty() {
  try {
    const count = await db.capacitaciones.count()
    const now = new Date().toISOString()
    const year = 2026

    if (count === 0) {
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
          isFavorite: false,
          isDeleted: false,
          createdAt: now,
        }))
      )
    }

    const examCount = await db.exams.count()
    if (examCount === 0) {
      const caps = await db.capacitaciones.toArray()
      for (const se of SEED_EXAMS) {
        const matchingCap = caps.find((c) => c.tema.toLowerCase() === se.tema?.toLowerCase())
        await db.exams.add({
          ...se,
          capacitacionId: matchingCap?.id || null,
        })
      }
    }
  } catch (e) {
    console.error('seedIfEmpty error', e)
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
    isFavorite: false,
    isDeleted: false,
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
    await db.capacitaciones.put({ ...payload, id })
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

/* ================= MATERIAL FOLDERS ================= */

export async function listFolders(year?: number, includeDeleted = false) {
  let list: MaterialFolder[]
  if (year != null) {
    list = await db.folders.where('year').equals(year).toArray()
  } else {
    list = await db.folders.toArray()
  }
  if (!includeDeleted) {
    return list.filter((f) => !f.isDeleted)
  }
  return list
}

export async function saveFolder(folder: Partial<MaterialFolder> & { tema: string; path: string; year: number }) {
  const now = new Date().toISOString()
  if (folder.id) {
    await db.folders.update(folder.id, { ...folder })
    return folder.id
  }
  return db.folders.add({
    year: folder.year,
    tema: folder.tema,
    path: folder.path,
    parentId: folder.parentId || null,
    color: folder.color || '#0f4c81',
    isFavorite: folder.isFavorite || false,
    isDeleted: false,
    createdAt: now,
  })
}

export async function toggleFavoriteFolder(id: number, current: boolean) {
  await db.folders.update(id, { isFavorite: !current })
}

export async function softDeleteFolder(id: number) {
  const now = new Date().toISOString()
  await db.folders.update(id, { isDeleted: true, deletedAt: now })
}

export async function restoreFolder(id: number) {
  await db.folders.update(id, { isDeleted: false, deletedAt: null })
}

export async function hardDeleteFolder(id: number) {
  await db.folders.delete(id)
}

/* ================= MATERIAL FILES ================= */

export async function listFiles(folderPath?: string, includeDeleted = false) {
  let list: MaterialFile[]
  if (folderPath) {
    list = await db.files.where('folderPath').equals(folderPath).toArray()
  } else {
    list = await db.files.toArray()
  }
  if (!includeDeleted) {
    return list.filter((f) => !f.isDeleted)
  }
  return list
}

export async function listDeletedFiles() {
  const all = await db.files.toArray()
  return all.filter((f) => f.isDeleted)
}

export async function listFavoriteFiles() {
  const all = await db.files.toArray()
  return all.filter((f) => f.isFavorite && !f.isDeleted)
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function saveFile(meta: {
  folderPath: string
  folderId?: number | null
  name: string
  type: string
  size: number
  blob: Blob
  tags?: string[]
}) {
  if (meta.size > MAX_FILE_SIZE) {
    throw new Error('Archivo demasiado grande (máx. 50 MB)')
  }
  const safeName = meta.name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 200)
  return db.files.add({
    folderPath: meta.folderPath,
    folderId: meta.folderId || null,
    name: safeName,
    type: meta.type || 'application/octet-stream',
    size: meta.size,
    blob: meta.blob,
    isFavorite: false,
    isDeleted: false,
    tags: meta.tags || [],
    createdAt: new Date().toISOString(),
  })
}

export async function renameFile(id: number, newName: string) {
  const safeName = newName.replace(/[<>:"/\\|?*]/g, '_').slice(0, 200)
  await db.files.update(id, { name: safeName })
}

export async function moveFile(id: number, targetFolderPath: string, targetFolderId?: number) {
  await db.files.update(id, {
    folderPath: targetFolderPath,
    folderId: targetFolderId || null,
  })
}

export async function toggleFavoriteFile(id: number, current: boolean) {
  await db.files.update(id, { isFavorite: !current })
}

export async function softDeleteFile(id: number) {
  const now = new Date().toISOString()
  await db.files.update(id, { isDeleted: true, deletedAt: now })
}

export async function restoreFile(id: number) {
  await db.files.update(id, { isDeleted: false, deletedAt: null })
}

export async function hardDeleteFile(id: number) {
  await db.files.delete(id)
}

export const deleteFile = hardDeleteFile

export async function emptyTrash() {
  const deletedFiles = await db.files.filter((f) => !!f.isDeleted).toArray()
  for (const f of deletedFiles) {
    if (f.id) await db.files.delete(f.id)
  }
  const deletedFolders = await db.folders.filter((fo) => !!fo.isDeleted).toArray()
  for (const fo of deletedFolders) {
    if (fo.id) await db.folders.delete(fo.id)
  }
}

/* ================= EXAMS & SUBMISSIONS ================= */

export async function listExams() {
  try {
    return await db.exams.orderBy('updatedAt').reverse().toArray()
  } catch {
    return db.exams.toArray()
  }
}

export async function getExamById(id: number) {
  return db.exams.get(id)
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
  // eliminar envíos asociados
  await db.submissions.where('examId').equals(id).delete()
}

export async function saveExamSubmission(submission: Omit<ExamSubmission, 'id' | 'fecha'>) {
  const now = new Date().toISOString()
  return db.submissions.add({
    ...submission,
    fecha: now,
  })
}

export async function listSubmissionsByExam(examId: number) {
  return db.submissions.where('examId').equals(examId).reverse().sortBy('fecha')
}

export async function listAllSubmissions() {
  return db.submissions.orderBy('fecha').reverse().toArray()
}

export async function deleteSubmission(id: number) {
  return db.submissions.delete(id)
}

/* ================= GLOBAL STATS ================= */

export async function getStats(year: number) {
  const caps = await listCapacitaciones(year)
  const exams = await listExams()
  const files = await db.files.filter((f) => !f.isDeleted).count()
  const submissions = await db.submissions.count()
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
    submissions,
    files,
    proximas,
  }
}

export { periodoFromSessions, sessionsFromDates }
