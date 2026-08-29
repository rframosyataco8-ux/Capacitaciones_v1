import Dexie, { type Table } from 'dexie'

export interface Capacitacion {
  id?: number
  codigo: string // CAP-2026-001
  year: number
  item: number
  tema: string
  responsable: string
  fechas: string[] // ISO dates YYYY-MM-DD
  periodoTexto: string // display friendly
  estado: 'Programada' | 'Realizada' | 'Pendiente' | 'Borrador'
  examId?: string | null
  notas?: string
  createdAt: string
  updatedAt: string
}

export interface MaterialFolder {
  id?: number
  year: number
  tema: string
  path: string // e.g. "2026/Sistema HACCP"
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

export interface Exam {
  id?: number
  titulo: string
  capacitacionId?: number | null
  estado: 'Borrador' | 'Activo' | 'Cerrado'
  preguntas: ExamQuestion[]
  createdAt: string
  updatedAt: string
}

export interface ExamQuestion {
  id: string
  tipo: 'multiple' | 'verdadero_falso' | 'abierta'
  texto: string
  opciones?: string[]
  correcta?: string | number
}

class CapacitacionesDB extends Dexie {
  capacitaciones!: Table<Capacitacion, number>
  folders!: Table<MaterialFolder, number>
  files!: Table<MaterialFile, number>
  exams!: Table<Exam, number>

