import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, ClipboardList, Trash2, Pencil, X, Save, Play, CheckCircle2,
  XCircle, Award, BarChart3, Clock, Share2, Copy, FileSpreadsheet,
  FileText, ArrowLeft, ArrowUp, ArrowDown, Sparkles, HelpCircle, Check,
  Search, Eye, Palette, Settings, LayoutTemplate, MoreHorizontal,
  Users, Star, Filter, Presentation,
} from 'lucide-react'
import {
  seedIfEmpty, listExams, saveExam, deleteExam, listCapacitaciones,
  listSubmissionsByExam, saveExamSubmission, deleteSubmission,
  type Exam, type Capacitacion, type ExamQuestion, type ExamQuestionType, type ExamSubmission,
} from '../lib/db'
import { generateCertificatePDF, exportSubmissionsExcel, exportExamSummaryPDF } from '../lib/examReports'
import { useToast } from '../lib/toast'
import { confirmar } from '../lib/confirm'
import { FORM_THEMES } from '../lib/examThemes'

function uid() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

type ActiveView = 'list' | 'builder' | 'live-taker' | 'analytics'

const QUESTION_TYPES: { type: ExamQuestionType; label: string; icon: string }[] = [
  { type: 'multiple', label: 'Opción múltiple', icon: '🔘' },
  { type: 'casillas', label: 'Casillas', icon: '☑️' },
  { type: 'verdadero_falso', label: 'Verdadero / Falso', icon: '⚖️' },
  { type: 'abierta', label: 'Respuesta abierta', icon: '✍️' },
  { type: 'escala', label: 'Escala 1-5', icon: '⭐' },
  { type: 'desplegable', label: 'Desplegable', icon: '🔻' },
]

