import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, ClipboardList, Trash2, Pencil, X, Save, Play, CheckCircle2,
  XCircle, Award, BarChart3, Clock, Share2, Copy, FileSpreadsheet,
  FileText, ArrowLeft, ArrowUp, ArrowDown, Sparkles, HelpCircle, Check,
  AlertTriangle, RotateCcw, Search, Eye, Filter, UserCheck, Palette,
  Calendar, Layers, CheckSquare, MessageCircle, Smartphone, Monitor
} from 'lucide-react'
import {
  seedIfEmpty, listExams, saveExam, deleteExam, listCapacitaciones,
  listSubmissionsByExam, saveExamSubmission, deleteSubmission, getExamById,
  type Exam, type Capacitacion, type ExamQuestion, type ExamQuestionType, type ExamSubmission,
} from '../lib/db'
import { generateCertificatePDF, exportSubmissionsExcel, exportExamSummaryPDF } from '../lib/examReports'
import { useToast } from '../lib/toast'
import { confirmar } from '../lib/confirm'

function uid() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

type ActiveView = 'list' | 'builder' | 'live-taker' | 'analytics'

export interface FormTheme {
  id: string
  name: string
  bgStyle: string
  cardBorder: string
  accentColor: string
  headerBg: string
  previewColor: string
}

export const FORM_THEMES: FormTheme[] = [
  {
    id: 'romex-cacao',
    name: 'ROMEX Cacao & Calidad',
    bgStyle: 'linear-gradient(135deg, #1e130c 0%, #3d2314 50%, #150c07 100%)',
    cardBorder: '#c4a35a',
    accentColor: '#c4a35a',
    headerBg: 'linear-gradient(90deg, #3d2314 0%, #0f4c81 100%)',
    previewColor: '#3d2314',
  },
  {
    id: 'haccp-blue',
    name: 'Inocuidad & HACCP Azul',
    bgStyle: 'linear-gradient(135deg, #091e3a 0%, #0f4c81 50%, #1a3a60 100%)',
    cardBorder: '#3b82c4',
    accentColor: '#0f4c81',
    headerBg: 'linear-gradient(90deg, #0f4c81 0%, #2563eb 100%)',
    previewColor: '#0f4c81',
  },
  {
    id: 'organic-green',
    name: 'Orgánico & Sostenibilidad',
    bgStyle: 'linear-gradient(135deg, #062419 0%, #047857 50%, #0f3e2e 100%)',
    cardBorder: '#10b981',
    accentColor: '#047857',
    headerBg: 'linear-gradient(90deg, #047857 0%, #059669 100%)',
    previewColor: '#047857',
  },
  {
    id: 'm365-purple',
    name: 'Microsoft 365 Violeta',
    bgStyle: 'linear-gradient(135deg, #1b0c36 0%, #581c87 50%, #2e1065 100%)',
    cardBorder: '#a855f7',
    accentColor: '#7c3aed',
    headerBg: 'linear-gradient(90deg, #6b21a8 0%, #7c3aed 100%)',
    previewColor: '#6b21a8',
  },
  {
    id: 'sunset-amber',
    name: 'Energía & Seguridad Ámbar',
    bgStyle: 'linear-gradient(135deg, #2e1005 0%, #9a3412 50%, #431407 100%)',
    cardBorder: '#f97316',
    accentColor: '#ea580c',
    headerBg: 'linear-gradient(90deg, #9a3412 0%, #ea580c 100%)',
    previewColor: '#c2410c',
  },
  {
    id: 'clean-slate',
    name: 'Minimalista Corporativo',
    bgStyle: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    cardBorder: '#64748b',
    accentColor: '#0f4c81',
    headerBg: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
    previewColor: '#1e293b',
  },
]

const QUESTION_TYPES: { type: ExamQuestionType; label: string; icon: string }[] = [
  { type: 'multiple', label: 'Opción múltiple (1 correcta)', icon: '🔘' },
  { type: 'casillas', label: 'Casillas (múltiples correctas)', icon: '☑️' },
  { type: 'verdadero_falso', label: 'Verdadero / Falso', icon: '⚖️' },
  { type: 'abierta', label: 'Respuesta abierta / corta', icon: '✍️' },
  { type: 'escala', label: 'Escala de valoración (1-5)', icon: '⭐' },
  { type: 'desplegable', label: 'Menú desplegable', icon: '🔻' },
]