  constructor() {
    super('CapacitacionesDB_v2')
    this.version(1).stores({
      capacitaciones: '++id, codigo, year, tema, responsable, estado',
      folders: '++id, year, tema, path',
      files: '++id, folderPath, name',
      exams: '++id, titulo, capacitacionId, estado',
    })
  }
}

export const db = new CapacitacionesDB()

// ─── Seed data ROMEX 2026 ───────────────────────────────────────────

const SEED_2026: Omit<Capacitacion, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    codigo: 'CAP-2026-001',
    year: 2026,
    item: 1,
    tema: 'Proceso de transformaci\u00f3n de grano de cacao (producci\u00f3n)',
    responsable: 'Tco. Fiorella Moscayza',
    fechas: ['2026-04-01', '2026-06-03', '2026-09-01'],
    periodoTexto: 'Abr / Jun / Sep 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-002',
    year: 2026,
    item: 2,
    tema: 'Sistema HACCP',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-01-21', '2026-02-03', '2026-03-03', '2026-04-21', '2026-06-03', '2026-07-21', '2026-09-08', '2026-12-08'],
    periodoTexto: 'Ene–Dic 2026 (8 sesiones)',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-003',
    year: 2026,
    item: 3,
    tema: 'Buenas pr\u00e1cticas de Manufactura',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-01-27', '2026-04-14', '2026-06-16', '2026-08-27', '2026-12-01'],
    periodoTexto: 'Ene / Abr / Jun / Ago / Dic 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-004',
    year: 2026,
    item: 4,
    tema: 'Microbiolog\u00eda',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-04-22', '2026-09-15'],
    periodoTexto: 'Abr / Sep 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-005',
    year: 2026,
    item: 5,
    tema: 'ETAS',
    responsable: 'Tco. Fiorella Moscaiza',
    fechas: ['2026-04-22', '2026-09-15'],
    periodoTexto: 'Abr / Sep 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-006',
    year: 2026,
    item: 6,
    tema: 'Control de Plagas',
    responsable: 'Empresa control plagas Samger',
    fechas: ['2026-01-12', '2026-04-14', '2026-10-13'],
    periodoTexto: 'Ene / Abr / Oct 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-007',
    year: 2026,
    item: 7,
    tema: 'Sistema de Gesti\u00f3n de Inocuidad de Alimentos',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-02-10', '2026-05-14', '2026-08-04', '2026-10-14'],
    periodoTexto: 'Feb / May / Ago / Oct 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-008',
    year: 2026,
    item: 8,
    tema: 'Alergenos',
    responsable: 'Tco. Fiorella Moscayza',
    fechas: ['2026-05-14', '2026-10-20'],
    periodoTexto: 'May / Oct 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-009',
    year: 2026,
    item: 9,
    tema: 'Organismos Gen\u00e9ticamente Modificados',
    responsable: 'Tco. Fiorella Moscayza',
    fechas: ['2026-05-14', '2026-10-20'],
    periodoTexto: 'May / Oct 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-010',
    year: 2026,
    item: 10,
    tema: "PCC's",
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-01-13', '2026-03-10', '2026-04-23', '2026-07-01', '2026-12-08'],
    periodoTexto: 'Ene / Mar / Abr / Jul / Dic 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-011',
    year: 2026,
    item: 11,
    tema: 'Prevenci\u00f3n de Contaminaci\u00f3n de Objetos Extra\u00f1os',
    responsable: 'Tco. Fiorella Moscaiza',
    fechas: ['2026-02-17', '2026-04-25', '2026-07-01', '2026-07-15', '2026-10-01', '2026-11-24', '2026-12-08'],
    periodoTexto: 'Feb–Dic 2026 (frecuencia elevada)',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-012',
    year: 2026,
    item: 12,
    tema: 'Uso y Mantenimiento de Instrumentos y equipos de medici\u00f3n',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-08-12'],
    periodoTexto: 'Ago 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-013',
    year: 2026,
    item: 13,
    tema: 'Higiene y Saneamiento',
    responsable: 'Tco. Fiorella Moscayza',
    fechas: ['2026-02-24', '2026-03-17', '2026-05-27', '2026-08-11', '2026-11-10', '2026-12-22'],
    periodoTexto: 'Feb–Dic 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-014',
    year: 2026,
    item: 14,
    tema: 'Trazabilidad',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-05-20', '2026-11-17'],
    periodoTexto: 'May / Nov 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-015',
    year: 2026,
    item: 15,
    tema: 'KOSHER - RAINFOREST ALLIANCE',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-04-06', '2026-11-03'],
    periodoTexto: 'Abr / Nov 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-016',
    year: 2026,
    item: 16,
    tema: 'PRODUCTOS ORG\u00c1NICOS: NOP - EU',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-02-05', '2026-03-24', '2026-04-07', '2026-07-14', '2026-08-26', '2026-12-15'],
    periodoTexto: 'Feb–Dic 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-017',
    year: 2026,
    item: 17,
    tema: 'DEFENSA DE LOS ALIMENTOS',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-06-23', '2026-08-18'],
    periodoTexto: 'Jun / Ago 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-018',
    year: 2026,
    item: 18,
    tema: 'POL\u00cdTICA DE CALIDAD - INOCUIDAD',
    responsable: 'Ing. Carlos Villanueva',
    fechas: ['2026-02-24', '2026-11-03'],
    periodoTexto: 'Feb / Nov 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-019',
    year: 2026,
    item: 19,
    tema: 'ETIQUETADO Y ENVASADO DE PRODUCTOS',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-08-04'],
    periodoTexto: 'Ago 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-020',
    year: 2026,
    item: 20,
    tema: 'REPARACIONES TEMPORALES',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-10-06'],
    periodoTexto: 'Oct 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-021',
    year: 2026,
    item: 21,
    tema: 'PREVENCI\u00d3N DE LA COVID-19',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-02-24', '2026-03-10', '2026-04-21', '2026-07-14', '2026-11-03', '2026-12-01'],
    periodoTexto: 'Feb–Dic 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-022',
    year: 2026,
    item: 22,
    tema: 'Tr\u00e1nsito de personal, uso de uniforme',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-04-07'],
    periodoTexto: 'Abr 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-023',
    year: 2026,
    item: 23,
    tema: 'Autenticidad - Vulnerabilidad',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-02-26', '2026-07-14'],
    periodoTexto: 'Feb / Jul 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-024',
    year: 2026,
    item: 24,
    tema: '5S',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-07-25', '2026-11-24'],
    periodoTexto: 'Jul / Nov 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-025',
    year: 2026,
    item: 25,
    tema: 'Uso de los casilleros, disposici\u00f3n de ropa de trabajo, ropa de calle y zapatos',
    responsable: 'Blga. Nereyda Huachua',
    fechas: ['2026-04-21'],
    periodoTexto: 'Abr 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-026',
    year: 2026,
    item: 26,
    tema: 'Uso correcto de registros de producci\u00f3n',
    responsable: 'Tco. Fiorella Moscayza',
    fechas: ['2026-04-22'],
    periodoTexto: 'Abr 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-027',
    year: 2026,
    item: 27,
    tema: 'Halal: concepto Halal, Haram y Mashbooh, mercado y controles internos',
    responsable: 'Certificadora: Fambras Halal',
    fechas: ['2026-11-03'],
    periodoTexto: 'Nov 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-028',
    year: 2026,
    item: 28,
    tema: 'Manejo seguro de sustancias qu\u00edmicas utilizadas en el programa de control de plagas',
    responsable: 'Empresa control plagas Samger',
    fechas: ['2026-03-21'],
    periodoTexto: 'Mar 2026',
    estado: 'Programada',
  },
  {
    codigo: 'CAP-2026-029',
    year: 2026,
    item: 29,
    tema: 'Manejo adecuado de residuos como parte del Manejo Integrado de Plagas (MIP)',
    responsable: 'Empresa control plagas Samger',
    fechas: ['2026-03-21'],
    periodoTexto: 'Mar 2026',
    estado: 'Programada',
  },
]

export async function seedIfEmpty() {
  const count = await db.capacitaciones.count()
  if (count > 0) return

  const now = new Date().toISOString()
  await db.capacitaciones.bulkAdd(
    SEED_2026.map((c) => ({
      ...c,
      createdAt: now,
      updatedAt: now,
    }))
  )

  // Auto-create folders for Data Storage
  await db.folders.bulkAdd(
    SEED_2026.map((c) => ({
      year: 2026,
      tema: c.tema,
      path: `Cronograma de Capacitaciones - 2026/${c.tema}`,
      createdAt: now,
    }))
  )
}

export async function listCapacitaciones(year: number) {
  return db.capacitaciones.where('year').equals(year).sortBy('item')
}

export async function saveCapacitacion(
  data: Omit<Capacitacion, 'id' | 'createdAt' | 'updatedAt'> & { id?: number }
) {
  const now = new Date().toISOString()
  if (data.id) {
    await db.capacitaciones.update(data.id, { ...data, updatedAt: now })
    return data.id
  }
  return db.capacitaciones.add({ ...data, createdAt: now, updatedAt: now })
}

export async function deleteCapacitacion(id: number) {
  await db.capacitaciones.delete(id)
}

export async function listFolders(year?: number) {
  if (year) return db.folders.where('year').equals(year).toArray()
  return db.folders.toArray()
}