export default function Examenes() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState<ActiveView>('list')
  const [exams, setExams] = useState<Exam[]>([])
  const [temas, setTemas] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)

  const [editingExam, setEditingExam] = useState<Partial<Exam> | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [temaId, setTemaId] = useState<number | ''>('')
  const [estado, setEstado] = useState<'Borrador' | 'Activo' | 'Cerrado'>('Activo')
  const [tiempoLimite, setTiempoLimite] = useState(15)
  const [notaMinima, setNotaMinima] = useState(14)
  const [mezclarPreguntas, setMezclarPreguntas] = useState(false)
  const [mostrarRespuestas, setMostrarRespuestas] = useState(true)
  const [selectedThemeId, setSelectedThemeId] = useState('romex-cacao')
  const [preguntas, setPreguntas] = useState<ExamQuestion[]>([])
  const [activeTabBuilder, setActiveTabBuilder] = useState<'preguntas' | 'config' | 'theme'>('preguntas')
  const [listTab, setListTab] = useState<'recientes' | 'mios' | 'favoritos'>('recientes')
  const [stylesPanelOpen, setStylesPanelOpen] = useState(true)

  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [takerName, setTakerName] = useState('')
  const [takerDni, setTakerDni] = useState('')
  const [takerArea, setTakerArea] = useState('')
  const [takerStarted, setTakerStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [takerAnswers, setTakerAnswers] = useState<Record<string, unknown>>({})
  const [examResult, setExamResult] = useState<ExamSubmission | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const submittingRef = useRef(false)

  const [analyticsExam, setAnalyticsExam] = useState<Exam | null>(null)
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [analyticsSearch, setAnalyticsSearch] = useState('')
  const [analyticsFilter, setAnalyticsFilter] = useState<'todos' | 'aprobados' | 'desaprobados'>('todos')

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

  const refresh = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    const [e, caps] = await Promise.all([listExams(), listCapacitaciones(2026)])
    setExams(e)
    setTemas(caps)
    const targetId = searchParams.get('id') || searchParams.get('take')
    if (targetId) {
      const match = e.find((x) => String(x.id) === String(targetId))
      if (match) startTakingExam(match)
    }
    setLoading(false)
  }, [searchParams])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!takerStarted || timeLeft <= 0 || examResult) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          void handleSubmitExam(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [takerStarted, timeLeft, examResult])

  function openNewExam() {
    setEditingExam({ titulo: '', estado: 'Activo' })
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
        texto: '¿Cuál es el primer principio del sistema HACCP?',
        puntos: 5,
        opciones: [
          'Establecer límites críticos',
          'Realizar un análisis de peligros',
          'Determinar los PCC',
          'Establecer vigilancia',
        ],
        correcta: 1,
        explicacion: 'El Principio 1 es el análisis de peligros.',
        obligatoria: true,
      },
    ])
    setActiveTabBuilder('preguntas')
    setStylesPanelOpen(true)
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
    setStylesPanelOpen(true)
    setView('builder')
  }

  function addQuestion(tipo: ExamQuestionType = 'multiple') {
    let opciones: string[] = []
    let correcta: unknown = 0
    if (tipo === 'multiple' || tipo === 'desplegable') {
      opciones = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4']
    } else if (tipo === 'casillas') {
      opciones = ['Opción 1', 'Opción 2', 'Opción 3']
      correcta = [0]
    } else if (tipo === 'verdadero_falso') {
      opciones = ['Verdadero', 'Falso']
    } else if (tipo === 'escala') {
      correcta = null
    }
    setPreguntas((prev) => [
      ...prev,
      {
        id: uid(),
        tipo,
        texto: '',
        puntos: 4,
        opciones,
        correcta,
        explicacion: '',
        obligatoria: true,
        minEscala: 1,
        maxEscala: 5,
        etiquetaMin: 'Bajo',
        etiquetaMax: 'Excelente',
      },
    ])
  }

  function updateQuestion(id: string, patch: Partial<ExamQuestion>) {
    setPreguntas((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const activeTheme = useMemo(
    () => FORM_THEMES.find((t) => t.id === selectedThemeId) || FORM_THEMES[0],
    [selectedThemeId]
  )

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
    await saveExam({
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
    })
    toast(editingExam?.id ? 'Evaluación actualizada' : 'Evaluación creada', 'success')
    setView('list')
    refresh()
  }

  async function handleSubmitExam(force = false) {
    if (!selectedExam || submittingRef.current) return
    if (!force) {
      const unanswered = selectedExam.preguntas.filter(
        (q) => q.obligatoria && (takerAnswers[q.id] === undefined || takerAnswers[q.id] === '')
      )
      if (unanswered.length > 0) {
        if (!confirmar(`Tienes ${unanswered.length} pregunta(s) sin responder. ¿Entregar de todas formas?`)) return
      }
    }
    submittingRef.current = true
    let puntosObtenidos = 0
    let puntosTotales = 0
    selectedExam.preguntas.forEach((q) => {
      const pMax = Number(q.puntos) || 0
      puntosTotales += pMax
      const userAns = takerAnswers[q.id]
      if (q.tipo === 'multiple' || q.tipo === 'verdadero_falso' || q.tipo === 'desplegable') {
        if (Number(userAns) === Number(q.correcta)) puntosObtenidos += pMax
      } else if (q.tipo === 'casillas') {
        const correctas = Array.isArray(q.correcta) ? q.correcta.map(Number) : [Number(q.correcta)]
        const userChoices = Array.isArray(userAns) ? userAns.map(Number) : []
        if (correctas.length === userChoices.length && correctas.every((v) => userChoices.includes(v))) {
          puntosObtenidos += pMax
        }
      } else if (q.tipo === 'escala') {
        if (userAns !== undefined && userAns !== null) puntosObtenidos += pMax
      } else if (q.tipo === 'abierta') {
        if (typeof userAns === 'string' && userAns.trim().length > 3) puntosObtenidos += pMax
      }
    })
    const notaBase20 = puntosTotales > 0 ? (puntosObtenidos / puntosTotales) * 20 : 0
    const porcentaje = puntosTotales > 0 ? Math.round((puntosObtenidos / puntosTotales) * 100) : 0
    const notaMinimaRequerida = selectedExam.config?.notaMinimaAprobatoria ?? 14
    const aprobado = notaBase20 >= notaMinimaRequerida
    const totalSegundos = (selectedExam.config?.tiempoLimiteMinutos || 15) * 60
    const submissionData = {
      examId: selectedExam.id!,
      capacitacionId: selectedExam.capacitacionId,
      evaluadoNombre: takerName.trim() || 'Sin nombre',
      evaluadoDni: takerDni.trim(),
      evaluadoArea: takerArea.trim(),
      respuestas: takerAnswers,
      puntajeObtenido: puntosObtenidos,
      puntajeMaximo: puntosTotales,
      notaBase20,
      porcentaje,
      aprobado,
      tiempoEmpleadoSegundos: Math.max(0, totalSegundos - timeLeft),
    }
    const subId = await saveExamSubmission(submissionData)
    setExamResult({ ...submissionData, id: subId, fecha: new Date().toISOString() })
    toast(aprobado ? '¡Aprobaste el examen!' : 'Examen finalizado', aprobado ? 'success' : 'info')
    submittingRef.current = false
  }

  async function openAnalytics(ex: Exam) {
    setAnalyticsExam(ex)
    setSubmissions(await listSubmissionsByExam(ex.id!))
    setView('analytics')
  }

  async function handleDeleteExam(id: number) {
    if (!confirmar('¿Eliminar esta evaluación y todos sus registros?')) return
    await deleteExam(id)
    await refresh()
    toast('Evaluación eliminada', 'success')
  }

  function handleShareLink(ex: Exam) {
    const url = `${window.location.origin}/examenes?take=${ex.id}`
    navigator.clipboard.writeText(url)
    toast('Enlace copiado al portapapeles', 'info')
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = analyticsSearch.toLowerCase()
      const match =
        !q ||
        s.evaluadoNombre.toLowerCase().includes(q) ||
        (s.evaluadoDni || '').includes(q) ||
        (s.evaluadoArea || '').toLowerCase().includes(q)
      if (!match) return false
      if (analyticsFilter === 'aprobados') return s.aprobado
      if (analyticsFilter === 'desaprobados') return !s.aprobado
      return true
    })
  }, [submissions, analyticsSearch, analyticsFilter])

  const statsAnalytics = useMemo(() => {
    const total = submissions.length
    if (!total) return { total: 0, aprobados: 0, tasa: 0, promedio: 0 }
    const aprobados = submissions.filter((s) => s.aprobado).length
    const promedio = +(submissions.reduce((a, s) => a + s.notaBase20, 0) / total).toFixed(1)
    return { total, aprobados, tasa: Math.round((aprobados / total) * 100), promedio }
  }, [submissions])

  const themeForExam = (ex: Exam) =>
    FORM_THEMES.find((t) => t.id === ex.config?.themeId) || FORM_THEMES[0]

  /* LIST - Microsoft Forms style */
  if (view === 'list') {
    const listExamsFiltered =
      listTab === 'favoritos'
        ? exams.filter((e) => e.estado === 'Activo')
        : exams

    const TEMPLATES = [
      { id: 'quiz', title: 'Cuestionario', gradient: 'linear-gradient(135deg, #f472b6 0%, #c026d3 100%)', desc: 'Evaluación con calificación' },
      { id: 'reg', title: 'Registro', gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', desc: 'Asistencia y control' },
      { id: 'com', title: 'Comentarios', gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', desc: 'Feedback del personal' },
      { id: 'inv', title: 'Investigación', gradient: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)', desc: 'Encuesta de clima' },
    ]

    const cardGradients = [
      'linear-gradient(160deg, #a5f3fc 0%, #67e8f9 40%, #22d3ee 100%)',
      'linear-gradient(160deg, #e9d5ff 0%, #d8b4fe 40%, #c084fc 100%)',
      'linear-gradient(160deg, #bbf7d0 0%, #86efac 40%, #4ade80 100%)',
      'linear-gradient(160deg, #fde68a 0%, #fcd34d 40%, #fbbf24 100%)',
      'linear-gradient(160deg, #fecdd3 0%, #fda4af 40%, #fb7185 100%)',
      'linear-gradient(160deg, #c7d2fe 0%, #a5b4fc 40%, #818cf8 100%)',
    ]

    return (
      <div className="h-full flex flex-col" style={{ background: '#f3f4f6' }}>
        <div className="px-8 pt-6 pb-4 shrink-0" style={{ background: '#fafafa' }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button type="button" className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-white text-[13px] font-semibold shadow-sm" style={{ background: '#0f6cbd' }} onClick={openNewExam}>
              <ClipboardList size={16} /> Nuevo cuestionario
            </button>
            <button type="button" className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-semibold border" style={{ background: '#fff', borderColor: '#d1d5db', color: '#374151' }} onClick={openNewExam}>
              <FileText size={16} /> Nuevo formulario
            </button>
            <button type="button" className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-[13px] font-semibold border" style={{ background: '#fff', borderColor: '#d1d5db', color: '#374151' }}>
              <LayoutTemplate size={16} /> Importación rápida
            </button>
          </div>

          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold" style={{ color: '#374151' }}>Explorar plantillas</h2>
            <button type="button" className="text-[12px] font-medium" style={{ color: '#0f6cbd' }}>Galería de plantillas →</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={openNewExam}
                className="shrink-0 w-[160px] rounded-xl overflow-hidden border text-left transition-transform hover:scale-[1.02] hover:shadow-md"
                style={{ borderColor: '#e5e7eb', background: '#fff' }}
              >
                <div className="h-20 flex items-center justify-center text-white" style={{ background: t.gradient }}>
                  <ClipboardList size={28} strokeWidth={1.5} />
                </div>
                <div className="px-3 py-2">
                  <div className="text-[13px] font-semibold" style={{ color: '#1f2937' }}>{t.title}</div>
                  <div className="text-[11px]" style={{ color: '#6b7280' }}>{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-8 py-4">
          <div className="flex flex-wrap items-center gap-1 border-b mb-5" style={{ borderColor: '#e5e7eb' }}>
            {([
              { id: 'recientes' as const, label: 'Recientes', icon: Clock },
              { id: 'mios' as const, label: 'Mis formularios', icon: FileText },
              { id: 'favoritos' as const, label: 'Favoritos', icon: Star },
            ]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium relative"
                style={{
                  color: listTab === tab.id ? '#0f6cbd' : '#6b7280',
                  borderBottom: listTab === tab.id ? '2px solid #0f6cbd' : '2px solid transparent',
                }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <div className="relative mb-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
              <input className="h-8 pl-9 pr-3 rounded-lg text-[12px] border" style={{ borderColor: '#d1d5db', background: '#fff', width: 200 }} placeholder="Filtrar por palabra clave" />
            </div>
          </div>

          {loading ? (
            <p className="text-sm" style={{ color: '#9ca3af' }}>Cargando formularios…</p>
          ) : listExamsFiltered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-16 text-center max-w-lg mx-auto" style={{ borderColor: '#d1d5db', background: '#fff' }}>
              <ClipboardList size={40} className="mx-auto mb-3" style={{ color: '#9ca3af' }} />
              <p className="text-[15px] font-semibold" style={{ color: '#374151' }}>Aún no hay formularios</p>
              <p className="text-[13px] mt-1 mb-5" style={{ color: '#6b7280' }}>
                Crea un cuestionario con calificación automática para medir competencias del personal.
              </p>
              <button type="button" className="inline-flex items-center gap-2 h-10 px-5 rounded-full text-white text-[13px] font-semibold" style={{ background: '#0f6cbd' }} onClick={openNewExam}>
                <Plus size={15} /> Crear primer cuestionario
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in">
              {listExamsFiltered.map((ex, i) => {
                const th = themeForExam(ex)
                return (
                  <div
                    key={ex.id}
                    className="rounded-xl overflow-hidden border bg-white transition-shadow hover:shadow-lg group cursor-pointer"
                    style={{ borderColor: '#e5e7eb' }}
                    onClick={() => openEditExam(ex)}
                  >
                    <div className="h-[120px] relative flex items-center justify-center" style={{ background: cardGradients[i % cardGradients.length] }}>
                      <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 70% 30%, ${th.accentColor}44, transparent 60%)` }} />
                      <ClipboardList size={36} style={{ color: '#1f2937', opacity: 0.35 }} />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow" onClick={(e) => { e.stopPropagation(); handleShareLink(ex) }} title="Compartir"><Share2 size={13} /></button>
                        <button type="button" className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow" onClick={(e) => { e.stopPropagation(); openEditExam(ex) }} title="Editar"><Pencil size={13} /></button>
                        <button type="button" className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow text-red-600" onClick={(e) => { e.stopPropagation(); ex.id && handleDeleteExam(ex.id) }} title="Eliminar"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 mb-1" style={{ color: '#1f2937' }}>{ex.titulo}</h3>
                      <p className="text-[11px] mb-2 truncate" style={{ color: '#6b7280' }}>
                        ROMEX · {ex.tema || 'Calidad'} · {ex.estado}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px]" style={{ color: '#9ca3af' }}>
                          {ex.preguntas?.length || 0} preg. · {ex.config?.tiempoLimiteMinutos || 15} min
                        </span>
                        <div className="flex gap-1">
                          <button type="button" className="text-[11px] font-semibold px-2 py-1 rounded-md hover:bg-slate-100" style={{ color: '#0f6cbd' }} onClick={(e) => { e.stopPropagation(); openAnalytics(ex) }}>
                            Respuestas
                          </button>
                          <button type="button" className="text-[11px] font-semibold px-2 py-1 rounded-md text-white" style={{ background: '#0f6cbd' }} onClick={(e) => { e.stopPropagation(); startTakingExam(ex) }}>
                            Rendir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* BUILDER - Microsoft Forms editor */
  if (view === 'builder') {
    return (
      <div className="h-full flex flex-col animate-in" style={{ background: 'linear-gradient(180deg, #e8e0f0 0%, #f0eaf7 40%, #f5f3f8 100%)' }}>
        <div className="h-12 flex items-center justify-between px-4 shrink-0 border-b" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(0,0,0,0.06)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" className="btn-icon" onClick={() => setView('list')} title="Volver"><ArrowLeft size={18} /></button>
            <ClipboardList size={18} style={{ color: '#7c3aed' }} />
            <input
              className="bg-transparent border-0 outline-none text-[14px] font-semibold max-w-[280px] truncate"
              style={{ color: '#1f2937' }}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título del formulario"
            />
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#ede9fe', color: '#6d28d9' }}>
              {estado === 'Activo' ? 'Guardado' : estado}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 ${stylesPanelOpen ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-white/60'}`} onClick={() => { setActiveTabBuilder('theme'); setStylesPanelOpen(true) }}>
              <Palette size={14} /> Estilo
            </button>
            <button type="button" className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 ${activeTabBuilder === 'config' ? 'bg-violet-100 text-violet-700' : 'text-slate-600 hover:bg-white/60'}`} onClick={() => setActiveTabBuilder('config')}>
              <Settings size={14} /> Configuración
            </button>
            <button type="button" className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-white/60 flex items-center gap-1.5" onClick={() => toast('Vista previa: guarda y usa Rendir', 'info')}>
              <Eye size={14} /> Vista previa
            </button>
            <button type="button" className="h-8 px-4 rounded-full text-white text-[12px] font-semibold flex items-center gap-1.5" style={{ background: '#7c3aed' }} onClick={handleSaveExam}>
              <Save size={14} /> Guardar
            </button>
            <button type="button" className="h-8 px-3 rounded-full text-[12px] font-semibold border flex items-center gap-1.5" style={{ borderColor: '#c4b5fd', color: '#6d28d9', background: '#fff' }} onClick={() => toast('Activa el estado Activo y comparte el enlace', 'info')}>
              <BarChart3 size={14} /> Ver respuestas
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-6 lg:p-8">
            <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-5 items-start">
              <div className="w-full lg:w-[280px] shrink-0 rounded-2xl overflow-hidden shadow-lg bg-white border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="h-40 flex items-center justify-center relative" style={{ background: activeTheme.headerBg }}>
                  <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 70%, #fff, transparent)' }} />
                  <Presentation size={48} className="text-white/80" />
                </div>
                <div className="p-5 text-center">
                  <input
                    className="w-full text-center text-[18px] font-bold border-0 outline-none mb-2"
                    style={{ color: '#4c1d95' }}
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título del cuestionario"
                  />
                  <textarea
                    className="w-full text-center text-[13px] border-0 outline-none resize-none"
                    style={{ color: '#6b7280' }}
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="¡Está invitado, realiza tu evaluación!"
                  />
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <select className="input w-full text-[12px] h-8" value={temaId === '' ? '' : String(temaId)} onChange={(e) => setTemaId(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">— Vincular capacitación —</option>
                      {temas.map((t) => <option key={t.id} value={t.id}>{t.tema}</option>)}
                    </select>
                    <select className="input w-full text-[12px] h-8" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
                      <option value="Activo">Activo</option>
                      <option value="Borrador">Borrador</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-3 w-full">
                {activeTabBuilder === 'config' ? (
                  <div className="rounded-2xl bg-white p-6 shadow-md border space-y-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                    <h3 className="text-[15px] font-bold" style={{ color: '#1f2937' }}>Configuración del cuestionario</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="block text-[12px] font-semibold" style={{ color: '#4b5563' }}>Tiempo límite (min)
                        <input type="number" min={1} max={120} className="input w-full mt-1" value={tiempoLimite} onChange={(e) => setTiempoLimite(Number(e.target.value) || 15)} />
                      </label>
                      <label className="block text-[12px] font-semibold" style={{ color: '#4b5563' }}>Nota mínima /20
                        <input type="number" min={1} max={20} className="input w-full mt-1" value={notaMinima} onChange={(e) => setNotaMinima(Number(e.target.value) || 14)} />
                      </label>
                    </div>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={mostrarRespuestas} onChange={(e) => setMostrarRespuestas(e.target.checked)} /> Mostrar respuestas al terminar</label>
                    <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={mezclarPreguntas} onChange={(e) => setMezclarPreguntas(e.target.checked)} /> Mezclar preguntas</label>
                  </div>
                ) : (
                  <>
                    {preguntas.map((q, idx) => (
                      <div key={q.id} className="rounded-2xl bg-white p-5 shadow-md border" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold" style={{ color: '#6d28d9' }}>{idx + 1}. Pregunta *</span>
                            <select className="input h-8 text-[12px]" value={q.tipo} onChange={(e) => updateQuestion(q.id, { tipo: e.target.value as ExamQuestionType })}>
                              {QUESTION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.icon} {t.label}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-1">
                            <input type="number" min={1} max={20} className="input h-8 w-14 text-center text-[12px]" value={q.puntos} onChange={(e) => updateQuestion(q.id, { puntos: Number(e.target.value) || 1 })} title="Puntos" />
                            <button type="button" className="btn-icon" onClick={() => { const c = [...preguntas]; if (idx > 0) { [c[idx - 1], c[idx]] = [c[idx], c[idx - 1]]; setPreguntas(c) } }}><ArrowUp size={14} /></button>
                            <button type="button" className="btn-icon" onClick={() => { const c = [...preguntas]; if (idx < c.length - 1) { [c[idx + 1], c[idx]] = [c[idx], c[idx + 1]]; setPreguntas(c) } }}><ArrowDown size={14} /></button>
                            <button type="button" className="btn-icon" onClick={() => setPreguntas((p) => [...p, { ...q, id: uid(), texto: q.texto + ' (Copia)' }])}><Copy size={14} /></button>
                            <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => setPreguntas((p) => p.filter((x) => x.id !== q.id))}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <input className="w-full text-[15px] font-medium border-0 border-b outline-none pb-2 mb-3" style={{ borderColor: '#e5e7eb', color: '#1f2937' }} value={q.texto} onChange={(e) => updateQuestion(q.id, { texto: e.target.value })} placeholder="Escribe la pregunta…" />
                        {(q.tipo === 'multiple' || q.tipo === 'casillas' || q.tipo === 'desplegable') && (
                          <div className="space-y-2">
                            {(q.opciones || []).map((op, opIdx) => {
                              const isCorrect = q.tipo === 'casillas'
                                ? Array.isArray(q.correcta) && q.correcta.includes(opIdx)
                                : Number(q.correcta) === opIdx
                              return (
                                <div key={opIdx} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                    style={{
                                      border: isCorrect ? 'none' : '2px solid #d1d5db',
                                      background: isCorrect ? '#7c3aed' : 'transparent',
                                      color: '#fff',
                                    }}
                                    onClick={() => {
                                      if (q.tipo === 'casillas') {
                                        const cur = Array.isArray(q.correcta) ? [...q.correcta] : []
                                        const next = cur.includes(opIdx) ? cur.filter((x) => x !== opIdx) : [...cur, opIdx]
                                        updateQuestion(q.id, { correcta: next })
                                      } else updateQuestion(q.id, { correcta: opIdx })
                                    }}
                                  >{isCorrect && <Check size={12} strokeWidth={3} />}</button>
                                  <input className="flex-1 text-[13px] border-0 border-b outline-none py-1.5" style={{ borderColor: '#e5e7eb' }} value={op} onChange={(e) => {
                                    const ops = [...(q.opciones || [])]
                                    ops[opIdx] = e.target.value
                                    updateQuestion(q.id, { opciones: ops })
                                  }} placeholder={`Opción ${opIdx + 1}`} />
                                  <button type="button" className="btn-icon" onClick={() => updateQuestion(q.id, { opciones: (q.opciones || []).filter((_, i) => i !== opIdx) })}><X size={13} /></button>
                                </div>
                              )
                            })}
                            <button type="button" className="text-[13px] font-semibold mt-1" style={{ color: '#7c3aed' }} onClick={() => updateQuestion(q.id, { opciones: [...(q.opciones || []), `Opción ${(q.opciones?.length || 0) + 1}`] })}>
                              + Agregar opción
                            </button>
                          </div>
                        )}
                        {q.tipo === 'verdadero_falso' && (
                          <div className="flex gap-2">
                            {['Verdadero', 'Falso'].map((vf, i) => (
                              <button key={vf} type="button" className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border" style={{
                                background: Number(q.correcta) === i ? '#ede9fe' : '#f9fafb',
                                color: Number(q.correcta) === i ? '#6d28d9' : '#6b7280',
                                borderColor: Number(q.correcta) === i ? '#7c3aed' : '#e5e7eb',
                              }} onClick={() => updateQuestion(q.id, { correcta: i })}>{vf}</button>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex items-center gap-2 pt-2" style={{ borderTop: '1px solid #f3f4f6' }}>
                          <Sparkles size={13} style={{ color: '#c4a35a' }} />
                          <input className="flex-1 text-[12px] border-0 outline-none bg-transparent" placeholder="Explicación al revisar (opcional)…" value={q.explicacion || ''} onChange={(e) => updateQuestion(q.id, { explicacion: e.target.value })} />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="w-full py-3 rounded-2xl border-2 border-dashed text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-white/50 transition-colors"
                      style={{ borderColor: '#c4b5fd', color: '#6d28d9' }}
                      onClick={() => addQuestion('multiple')}
                    >
                      <Plus size={16} /> Agregar nueva pregunta
                    </button>
                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                      {QUESTION_TYPES.map((t) => (
                        <button key={t.type} type="button" className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white border hover:shadow-sm" style={{ borderColor: '#e5e7eb', color: '#4b5563' }} onClick={() => addQuestion(t.type)}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {stylesPanelOpen && (
            <aside className="w-[280px] shrink-0 border-l overflow-y-auto bg-white shadow-lg" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <div className="px-4 py-3 flex items-center justify-between border-b sticky top-0 bg-white z-10" style={{ borderColor: '#f3f4f6' }}>
                <span className="font-semibold text-[14px]" style={{ color: '#1f2937' }}>Estilos</span>
                <button type="button" className="btn-icon" onClick={() => setStylesPanelOpen(false)}><X size={15} /></button>
              </div>
              <div className="p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Diseños</div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <button key={n} type="button" className="aspect-[4/3] rounded-lg border-2 transition-all" style={{
                      borderColor: n === 1 ? '#7c3aed' : '#e5e7eb',
                      background: n === 1 ? '#ede9fe' : '#f3f4f6',
                    }} />
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <button type="button" className="flex-1 h-8 rounded-full text-[11px] font-semibold text-white" style={{ background: '#7c3aed' }}>Sugerencias</button>
                  <button type="button" className="flex-1 h-8 rounded-full text-[11px] font-semibold border" style={{ borderColor: '#d1d5db', color: '#4b5563' }}>Personalizado</button>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#9ca3af' }}>Temas ROMEX</div>
                <div className="grid grid-cols-2 gap-2">
                  {FORM_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedThemeId(theme.id)}
                      className="rounded-xl p-3 text-left text-white h-20 transition-transform hover:scale-[1.02]"
                      style={{
                        background: theme.bgStyle,
                        boxShadow: selectedThemeId === theme.id ? '0 0 0 2px #7c3aed' : 'none',
                      }}
                    >
                      <div className="font-bold text-[10px] leading-tight">{theme.name}</div>
                      {selectedThemeId === theme.id && <div className="mt-1 text-[9px] opacity-90">✓ Activo</div>}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between text-[12px]" style={{ color: '#6b7280' }}>
                  <span>Música de fondo</span>
                  <div className="w-9 h-5 rounded-full relative" style={{ background: '#e5e7eb' }}>
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    )
  }

  /* LIVE TAKER - keep functional (abbreviated path uses existing logic via view state) */
  if (view === 'live-taker' && selectedExam) {
    const th = themeForExam(selectedExam)
    return (
      <div className="h-full flex flex-col overflow-auto animate-in" style={{ background: th.bgStyle }}>
        {!takerStarted ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="exam-card p-8 max-w-lg w-full text-center animate-scale">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}>
                <ClipboardList size={28} />
              </div>
              <h2 className="text-[22px] font-bold mb-1">{selectedExam.titulo}</h2>
              <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)' }}>{selectedExam.descripcion || 'Evaluación de competencias'}</p>
              <div className="space-y-3 text-left mb-5">
                <label className="block text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Nombre y apellido *
                  <input className="input w-full mt-1" value={takerName} onChange={(e) => setTakerName(e.target.value)} placeholder="Ej. Juan Pérez" autoFocus />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>DNI
                    <input className="input w-full mt-1" value={takerDni} onChange={(e) => setTakerDni(e.target.value)} />
                  </label>
                  <label className="block text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Área
                    <input className="input w-full mt-1" value={takerArea} onChange={(e) => setTakerArea(e.target.value)} placeholder="Producción" />
                  </label>
                </div>
              </div>
              <div className="p-3 rounded-xl text-[12px] flex justify-between mb-5" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                <span>⏱️ {selectedExam.config?.tiempoLimiteMinutos || 15} min</span>
                <span>❓ {selectedExam.preguntas.length} preg.</span>
                <span>🎯 Min {selectedExam.config?.notaMinimaAprobatoria || 14}/20</span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setView('list')}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={() => {
                  if (!takerName.trim()) { toast('Ingresa tu nombre', 'error'); return }
                  setTakerStarted(true)
                }}>Iniciar</button>
              </div>
            </div>
          </div>
        ) : !examResult ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-3 flex items-center justify-between sticky top-0 z-20" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="text-[14px] font-semibold truncate max-w-xs">{selectedExam.titulo}</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{takerName}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono text-[13px] font-bold px-3 py-1 rounded-lg" style={{
                  background: timeLeft < 180 ? 'var(--danger-soft)' : 'var(--surface-2)',
                  color: timeLeft < 180 ? 'var(--danger)' : 'var(--text)',
                }}>
                  <Clock size={14} className="inline mr-1" />
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <button type="button" className="btn btn-primary h-8 text-[12px]" onClick={() => handleSubmitExam(false)}>Entregar</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full space-y-4">
              {selectedExam.preguntas.map((q, idx) => (
                <div key={q.id} className="exam-card p-5">
                  <div className="flex gap-3 mb-3">
                    <span className="w-7 h-7 rounded-lg text-white text-[12px] font-bold flex items-center justify-center shrink-0" style={{ background: 'var(--primary)' }}>{idx + 1}</span>
                    <div>
                      <div className="text-[14px] font-semibold">{q.texto}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{q.puntos} pts</div>
                    </div>
                  </div>
                  {(q.tipo === 'multiple' || q.tipo === 'desplegable') && (
                    <div className="space-y-2 ml-10">
                      {(q.opciones || []).map((op, i) => (
                        <label key={i} className={`exam-option ${takerAnswers[q.id] === i ? 'is-selected' : ''}`}>
                          <input type="radio" name={q.id} checked={takerAnswers[q.id] === i} onChange={() => setTakerAnswers((p) => ({ ...p, [q.id]: i }))} />
                          <span className="text-[13px]">{op}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {q.tipo === 'casillas' && (
                    <div className="space-y-2 ml-10">
                      {(q.opciones || []).map((op, i) => {
                        const cur = Array.isArray(takerAnswers[q.id]) ? (takerAnswers[q.id] as number[]) : []
                        const checked = cur.includes(i)
                        return (
                          <label key={i} className={`exam-option ${checked ? 'is-selected' : ''}`}>
                            <input type="checkbox" checked={checked} onChange={() => {
                              const next = checked ? cur.filter((x) => x !== i) : [...cur, i]
                              setTakerAnswers((p) => ({ ...p, [q.id]: next }))
                            }} />
                            <span className="text-[13px]">{op}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {q.tipo === 'verdadero_falso' && (
                    <div className="grid grid-cols-2 gap-2 ml-10">
                      {['Verdadero', 'Falso'].map((vf, i) => (
                        <button key={vf} type="button" className={`exam-option justify-center ${takerAnswers[q.id] === i ? 'is-selected' : ''}`} onClick={() => setTakerAnswers((p) => ({ ...p, [q.id]: i }))}>{vf}</button>
                      ))}
                    </div>
                  )}
                  {q.tipo === 'escala' && (
                    <div className="ml-10 flex flex-wrap gap-2">
                      {Array.from({ length: (q.maxEscala || 5) - (q.minEscala || 1) + 1 }, (_, i) => {
                        const val = (q.minEscala || 1) + i
                        return (
                          <button key={val} type="button" className={`w-10 h-10 rounded-lg text-[13px] font-bold border ${Number(takerAnswers[q.id]) === val ? 'is-selected' : ''}`} style={{
                            background: Number(takerAnswers[q.id]) === val ? 'var(--primary-soft)' : 'var(--surface)',
                            borderColor: Number(takerAnswers[q.id]) === val ? 'var(--primary)' : 'var(--border)',
                            color: Number(takerAnswers[q.id]) === val ? 'var(--primary-text)' : 'var(--text)',
                          }} onClick={() => setTakerAnswers((p) => ({ ...p, [q.id]: val }))}>{val}</button>
                        )
                      })}
                    </div>
                  )}
                  {q.tipo === 'abierta' && (
                    <div className="ml-10">
                      <textarea className="input w-full min-h-[72px]" placeholder="Tu respuesta…" value={(takerAnswers[q.id] as string) || ''} onChange={(e) => setTakerAnswers((p) => ({ ...p, [q.id]: e.target.value }))} />
                    </div>
                  )}
                </div>
              ))}
              <div className="pb-10 text-center">
                <button type="button" className="btn btn-primary px-8 h-11" onClick={() => handleSubmitExam(false)}>Entregar y finalizar</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="exam-card p-8 max-w-lg w-full text-center animate-scale">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{
                background: examResult.aprobado ? 'var(--success-soft)' : 'var(--danger-soft)',
                color: examResult.aprobado ? 'var(--success)' : 'var(--danger)',
              }}>
                {examResult.aprobado ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <h2 className="text-[22px] font-bold">{examResult.aprobado ? '¡Aprobaste!' : 'No aprobado'}</h2>
              <div className="grid grid-cols-3 gap-2 my-5 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <div><div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Nota</div><div className="text-[22px] font-bold" style={{ color: 'var(--primary-text)' }}>{examResult.notaBase20.toFixed(1)}</div></div>
                <div><div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>%</div><div className="text-[22px] font-bold">{examResult.porcentaje}</div></div>
                <div><div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Pts</div><div className="text-[22px] font-bold">{examResult.puntajeObtenido}/{examResult.puntajeMaximo}</div></div>
              </div>
              {examResult.aprobado && (
                <button type="button" className="btn btn-primary w-full mb-2" onClick={() => generateCertificatePDF(examResult, selectedExam)}>
                  <Award size={16} /> Descargar certificado PDF
                </button>
              )}
              <div className="flex gap-2">
                {selectedExam.config?.mostrarRespuestasAlTerminar && (
                  <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowReviewModal(true)}><Eye size={14} /> Revisar</button>
                )}
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setView('list')}>Volver</button>
              </div>
            </div>
          </div>
        )}

        {showReviewModal && examResult && (
          <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
            <div className="modal-panel max-w-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b sticky top-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                <h2 className="font-semibold">Revisión</h2>
                <button type="button" className="btn-icon" onClick={() => setShowReviewModal(false)}><X size={16} /></button>
              </div>
              <div className="p-5 space-y-3">
                {selectedExam.preguntas.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                    <div className="text-[13px] font-semibold">#{idx + 1} {q.texto}</div>
                    {q.explicacion && <p className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>💡 {q.explicacion}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (view === 'analytics' && analyticsExam) {
    return (
      <div className="h-full flex flex-col animate-in">
        <div className="page-header px-7 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-icon" onClick={() => setView('list')}><ArrowLeft size={18} /></button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Analíticas</span>
              <h1 className="text-[17px] font-semibold">{analyticsExam.titulo}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost text-[12px]" disabled={!submissions.length} onClick={() => exportSubmissionsExcel(submissions, analyticsExam)}><FileSpreadsheet size={14} /> Excel</button>
            <button type="button" className="btn btn-ghost text-[12px]" disabled={!submissions.length} onClick={() => exportExamSummaryPDF(analyticsExam, submissions)}><FileText size={14} /> PDF</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { l: 'Evaluados', v: statsAnalytics.total },
              { l: 'Aprobación', v: `${statsAnalytics.tasa}%` },
              { l: 'Promedio', v: `${statsAnalytics.promedio}/20` },
              { l: 'Aprobados', v: statsAnalytics.aprobados },
            ].map((c) => (
              <div key={c.l} className="card p-4">
                <div className="text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>{c.l}</div>
                <div className="text-[24px] font-bold mt-1">{c.v}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input w-full pl-9 text-[12px]" placeholder="Buscar…" value={analyticsSearch} onChange={(e) => setAnalyticsSearch(e.target.value)} />
            </div>
            {(['todos', 'aprobados', 'desaprobados'] as const).map((f) => (
              <button key={f} type="button" className="btn text-[12px] h-8 capitalize" style={{
                background: analyticsFilter === f ? 'var(--primary-soft)' : 'var(--surface)',
                color: analyticsFilter === f ? 'var(--primary-text)' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }} onClick={() => setAnalyticsFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="th-row text-left">
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="border-b tr-hover" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-medium">{sub.evaluadoNombre}<div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub.evaluadoArea || sub.evaluadoDni}</div></td>
                    <td className="px-4 py-3 font-bold">{sub.notaBase20.toFixed(1)}/20</td>
                    <td className="px-4 py-3"><span className={`badge ${sub.aprobado ? 'badge-success' : 'badge-danger'}`}>{sub.aprobado ? 'APROBADO' : 'DESAPROBADO'}</span></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>{new Date(sub.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="px-4 py-3 text-right">
                      {sub.aprobado && <button type="button" className="btn-icon" style={{ color: 'var(--primary)' }} onClick={() => generateCertificatePDF(sub, analyticsExam)}><Award size={15} /></button>}
                      <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={async () => {
                        if (!sub.id || !confirmar('¿Eliminar registro?')) return
                        await deleteSubmission(sub.id)
                        setSubmissions(await listSubmissionsByExam(analyticsExam.id!))
                      }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredSubmissions.length && (
              <div className="p-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin registros</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