export default function Examenes() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<ActiveView>('list')
  const [exams, setExams] = useState<Exam[]>([])
  const [temas, setTemas] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)

  // Builder State
  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [temaId, setTemaId] = useState<number | ''>('')
  const [estado, setEstado] = useState<'Borrador' | 'Activo' | 'Cerrado'>('Activo')
  const [tiempoLimite, setTiempoLimite] = useState<number>(15)
  const [notaMinima, setNotaMinima] = useState<number>(14)
  const [mezclarPreguntas, setMezclarPreguntas] = useState(false)
  const [mostrarRespuestas, setMostrarRespuestas] = useState(true)
  const [selectedThemeId, setSelectedThemeId] = useState<string>('romex-cacao')
  const [preguntas, setPreguntas] = useState<ExamQuestion[]>([])
  const [activeTabBuilder, setActiveTabBuilder] = useState<'preguntas' | 'config' | 'theme'>('preguntas')
  const [previewDevice, setPreviewDevice] = useState<'pc' | 'mobile'>('pc')

  // Live Exam Taker State
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [takerName, setTakerName] = useState('')
  const [takerDni, setTakerDni] = useState('')
  const [takerArea, setTakerArea] = useState('')
  const [takerStarted, setTakerStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [takerAnswers, setTakerAnswers] = useState<Record<string, any>>({})
  const [examResult, setExamResult] = useState<ExamSubmission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Analytics State
  const [analyticsExam, setAnalyticsExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [analyticsSearch, setAnalyticsSearch] = useState('')
  const [analyticsFilter, setAnalyticsFilter] = useState<'todos' | 'aprobados' | 'desaprobados'>('todos')

  const refresh = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    const [e, caps] = await Promise.all([listExams(), listCapacitaciones(2026)])
    setExams(e)
    setTemas(caps)

    // Si viene un ID en URL, abrir examen directamente
    const targetId = searchParams.get('id') || searchParams.get('take')
    if (targetId) {
      const match = e.find((x) => String(x.id) === String(targetId))
      if (match) {
        startTakingExam(match)
      }
    }

    setLoading(false)
  }, [searchParams])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Timer para examen en vivo
  useEffect(() => {
    if (!takerStarted || timeLeft <= 0 || examResult) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitExam(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [takerStarted, timeLeft, examResult])

  /* ================= BUILDER HANDLERS ================= */

  function openNewExam() {
    setEditingExam({
      titulo: '',
      descripcion: '',
      tema: '',
      estado: 'Activo',
      config: {
        tiempoLimiteMinutos: 15,
        notaMinimaAprobatoria: 14,
        mezclarPreguntas: false,
        mostrarRespuestasAlTerminar: true,
        themeId: 'romex-cacao',
      },
    })
    setTitulo('')
    setDescripcion('')
    setTemaId('')
    setEstado('Activo')
    setTiempoLimite(15)
    setNotaMinima(14)
    setMezclarPreguntas(false)
    setMostrarRespuestas(true)
    setSelectedThemeId('romex-cacao')
    setPreguntas([
      {
        id: uid(),
        tipo: 'multiple',
        texto: '¿Cuál es el objetivo principal del monitoreo de PCC en el proceso de cacao?',
        puntos: 5,
        opciones: [
          'Garantizar que el proceso se mantenga dentro de los límites críticos de inocuidad',
          'Acelerar el tiempo de envasado del producto',
          'Reducir el consumo de energía eléctrica en planta',
          'Reemplazar la limpieza diaria de los equipos',
        ],
        correcta: 0,
        explicacion: 'El monitoreo continuo de los PCC asegura que ningún lote exceda los límites de inocuidad definidos en el Plan HACCP.',
        obligatoria: true,
      },
      {
        id: uid(),
        tipo: 'verdadero_falso',
        texto: 'La presencia de fragmentos metálicos en licor de cacao se clasifica como peligro químico.',
        puntos: 5,
        opciones: ['Verdadero', 'Falso'],
        correcta: 1,
        explicacion: 'Falso. Es un peligro físico prevenido mediante mallas y detectores de metales.',
        obligatoria: true,
      },
    ])
    setView('builder')
  }

  function openEditExam(ex: Exam) {
    setEditingExam(ex)
    setTitulo(ex.titulo)
    setDescripcion(ex.descripcion || '')
    setTemaId(ex.capacitacionId || '')
    setEstado(ex.estado)
    setTiempoLimite(ex.config?.tiempoLimiteMinutos ?? 15)
    setNotaMinima(ex.config?.notaMinimaAprobatoria ?? 14)
    setMezclarPreguntas(ex.config?.mezclarPreguntas ?? false)
    setMostrarRespuestas(ex.config?.mostrarRespuestasAlTerminar ?? true)
    setSelectedThemeId(ex.config?.themeId || 'romex-cacao')
    setPreguntas(ex.preguntas || [])
    setView('builder')
  }

  function addQuestion(tipo: ExamQuestionType = 'multiple') {
    let defaultOptions: string[] = []
    let defaultCorrecta: any = 0

    if (tipo === 'multiple' || tipo === 'desplegable') {
      defaultOptions = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4']
      defaultCorrecta = 0
    } else if (tipo === 'casillas') {
      defaultOptions = ['Opción 1', 'Opción 2', 'Opción 3']
      defaultCorrecta = [0]
    } else if (tipo === 'verdadero_falso') {
      defaultOptions = ['Verdadero', 'Falso']
      defaultCorrecta = 0
    } else if (tipo === 'escala') {
      defaultOptions = []
      defaultCorrecta = null
    }

    const newQ: ExamQuestion = {
      id: uid(),
      tipo,
      texto: '',
      puntos: 4,
      opciones: defaultOptions,
      correcta: defaultCorrecta,
      explicacion: '',
      obligatoria: true,
      minEscala: 1,
      maxEscala: 5,
      etiquetaMin: 'Bajo',
      etiquetaMax: 'Excelente',
    }

    setPreguntas((prev) => [...prev, newQ])
  }

  function updateQuestion(id: string, patch: Partial<ExamQuestion>) {
    setPreguntas((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q
        return { ...q, ...patch }
      })
    )
  }

  function removeQuestion(id: string) {
    setPreguntas((prev) => prev.filter((q) => q.id !== id))
  }

  function duplicateQuestion(q: ExamQuestion) {
    const copy: ExamQuestion = {
      ...q,
      id: uid(),
      texto: `${q.texto} (Copia)`,
      opciones: q.opciones ? [...q.opciones] : undefined,
    }
    setPreguntas((prev) => [...prev, copy])
    toast('Pregunta duplicada', 'info')
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === preguntas.length - 1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const copy = [...preguntas]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp
    setPreguntas(copy)
  }

  const totalPuntos = useMemo(() => {
    return preguntas.reduce((acc, q) => acc + (Number(q.puntos) || 0), 0)
  }, [preguntas])

  const activeTheme = useMemo(() => {
    return FORM_THEMES.find((t) => t.id === selectedThemeId) || FORM_THEMES[0]
  }, [selectedThemeId])

  async function handleSaveExam() {
    if (!titulo.trim()) {
      toast('Ingresa un título para el examen', 'error')
      return
    }
    if (preguntas.length === 0) {
      toast('Agrega al menos una pregunta', 'error')
      return
    }
    for (let i = 0; i < preguntas.length; i++) {
      if (!preguntas[i].texto.trim()) {
        toast(`La pregunta #${i + 1} no tiene enunciado`, 'error')
        return
      }
    }

    const cap = temas.find((t) => t.id === temaId)

    const payload: Omit<Exam, 'createdAt' | 'updatedAt'> & { id?: number; createdAt?: string } = {
      id: editingExam?.id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      capacitacionId: typeof temaId === 'number' ? temaId : null,
      tema: cap?.tema || editingExam?.tema,
      estado,
      preguntas,
      config: {
        tiempoLimiteMinutos: tiempoLimite,
        notaMinimaAprobatoria: notaMinima,
        mezclarPreguntas,
        mostrarRespuestasAlTerminar: mostrarRespuestas,
        themeId: selectedThemeId,
      },
      createdAt: editingExam?.createdAt,
    }

    await saveExam(payload)
    toast(editingExam?.id ? 'Evaluación actualizada con éxito' : 'Evaluación creada con éxito', 'success')
    setView('list')
    refresh()
  }

  /* ================= LIVE EXAM TAKER HANDLERS ================= */

  function startTakingExam(ex: Exam) {
    setSelectedExam(ex)
    setTakerName('')
    setTakerDni('')
    setTakerArea('')
    setTakerStarted(false)
    setTakerAnswers({})
    setExamResult(null)
    setTimeLeft((ex.config?.tiempoLimiteMinutos || 15) * 60)
    setView('live-taker')
  }

  function handleBeginTest() {
    if (!takerName.trim()) {
      toast('Por favor, ingresa tu nombre y apellido', 'error')
      return
    }
    setTakerStarted(true)
  }

  async function handleSubmitExam(force = false) {
    if (!selectedExam) return
    if (!force) {
      const unanswered = selectedExam.preguntas.filter(
        (q) => q.obligatoria && (takerAnswers[q.id] === undefined || takerAnswers[q.id] === '')
      )
      if (unanswered.length > 0) {
        if (!confirmar(`Tienes ${unanswered.length} pregunta(s) obligatoria(s) sin responder. ¿Deseas entregar el examen de todas formas?`)) {
          return
        }
      }
    }

    let puntosObtenidos = 0
    let puntosTotales = 0

    selectedExam.preguntas.forEach((q) => {
      const pMax = Number(q.puntos) || 0
      puntosTotales += pMax
      const userAns = takerAnswers[q.id]

      if (q.tipo === 'multiple' || q.tipo === 'verdadero_falso' || q.tipo === 'desplegable') {
        if (Number(userAns) === Number(q.correcta)) {
          puntosObtenidos += pMax
        }
      } else if (q.tipo === 'casillas') {
        const correctas = Array.isArray(q.correcta) ? q.correcta.map(Number) : [Number(q.correcta)]
        const userChoices = Array.isArray(userAns) ? userAns.map(Number) : []
        const isMatch =
          correctas.length === userChoices.length &&
          correctas.every((val) => userChoices.includes(val))
        if (isMatch) {
          puntosObtenidos += pMax
        }
      } else if (q.tipo === 'escala') {
        if (userAns !== undefined && userAns !== null) {
          puntosObtenidos += pMax
        }
      } else if (q.tipo === 'abierta') {
        if (typeof userAns === 'string' && userAns.trim().length > 3) {
          puntosObtenidos += pMax
        }
      }
    })

    const notaBase20 = puntosTotales > 0 ? (puntosObtenidos / puntosTotales) * 20 : 0
    const porcentaje = puntosTotales > 0 ? Math.round((puntosObtenidos / puntosTotales) * 100) : 0
    const notaMinimaRequerida = selectedExam.config?.notaMinimaAprobatoria ?? 14
    const aprobado = notaBase20 >= notaMinimaRequerida

    const totalSegundos = (selectedExam.config?.tiempoLimiteMinutos || 15) * 60
    const tiempoEmpleado = Math.max(0, totalSegundos - timeLeft)

    const submissionData: Omit<ExamSubmission, 'id' | 'fecha'> = {
      examId: selectedExam.id!,
      capacitacionId: selectedExam.capacitacionId,
      evaluadoNombre: takerName.trim(),
      evaluadoDni: takerDni.trim(),
      evaluadoArea: takerArea.trim(),
      respuestas: takerAnswers,
      puntajeObtenido: puntosObtenidos,
      puntajeMaximo: puntosTotales,
      notaBase20,
      porcentaje,
      aprobado,
      tiempoEmpleadoSegundos: tiempoEmpleado,
    }

    const subId = await saveExamSubmission(submissionData)
    const fullSubmission: ExamSubmission = {
      ...submissionData,
      id: subId,
      fecha: new Date().toISOString(),
    }

    setExamResult(fullSubmission)
    toast(aprobado ? '¡Felicitaciones! Has aprobado el examen 🎉' : 'Examen finalizado', aprobado ? 'success' : 'info')
  }

  /* ================= ANALYTICS HANDLERS ================= */

  async function openAnalytics(ex: Exam) {
    setAnalyticsExam(ex)
    const subs = await listSubmissionsByExam(ex.id!)
    setSubmissions(subs)
    setView('analytics')
  }

  async function handleDeleteSubmission(id: number) {
    if (!confirmar('¿Eliminar este registro de evaluación?')) return
    await deleteSubmission(id)
    if (analyticsExam?.id) {
      setSubmissions(await listSubmissionsByExam(analyticsExam.id))
    }
    toast('Registro eliminado', 'success')
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchSearch =
        !analyticsSearch ||
        s.evaluadoNombre.toLowerCase().includes(analyticsSearch.toLowerCase()) ||
        (s.evaluadoDni && s.evaluadoDni.includes(analyticsSearch)) ||
        (s.evaluadoArea && s.evaluadoArea.toLowerCase().includes(analyticsSearch.toLowerCase()))

      if (!matchSearch) return false
      if (analyticsFilter === 'aprobados') return s.aprobado
      if (analyticsFilter === 'desaprobados') return !s.aprobado
      return true
    })
  }, [submissions, analyticsSearch, analyticsFilter])

  const statsAnalytics = useMemo(() => {
    const total = submissions.length
    if (total === 0) return { total: 0, aprobados: 0, tasaAprobacion: 0, promedio: 0, max: 0, min: 0 }
    const aprobados = submissions.filter((s) => s.aprobado).length
    const tasaAprobacion = Math.round((aprobados / total) * 100)
    const sum = submissions.reduce((acc, s) => acc + s.notaBase20, 0)
    const promedio = +(sum / total).toFixed(1)
    const max = +Math.max(...submissions.map((s) => s.notaBase20)).toFixed(1)
    const min = +Math.min(...submissions.map((s) => s.notaBase20)).toFixed(1)
    return { total, aprobados, tasaAprobacion, promedio, max, min }
  }, [submissions])

  async function handleDeleteExam(id: number) {
    if (!confirmar('¿Eliminar esta evaluación y todos sus registros de respuestas?')) return
    await deleteExam(id)
    await refresh()
    toast('Evaluación eliminada', 'success')
  }

  function handleShareLink(ex: Exam) {
    const url = `${window.location.origin}/#/examenes?id=${ex.id}`
    navigator.clipboard.writeText(url)
    toast('Enlace copiado al portapapeles', 'info')
  }

  return (
    <div className="h-full flex flex-col select-none">
      {/* ================= 1. VISTA LISTA DE EXÁMENES ================= */}
      {view === 'list' && (
        <>
          <div className="page-header px-7 py-5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--accent)' }}>
                    <ClipboardList size={18} />
                  </div>
                  <h1 className="text-[22px] font-bold tracking-tight">Evaluaciones & Formularios (Forms)</h1>
                </div>
                <p className="text-[13px] mt-1 text-[var(--text-secondary)]">
                  Suite de evaluación interactiva estilo Microsoft Forms con temas personalizables, autocalificación y certificados.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-primary" onClick={openNewExam}>
                  <Plus size={16} /> Nueva Evaluación
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-7">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Cargando evaluaciones…</p>
            ) : exams.length === 0 ? (
              <div className="card p-16 text-center max-w-lg mx-auto">
                <ClipboardList size={36} className="mx-auto mb-3 text-[var(--text-muted)]" />
                <p className="text-[15px] font-semibold">Sin evaluaciones creadas</p>
                <p className="text-[13px] mt-1 mb-4 text-[var(--text-secondary)]">
                  Crea evaluaciones interactivas con autocalificación para medir la competencia del personal.
                </p>
                <button type="button" className="btn btn-primary" onClick={openNewExam}>
                  <Plus size={15} /> Crear primera evaluación
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in">
                {exams.map((ex) => {
                  const cardTheme = FORM_THEMES.find((t) => t.id === ex.config?.themeId) || FORM_THEMES[0]
                  return (
                    <div
                      key={ex.id}
                      className="card p-5 flex flex-col justify-between hover:shadow-lg transition-all border group relative overflow-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: cardTheme.accentColor }} />

                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              background: ex.estado === 'Activo' ? 'var(--success-soft)' : 'var(--surface-2)',
                              color: ex.estado === 'Activo' ? 'var(--success)' : 'var(--text-secondary)',
                            }}
                          >
                            ● {ex.estado}
                          </span>
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleShareLink(ex)}
                              title="Copiar enlace"
                              aria-label="Compartir evaluación"
                            >
                              <Share2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => openEditExam(ex)}
                              title="Editar formulario"
                              aria-label="Editar evaluación"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => ex.id && handleDeleteExam(ex.id)}
                              title="Eliminar"
                              aria-label="Eliminar evaluación"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-[16px] font-bold leading-tight mb-1 text-[var(--text)] line-clamp-2">
                          {ex.titulo}
                        </h3>
                        <p className="text-[12px] line-clamp-2 mb-3 text-[var(--text-secondary)]">
                          {ex.descripcion || ex.tema || 'Evaluación técnica de inocuidad'}
                        </p>

                        <div className="flex flex-wrap gap-2 text-[11px] mb-4 text-[var(--text-muted)]">
                          <span className="inline-flex items-center gap-1">
                            <HelpCircle size={13} /> {ex.preguntas?.length || 0} preguntas
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock size={13} /> {ex.config?.tiempoLimiteMinutos || 15} min
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Award size={13} /> Min. {ex.config?.notaMinimaAprobatoria || 14}/20
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--border)' }}>
                        <button
                          type="button"
                          className="btn btn-ghost text-[12px] py-1 h-8 flex-1"
                          onClick={() => openAnalytics(ex)}
                        >
                          <BarChart3 size={14} /> Analíticas
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary text-[12px] py-1 h-8 flex-1 font-semibold"
                          onClick={() => startTakingExam(ex)}
                        >
                          <Play size={13} /> Rendir
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= 2. CONSTRUCTOR VISUAL DE FORMULARIOS ESTILO FORMS ================= */}
      {view === 'builder' && (
        <div className="h-full flex flex-col animate-in">
          {/* Header Builder */}
          <div className="page-header px-7 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="btn-icon"
                onClick={() => setView('list')}
                title="Volver"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Microsoft Forms Studio
                </span>
                <h1 className="text-[18px] font-bold tracking-tight">
                  {editingExam?.id ? 'Editar Evaluación' : 'Nueva Evaluación'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)] border" style={{ borderColor: 'var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTabBuilder('preguntas')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    activeTabBuilder === 'preguntas' ? 'bg-[var(--surface)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  📝 Preguntas ({preguntas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabBuilder('config')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    activeTabBuilder === 'config' ? 'bg-[var(--surface)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  ⚙️ Opciones & Puntos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabBuilder('theme')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 ${
                    activeTabBuilder === 'theme' ? 'bg-[var(--surface)] shadow-sm text-[var(--primary)]' : 'text-[var(--text-secondary)]'
                  }`}
                >
                  <Palette size={14} /> Tema Visual
                </button>
              </div>

              <button type="button" className="btn btn-primary" onClick={handleSaveExam}>
                <Save size={15} /> Guardar Formulario
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-7 max-w-4xl mx-auto w-full">
            {/* Header del Formulario */}
            <div className="card mb-6 shadow-sm overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div className="h-20 px-6 flex items-center justify-between text-white" style={{ background: activeTheme.headerBg }}>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">EXPORTADORA ROMEX S.A.</div>
                  <div className="text-[14px] font-semibold">Sistema de Evaluación de Competencias</div>
                </div>
                <div className="text-[12px] font-bold bg-white/20 px-3 py-1 rounded-full">
                  Tema: {activeTheme.name}
                </div>
              </div>

              <div className="p-6">
                <input
                  className="input w-full text-[20px] font-extrabold py-2 border-0 focus:ring-0 focus:border-b mb-2 px-0 bg-transparent"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Escribe el título del examen aquí…"
                />
                <textarea
                  className="w-full text-[13px] border-0 border-b p-1 focus:ring-0 resize-none bg-transparent"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Escribe una descripción o instrucciones para los evaluados…"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                      Tema del Programa de Capacitación
                    </label>
                    <select
                      className="input w-full text-[12px]"
                      value={temaId === '' ? '' : String(temaId)}
                      onChange={(e) => setTemaId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">— Sin vincular / Evaluación Independiente —</option>
                      {temas.map((t) => (
                        <option key={t.id} value={t.id}>{t.tema}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1 text-[var(--text-muted)]">
                      Estado de Disponibilidad
                    </label>
                    <select
                      className="input w-full text-[12px]"
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as any)}
                    >
                      <option value="Activo">🟢 Activo (Abierto para responder)</option>
                      <option value="Borrador">🟡 Borrador (En diseño)</option>
                      <option value="Cerrado">🔴 Cerrado (Respuestas desactivadas)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: PREGUNTAS */}
            {activeTabBuilder === 'preguntas' && (
              <div className="space-y-4">
                {preguntas.map((q, idx) => (
                  <div
                    key={q.id}
                    className="card p-5 transition-all shadow-sm border"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary-text)] font-bold text-[12px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <select
                          className="input h-8 text-[12px] font-medium py-0"
                          value={q.tipo}
                          onChange={(e) => {
                            const newTipo = e.target.value as ExamQuestionType
                            let ops = q.opciones
                            let corr = q.correcta
                            if (newTipo === 'verdadero_falso') {
                              ops = ['Verdadero', 'Falso']
                              corr = 0
                            } else if (newTipo === 'multiple' || newTipo === 'desplegable') {
                              ops = ops && ops.length > 0 ? ops : ['Opción 1', 'Opción 2']
                              corr = 0
                            } else if (newTipo === 'casillas') {
                              ops = ops && ops.length > 0 ? ops : ['Opción 1', 'Opción 2']
                              corr = [0]
                            }
                            updateQuestion(q.id, { tipo: newTipo, opciones: ops, correcta: corr })
                          }}
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.type} value={t.type}>{t.icon} {t.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-[var(--text-muted)]">Puntos:</span>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            className="input h-8 w-14 text-center font-bold text-[12px] py-0"
                            value={q.puntos}
                            onChange={(e) => updateQuestion(q.id, { puntos: Number(e.target.value) || 1 })}
                          />
                        </div>
                        <button type="button" className="btn-icon" onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} title="Mover arriba">
                          <ArrowUp size={14} />
                        </button>
                        <button type="button" className="btn-icon" onClick={() => moveQuestion(idx, 'down')} disabled={idx === preguntas.length - 1} title="Mover abajo">
                          <ArrowDown size={14} />
                        </button>
                        <button type="button" className="btn-icon" onClick={() => duplicateQuestion(q)} title="Duplicar">
                          <Copy size={14} />
                        </button>
                        <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeQuestion(q.id)} title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <input
                      className="input w-full font-medium mb-3"
                      value={q.texto}
                      onChange={(e) => updateQuestion(q.id, { texto: e.target.value })}
                      placeholder="Escribe el enunciado de la pregunta aquí…"
                    />

                    {/* Opciones */}
                    {(q.tipo === 'multiple' || q.tipo === 'casillas' || q.tipo === 'desplegable') && (
                      <div className="space-y-2 mb-3">
                        <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                          Opciones (Marca la(s) correcta(s)):
                        </div>
                        {(q.opciones || []).map((op, opIdx) => {
                          const isCorrect =
                            q.tipo === 'casillas'
                              ? Array.isArray(q.correcta) && q.correcta.includes(opIdx)
                              : Number(q.correcta) === opIdx

                          return (
                            <div key={opIdx} className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (q.tipo === 'casillas') {
                                    const current = Array.isArray(q.correcta) ? [...q.correcta] : []
                                    const next = current.includes(opIdx)
                                      ? current.filter((x) => x !== opIdx)
                                      : [...current, opIdx]
                                    updateQuestion(q.id, { correcta: next })
                                  } else {
                                    updateQuestion(q.id, { correcta: opIdx })
                                  }
                                }}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                                  isCorrect
                                    ? 'bg-[var(--success)] text-white shadow-sm'
                                    : 'border border-[var(--border)] text-transparent hover:border-[var(--success)]'
                                }`}
                                title={isCorrect ? 'Respuesta correcta' : 'Marcar como correcta'}
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>

                              <input
                                className="input flex-1 h-8 text-[13px]"
                                value={op}
                                onChange={(e) => {
                                  const newOps = [...(q.opciones || [])]
                                  newOps[opIdx] = e.target.value
                                  updateQuestion(q.id, { opciones: newOps })
                                }}
                                placeholder={`Opción ${opIdx + 1}`}
                              />

                              <button
                                type="button"
                                className="btn-icon h-7 w-7 text-[var(--text-muted)] hover:text-[var(--danger)]"
                                onClick={() => {
                                  const newOps = (q.opciones || []).filter((_, i) => i !== opIdx)
                                  updateQuestion(q.id, { opciones: newOps })
                                }}
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )
                        })}

                        <button
                          type="button"
                          className="text-[12px] font-semibold text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1"
                          onClick={() => {
                            const newOps = [...(q.opciones || []), `Opción ${(q.opciones?.length || 0) + 1}`]
                            updateQuestion(q.id, { opciones: newOps })
                          }}
                        >
                          + Añadir otra opción
                        </button>
                      </div>
                    )}

                    {/* V/F */}
                    {q.tipo === 'verdadero_falso' && (
                      <div className="flex gap-3 mb-3">
                        {['Verdadero', 'Falso'].map((vf, vfIdx) => {
                          const isCorrect = Number(q.correcta) === vfIdx
                          return (
                            <button
                              key={vf}
                              type="button"
                              onClick={() => updateQuestion(q.id, { correcta: vfIdx })}
                              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border flex items-center justify-center gap-2 transition-all ${
                                isCorrect
                                  ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success)]'
                                  : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border-transparent'
                              }`}
                            >
                              {isCorrect && <Check size={14} />} {vf} {isCorrect ? '(Correcta)' : ''}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Retroalimentación */}
                    <div className="mt-3 pt-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                      <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
                      <input
                        className="input h-7 text-[11px] flex-1 border-0 bg-transparent px-1 focus:bg-[var(--surface)]"
                        placeholder="Explicación pedagógica para el alumno al revisar su prueba…"
                        value={q.explicacion || ''}
                        onChange={(e) => updateQuestion(q.id, { explicacion: e.target.value })}
                      />
                    </div>
                  </div>
                ))}

                {/* Agregar Preguntas */}
                <div className="card p-4 flex flex-wrap items-center justify-center gap-2 border-dashed">
                  <span className="text-[13px] font-semibold mr-2 text-[var(--text-secondary)]">
                    Añadir pregunta:
                  </span>
                  {QUESTION_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => addQuestion(t.type)}
                      className="btn btn-ghost text-[12px] h-8 px-3"
                    >
                      {t.icon} {t.label.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: CONFIGURACIÓN */}
            {activeTabBuilder === 'config' && (
              <div className="card p-6 space-y-5 animate-in">
                <h3 className="text-[15px] font-bold">Opciones Avanzadas del Formulario</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold mb-1">
                      Tiempo límite (Minutos)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      className="input w-full"
                      value={tiempoLimite}
                      onChange={(e) => setTiempoLimite(Number(e.target.value) || 15)}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold mb-1">
                      Nota mínima aprobatoria (Base 20)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      className="input w-full"
                      value={notaMinima}
                      onChange={(e) => setNotaMinima(Number(e.target.value) || 14)}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={mostrarRespuestas}
                      onChange={(e) => setMostrarRespuestas(e.target.checked)}
                    />
                    <span>Mostrar respuestas correctas y explicaciones al terminar</span>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={mezclarPreguntas}
                      onChange={(e) => setMezclarPreguntas(e.target.checked)}
                    />
                    <span>Mezclar orden de preguntas aleatoriamente</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: TEMAS VISUALES ESTILO MICROSOFT FORMS */}
            {activeTabBuilder === 'theme' && (
              <div className="card p-6 space-y-5 animate-in">
                <div>
                  <h3 className="text-[16px] font-bold">Galería de Temas Visuales</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                    Elige el fondo temático y estilo que verá el evaluado al responder la prueba.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {FORM_THEMES.map((theme) => {
                    const isSelected = selectedThemeId === theme.id
                    return (
                      <div
                        key={theme.id}
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`rounded-2xl p-4 cursor-pointer transition-all border-2 text-white flex flex-col justify-between h-36 shadow-sm hover:scale-[1.02] ${
                          isSelected ? 'ring-4 ring-[var(--primary)] border-white' : 'border-transparent opacity-90 hover:opacity-100'
                        }`}
                        style={{ background: theme.bgStyle }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-[13px]">{theme.name}</span>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xs shadow-md">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="h-6 w-20 rounded-md bg-white/20 backdrop-blur-xs flex items-center justify-center text-[10px] font-bold">
                          ROMEX Forms
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 3. MODO TOMA DE EXAMEN EN VIVO CON TEMA VISUAL INMERSIVO ================= */}
      {view === 'live-taker' && selectedExam && (
        <div
          className="h-full flex flex-col overflow-auto animate-in"
          style={{
            background: (FORM_THEMES.find((t) => t.id === selectedExam.config?.themeId) || FORM_THEMES[0]).bgStyle,
          }}
        >
          {!takerStarted ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="card p-8 max-w-lg w-full shadow-2xl text-center backdrop-blur-md bg-white/95 border-0 rounded-3xl">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4 shadow-md">
                  <ClipboardList size={32} />
                </div>
                <h2 className="text-[24px] font-black text-slate-900 mb-1 leading-tight">{selectedExam.titulo}</h2>
                <p className="text-[13px] text-slate-600 mb-6">
                  {selectedExam.descripcion || 'Evaluación oficial de competencias y conocimientos técnicos.'}
                </p>

                <div className="space-y-4 text-left mb-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                      Nombre y Apellido *
                    </label>
                    <input
                      className="input w-full font-medium"
                      placeholder="Ej. Juan Pérez García"
                      value={takerName}
                      onChange={(e) => setTakerName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                        DNI / Documento
                      </label>
                      <input
                        className="input w-full"
                        placeholder="8 dígitos"
                        value={takerDni}
                        onChange={(e) => setTakerDni(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-slate-500">
                        Área / Puesto
                      </label>
                      <input
                        className="input w-full"
                        placeholder="Ej. Producción"
                        value={takerArea}
                        onChange={(e) => setTakerArea(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 text-[12px] text-left mb-6 flex justify-between text-slate-700 font-medium">
                  <span>⏱️ Tiempo: <strong>{selectedExam.config?.tiempoLimiteMinutos || 15} min</strong></span>
                  <span>❓ Preguntas: <strong>{selectedExam.preguntas.length}</strong></span>
                  <span>🎯 Min: <strong>{selectedExam.config?.notaMinimaAprobatoria || 14}/20</strong></span>
                </div>

                <div className="flex gap-3">
                  <button type="button" className="btn btn-ghost flex-1 h-11 text-[13px]" onClick={() => setView('list')}>
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-primary flex-1 h-11 text-[13px] font-bold shadow-md" onClick={handleBeginTest}>
                    Iniciar Evaluación
                  </button>
                </div>
              </div>
            </div>
          ) : !examResult ? (
            /* Examen en progreso inmersivo */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-7 py-3 flex items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md bg-white/90 shadow-sm">
                <div>
                  <h2 className="text-[15px] font-bold truncate max-w-md text-slate-900">{selectedExam.titulo}</h2>
                  <span className="text-[11px] text-slate-500 font-medium">Participante: {takerName}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[13px] font-bold ${
                      timeLeft < 180 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    <Clock size={15} />
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </div>
                  <button type="button" className="btn btn-primary h-8 text-[12px] font-bold" onClick={() => handleSubmitExam(false)}>
                    Entregar Examen
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-7 max-w-3xl mx-auto w-full space-y-6">
                {selectedExam.preguntas.map((q, idx) => (
                  <div key={q.id} className="card p-6 shadow-xl border-0 rounded-2xl bg-white/95 backdrop-blur-xs">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-7 h-7 rounded-lg bg-[#0f4c81] text-white font-bold text-[13px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="text-[15px] font-bold text-slate-900 leading-snug">{q.texto}</h4>
                        <span className="text-[11px] text-slate-400 font-semibold">{q.puntos} punto(s)</span>
                      </div>
                    </div>

                    {(q.tipo === 'multiple' || q.tipo === 'desplegable') && (
                      <div className="space-y-2 ml-10">
                        {(q.opciones || []).map((op, opIdx) => (
                          <label
                            key={opIdx}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                              takerAnswers[q.id] === opIdx
                                ? 'bg-sky-50 border-[#0f4c81] text-[#0f4c81] font-bold shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={takerAnswers[q.id] === opIdx}
                              onChange={() => setTakerAnswers((prev) => ({ ...prev, [q.id]: opIdx }))}
                              className="w-4 h-4 text-[#0f4c81]"
                            />
                            <span className="text-[13px] text-slate-800">{op}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.tipo === 'casillas' && (
                      <div className="space-y-2 ml-10">
                        {(q.opciones || []).map((op, opIdx) => {
                          const current: number[] = Array.isArray(takerAnswers[q.id]) ? takerAnswers[q.id] : []
                          const isChecked = current.includes(opIdx)
                          return (
                            <label
                              key={opIdx}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                isChecked
                                  ? 'bg-sky-50 border-[#0f4c81] text-[#0f4c81] font-bold shadow-xs'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const next = isChecked ? current.filter((x) => x !== opIdx) : [...current, opIdx]
                                  setTakerAnswers((prev) => ({ ...prev, [q.id]: next }))
                                }}
                                className="w-4 h-4 rounded text-[#0f4c81]"
                              />
                              <span className="text-[13px] text-slate-800">{op}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {q.tipo === 'verdadero_falso' && (
                      <div className="grid grid-cols-2 gap-3 ml-10">
                        {['Verdadero', 'Falso'].map((vf, vfIdx) => (
                          <button
                            key={vf}
                            type="button"
                            onClick={() => setTakerAnswers((prev) => ({ ...prev, [q.id]: vfIdx }))}
                            className={`py-3.5 rounded-xl text-[14px] font-bold border transition-all ${
                              takerAnswers[q.id] === vfIdx
                                ? 'bg-sky-50 border-[#0f4c81] text-[#0f4c81] shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {vf}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.tipo === 'abierta' && (
                      <div className="ml-10">
                        <textarea
                          className="input w-full min-h-[80px] p-3 text-[13px]"
                          placeholder="Escribe tu respuesta aquí…"
                          value={takerAnswers[q.id] || ''}
                          onChange={(e) => setTakerAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-4 pb-12 text-center">
                  <button type="button" className="btn btn-primary px-10 h-12 text-[15px] font-bold shadow-xl" onClick={() => handleSubmitExam(false)}>
                    Entregar y Finalizar Evaluación
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Resultados */
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="card p-8 max-w-lg w-full text-center shadow-2xl rounded-3xl bg-white/95 backdrop-blur-md animate-in">
                <div
                  className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                    examResult.aprobado ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {examResult.aprobado ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
                </div>

                <h2 className="text-[24px] font-black text-slate-900 tracking-tight">
                  {examResult.aprobado ? '¡Felicitaciones! Aprobaste' : 'Evaluación No Aprobada'}
                </h2>
                <p className="text-[13px] text-slate-600 mt-1 mb-6">
                  {examResult.aprobado
                    ? selectedExam.config?.mensajeAprobado || 'Has demostrado los conocimientos requeridos en esta capacitación.'
                    : selectedExam.config?.mensajeDesaprobado || 'Te recomendamos repasar el material y volver a intentarlo.'}
                </p>

                <div className="p-5 rounded-2xl bg-slate-100 mb-6 grid grid-cols-3 gap-2 text-slate-800">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Calificación</div>
                    <div className="text-[26px] font-extrabold text-[#0f4c81]">{examResult.notaBase20.toFixed(1)}/20</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Porcentaje</div>
                    <div className="text-[26px] font-extrabold">{examResult.porcentaje}%</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400">Puntos</div>
                    <div className="text-[26px] font-extrabold">{examResult.puntajeObtenido}/{examResult.puntajeMaximo}</div>
                  </div>
                </div>

                {examResult.aprobado && (
                  <button
                    type="button"
                    className="btn btn-primary w-full mb-3 h-11 text-[13px] font-bold shadow-md"
                    onClick={() => generateCertificatePDF(examResult, selectedExam)}
                  >
                    <Award size={18} /> Descargar Certificado Oficial (PDF)
                  </button>
                )}

                <div className="flex gap-2">
                  {selectedExam.config?.mostrarRespuestasAlTerminar && (
                    <button
                      type="button"
                      className="btn btn-ghost flex-1 text-[12px]"
                      onClick={() => setShowReviewModal(true)}
                    >
                      <Eye size={14} /> Ver Respuestas
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost flex-1 text-[12px]"
                    onClick={() => setView('list')}
                  >
                    Volver al Inicio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= 4. ANALÍTICAS Y RESPUESTAS ================= */}
      {view === 'analytics' && analyticsExam && (
        <div className="h-full flex flex-col animate-in">
          <div className="page-header px-7 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <button type="button" className="btn-icon" onClick={() => setView('list')} title="Volver">
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Analíticas & Resultados
                </span>
                <h1 className="text-[18px] font-bold tracking-tight">{analyticsExam.titulo}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-ghost text-[12px]"
                onClick={() => exportSubmissionsExcel(submissions, analyticsExam)}
                disabled={submissions.length === 0}
              >
                <FileSpreadsheet size={14} /> Exportar Excel
              </button>
              <button
                type="button"
                className="btn btn-ghost text-[12px]"
                onClick={() => exportExamSummaryPDF(analyticsExam, submissions)}
                disabled={submissions.length === 0}
              >
                <FileText size={14} /> Informe PDF
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <div className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Evaluados</div>
                <div className="text-[26px] font-extrabold mt-1">{statsAnalytics.total}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Colaboradores</div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Tasa Aprobación</div>
                <div className="text-[26px] font-extrabold mt-1 text-[var(--success)]">{statsAnalytics.tasaAprobacion}%</div>
                <div className="text-[11px] text-[var(--text-muted)]">{statsAnalytics.aprobados} de {statsAnalytics.total}</div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Nota Promedio</div>
                <div className="text-[26px] font-extrabold mt-1 text-[var(--primary)]">{statsAnalytics.promedio}/20</div>
                <div className="text-[11px] text-[var(--text-muted)]">Escala vigesimal</div>
              </div>
              <div className="card p-4">
                <div className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Rango de Notas</div>
                <div className="text-[26px] font-extrabold mt-1">{statsAnalytics.min} - {statsAnalytics.max}</div>
                <div className="text-[11px] text-[var(--text-muted)]">Mínima y Máxima</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  className="input w-full pl-9 text-[12px]"
                  placeholder="Buscar por nombre, DNI o área…"
                  value={analyticsSearch}
                  onChange={(e) => setAnalyticsSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border" style={{ borderColor: 'var(--border)' }}>
                {(['todos', 'aprobados', 'desaprobados'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAnalyticsFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[12px] font-semibold capitalize ${
                      analyticsFilter === f ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="table-wrap p-12 text-center text-[13px] text-[var(--text-muted)]">
                No hay registros de evaluación que coincidan.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="th-row text-left">
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Colaborador</th>
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">DNI</th>
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Área</th>
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Nota</th>
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Resultado</th>
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Fecha</th>
                      <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="border-b tr-hover" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-4 py-3 font-medium">{sub.evaluadoNombre}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.evaluadoDni || '—'}</td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.evaluadoArea || '—'}</td>
                        <td className="px-4 py-3 font-bold">{sub.notaBase20.toFixed(1)}/20</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{
                              background: sub.aprobado ? 'var(--success-soft)' : 'var(--danger-soft)',
                              color: sub.aprobado ? 'var(--success)' : 'var(--danger)',
                            }}
                          >
                            {sub.aprobado ? 'APROBADO' : 'DESAPROBADO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-[12px]">
                          {new Date(sub.fecha).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {sub.aprobado && (
                              <button
                                type="button"
                                className="btn-icon"
                                style={{ color: 'var(--primary)' }}
                                title="Descargar Certificado"
                                onClick={() => generateCertificatePDF(sub, analyticsExam)}
                              >
                                <Award size={15} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ color: 'var(--danger)' }}
                              title="Eliminar registro"
                              onClick={() => sub.id && handleDeleteSubmission(sub.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Revisión */}
      {showReviewModal && selectedExam && examResult && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="modal-panel max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-[var(--surface)] z-10" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[16px] font-bold">Revisión de Respuestas</h2>
              <button type="button" className="btn-icon" onClick={() => setShowReviewModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedExam.preguntas.map((q, idx) => {
                const userAns = examResult.respuestas[q.id]
                let isCorrect = false
                if (q.tipo === 'multiple' || q.tipo === 'verdadero_falso' || q.tipo === 'desplegable') {
                  isCorrect = Number(userAns) === Number(q.correcta)
                } else if (q.tipo === 'casillas') {
                  const correctas = Array.isArray(q.correcta) ? q.correcta.map(Number) : [Number(q.correcta)]
                  const userChoices = Array.isArray(userAns) ? userAns.map(Number) : []
                  isCorrect =
                    correctas.length === userChoices.length &&
                    correctas.every((v) => userChoices.includes(v))
                }
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      isCorrect ? 'bg-[var(--success-soft)]/30 border-[var(--success)]' : 'bg-[var(--danger-soft)]/30 border-[var(--danger)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-bold">Pregunta {idx + 1}: {q.texto}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isCorrect ? 'bg-[var(--success)] text-white' : 'bg-[var(--danger)] text-white'}`}>
                        {isCorrect ? 'Correcta' : 'Incorrecta'}
                      </span>
                    </div>
                    {q.explicacion && (
                      <div className="text-[12px] text-[var(--text-secondary)] mt-2 p-2 rounded-lg bg-[var(--surface)]">
                        💡 <strong>Explicación:</strong> {q.explicacion}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
