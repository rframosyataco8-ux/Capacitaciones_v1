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
  const [stylesPanelOpen, setStylesPanelOpen] = useState(false)

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
    setPreguntas([{
      id: uid(), tipo: 'multiple',
      texto: '¿Cuál es el primer principio del sistema HACCP?',
      puntos: 5,
      opciones: ['Establecer límites críticos', 'Realizar un análisis de peligros', 'Determinar los PCC', 'Establecer vigilancia'],
      correcta: 1,
      explicacion: 'El Principio 1 es el análisis de peligros.',
      obligatoria: true,
    }])
    setActiveTabBuilder('preguntas')
    setStylesPanelOpen(false)
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
    setStylesPanelOpen(false)
    setView('builder')
  }

  function addQuestion(tipo: ExamQuestionType = 'multiple') {
    let opciones: string[] = []
    let correcta: unknown = 0
    if (tipo === 'multiple' || tipo === 'desplegable') opciones = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4']
    else if (tipo === 'casillas') { opciones = ['Opción 1', 'Opción 2', 'Opción 3']; correcta = [0] }
    else if (tipo === 'verdadero_falso') opciones = ['Verdadero', 'Falso']
    else if (tipo === 'escala') correcta = null
    setPreguntas((prev) => [...prev, {
      id: uid(), tipo, texto: '', puntos: 4, opciones, correcta, explicacion: '', obligatoria: true,
      minEscala: 1, maxEscala: 5, etiquetaMin: 'Bajo', etiquetaMax: 'Excelente',
    }])
  }

  function updateQuestion(id: string, patch: Partial<ExamQuestion>) {
    setPreguntas((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))
  }

  const activeTheme = useMemo(
    () => FORM_THEMES.find((t) => t.id === selectedThemeId) || FORM_THEMES[0],
    [selectedThemeId]
  )

  async function handleSaveExam() {
    if (!titulo.trim()) { toast('Ingresa un título para el examen', 'error'); return }
    if (preguntas.length === 0) { toast('Agrega al menos una pregunta', 'error'); return }
    for (let i = 0; i < preguntas.length; i++) {
      if (!preguntas[i].texto.trim()) { toast(`La pregunta #${i + 1} no tiene enunciado`, 'error'); return }
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
      const match = !q || s.evaluadoNombre.toLowerCase().includes(q) || (s.evaluadoDni || '').includes(q) || (s.evaluadoArea || '').toLowerCase().includes(q)
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

  const themeForExam = (ex: Exam) => FORM_THEMES.find((t) => t.id === ex.config?.themeId) || FORM_THEMES[0]

  if (view === 'list') {
    const shown = listTab === 'favoritos' || listTab === 'mios' ? exams.filter((e) => e.estado === 'Activo') : exams
    return (
      <div className="h-full flex flex-col" style={{ background: 'var(--bg)' }}>
        <div className="page-header px-6 lg:px-8 py-5 shrink-0 border-b" style={{ borderColor: 'var(--border)', background: 'var(--header-bg)' }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--accent-text)' }}>ROMEX · Calidad e inocuidad</div>
              <h1 className="text-[22px] font-semibold tracking-tight mt-1">Evaluaciones</h1>
              <p className="text-[13px] mt-1 max-w-xl" style={{ color: 'var(--text-secondary)' }}>Cuestionarios con calificación automática, analítica de resultados y certificados PDF</p>
            </div>
            <button type="button" className="btn btn-primary h-10 px-5 gap-2 shadow-sm" onClick={openNewExam}>
              <Plus size={16} strokeWidth={2.5} /> Nueva evaluación
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1 mt-5">
            {([{ id: 'recientes' as const, label: 'Todas', icon: ClipboardList }, { id: 'mios' as const, label: 'Activas', icon: CheckCircle2 }, { id: 'favoritos' as const, label: 'Publicadas', icon: Star }]).map((tab) => (
              <button key={tab.id} type="button" onClick={() => setListTab(tab.id)} className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium rounded-lg" style={{ background: listTab === tab.id ? 'var(--primary-soft)' : 'transparent', color: listTab === tab.id ? 'var(--primary-text)' : 'var(--text-secondary)' }}>
                <tab.icon size={14} />{tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto px-6 lg:px-8 py-6">
          {loading ? (
            <p className="text-[13px] text-center py-20" style={{ color: 'var(--text-muted)' }}>Cargando evaluaciones…</p>
          ) : shown.length === 0 ? (
            <div className="card max-w-md mx-auto mt-16 p-10 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}><ClipboardList size={28} /></div>
              <h2 className="text-[16px] font-semibold mb-2">Sin evaluaciones</h2>
              <p className="text-[13px] mb-6" style={{ color: 'var(--text-secondary)' }}>Crea un cuestionario para medir competencias del personal después de cada capacitación.</p>
              <button type="button" className="btn btn-primary h-10 px-5" onClick={openNewExam}><Plus size={15} /> Crear evaluación</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shown.map((ex) => {
                const th = themeForExam(ex)
                return (
                  <article key={ex.id} className="card card-hover overflow-hidden cursor-pointer group flex flex-col" onClick={() => openEditExam(ex)}>
                    <div className="h-1.5 shrink-0" style={{ background: th.accentColor || 'var(--primary)' }} />
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase" style={{ background: ex.estado === 'Activo' ? 'var(--success-soft)' : 'var(--surface-2)', color: ex.estado === 'Activo' ? 'var(--success)' : 'var(--text-secondary)' }}>{ex.estado}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                          <button type="button" className="btn-icon w-7 h-7" onClick={(e) => { e.stopPropagation(); handleShareLink(ex) }}><Share2 size={13} /></button>
                          <button type="button" className="btn-icon w-7 h-7" style={{ color: 'var(--danger)' }} onClick={(e) => { e.stopPropagation(); ex.id && handleDeleteExam(ex.id) }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <h3 className="text-[14px] font-semibold line-clamp-2 mb-1.5">{ex.titulo}</h3>
                      <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>{ex.tema || 'Sin capacitación vinculada'} · {ex.preguntas?.length || 0} preguntas</p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{ex.config?.tiempoLimiteMinutos || 15} min · mín. {ex.config?.notaMinimaAprobatoria ?? 14}/20</span>
                        <div className="flex gap-1.5">
                          <button type="button" className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md" style={{ color: 'var(--primary-text)', background: 'var(--primary-soft)' }} onClick={(e) => { e.stopPropagation(); openAnalytics(ex) }}>Resultados</button>
                          <button type="button" className="text-[11px] font-semibold px-2.5 py-1.5 rounded-md text-white" style={{ background: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); startTakingExam(ex) }}>Rendir</button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (view === 'builder') {
    return (
      <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #e8e0f0 0%, #f0eaf7 40%, #f5f3f8 100%)' }}>
        <div className="h-12 flex items-center justify-between px-4 shrink-0 border-b" style={{ background: 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button type="button" className="btn-icon" onClick={() => setView('list')}><ArrowLeft size={18} /></button>
            <input className="bg-transparent border-0 outline-none text-[14px] font-semibold max-w-[280px]" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título de la evaluación" />
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#ede9fe', color: '#6d28d9' }}>{estado}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${stylesPanelOpen ? 'bg-violet-100 text-violet-700' : 'text-slate-600'}`} onClick={() => setStylesPanelOpen(!stylesPanelOpen)}><Palette size={14} /> Estilo</button>
            <button type="button" className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${activeTabBuilder === 'config' ? 'bg-violet-100 text-violet-700' : 'text-slate-600'}`} onClick={() => setActiveTabBuilder(activeTabBuilder === 'config' ? 'preguntas' : 'config')}><Settings size={14} /> Config</button>
            <button type="button" className="h-8 px-4 rounded-full text-white text-[12px] font-semibold" style={{ background: '#7c3aed' }} onClick={handleSaveExam}><Save size={14} /> Guardar</button>
          </div>
        </div>
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="rounded-2xl bg-white shadow-md overflow-hidden">
                <div className="h-16" style={{ background: activeTheme.headerBg }} />
                <div className="p-5 space-y-3">
                  <input className="w-full text-[18px] font-bold border-0 outline-none" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título" />
                  <textarea className="w-full text-[13px] border-0 outline-none resize-none" style={{ color: '#6b7280' }} rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Instrucciones (opcional)" />
                  <div className="grid sm:grid-cols-2 gap-2">
                    <select className="input w-full text-[12px] h-9" value={temaId === '' ? '' : String(temaId)} onChange={(e) => setTemaId(e.target.value ? Number(e.target.value) : '')}>
                      <option value="">— Vincular capacitación —</option>
                      {temas.map((t) => <option key={t.id} value={t.id}>{t.tema}</option>)}
                    </select>
                    <select className="input w-full text-[12px] h-9" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)}>
                      <option value="Activo">Activo</option>
                      <option value="Borrador">Borrador</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </div>
              </div>
              {activeTabBuilder === 'config' ? (
                <div className="rounded-2xl bg-white p-5 shadow-md space-y-4">
                  <h3 className="font-semibold text-[14px]">Configuración</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block text-[12px] font-semibold">Tiempo (min)<input type="number" min={1} max={120} className="input w-full mt-1" value={tiempoLimite} onChange={(e) => setTiempoLimite(Number(e.target.value) || 15)} /></label>
                    <label className="block text-[12px] font-semibold">Nota mínima /20<input type="number" min={1} max={20} className="input w-full mt-1" value={notaMinima} onChange={(e) => setNotaMinima(Number(e.target.value) || 14)} /></label>
                  </div>
                  <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={mostrarRespuestas} onChange={(e) => setMostrarRespuestas(e.target.checked)} /> Mostrar respuestas al terminar</label>
                  <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={mezclarPreguntas} onChange={(e) => setMezclarPreguntas(e.target.checked)} /> Mezclar preguntas</label>
                </div>
              ) : (
                <>
                  {preguntas.map((q, idx) => (
                    <div key={q.id} className="rounded-2xl bg-white p-5 shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg text-white text-[12px] font-bold flex items-center justify-center" style={{ background: '#7c3aed' }}>{idx + 1}</span>
                          <select className="input h-8 text-[12px]" value={q.tipo} onChange={(e) => updateQuestion(q.id, { tipo: e.target.value as ExamQuestionType })}>
                            {QUESTION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.icon} {t.label}</option>)}
                          </select>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <input type="number" min={1} max={20} className="input h-8 w-12 text-center text-[12px]" value={q.puntos} onChange={(e) => updateQuestion(q.id, { puntos: Number(e.target.value) || 1 })} />
                          <button type="button" className="btn-icon" onClick={() => setPreguntas((p) => p.filter((x) => x.id !== q.id))} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <input className="w-full text-[15px] font-medium border-0 border-b outline-none pb-2 mb-3" style={{ borderColor: '#e5e7eb' }} value={q.texto} onChange={(e) => updateQuestion(q.id, { texto: e.target.value })} placeholder="Escribe la pregunta…" />
                      {(q.tipo === 'multiple' || q.tipo === 'casillas' || q.tipo === 'desplegable') && (
                        <div className="space-y-2">
                          {(q.opciones || []).map((op, opIdx) => {
                            const isCorrect = q.tipo === 'casillas' ? Array.isArray(q.correcta) && q.correcta.includes(opIdx) : Number(q.correcta) === opIdx
                            return (
                              <div key={opIdx} className="flex items-center gap-2">
                                <button type="button" className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ border: isCorrect ? 'none' : '2px solid #d1d5db', background: isCorrect ? '#7c3aed' : 'transparent', color: '#fff' }} onClick={() => {
                                  if (q.tipo === 'casillas') {
                                    const cur = Array.isArray(q.correcta) ? [...q.correcta] : []
                                    updateQuestion(q.id, { correcta: cur.includes(opIdx) ? cur.filter((x) => x !== opIdx) : [...cur, opIdx] })
                                  } else updateQuestion(q.id, { correcta: opIdx })
                                }}>{isCorrect && <Check size={12} strokeWidth={3} />}</button>
                                <input className="flex-1 text-[13px] border-0 border-b outline-none py-1.5" style={{ borderColor: '#e5e7eb' }} value={op} onChange={(e) => { const ops = [...(q.opciones || [])]; ops[opIdx] = e.target.value; updateQuestion(q.id, { opciones: ops }) }} />
                                <button type="button" className="btn-icon" onClick={() => updateQuestion(q.id, { opciones: (q.opciones || []).filter((_, i) => i !== opIdx) })}><X size={13} /></button>
                              </div>
                            )
                          })}
                          <button type="button" className="text-[13px] font-semibold" style={{ color: '#7c3aed' }} onClick={() => updateQuestion(q.id, { opciones: [...(q.opciones || []), `Opción ${(q.opciones?.length || 0) + 1}`] })}>+ Agregar opción</button>
                        </div>
                      )}
                      {q.tipo === 'verdadero_falso' && (
                        <div className="flex gap-2">
                          {['Verdadero', 'Falso'].map((vf, i) => (
                            <button key={vf} type="button" className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border" style={{ background: Number(q.correcta) === i ? '#ede9fe' : '#f9fafb', color: Number(q.correcta) === i ? '#6d28d9' : '#6b7280', borderColor: Number(q.correcta) === i ? '#7c3aed' : '#e5e7eb' }} onClick={() => updateQuestion(q.id, { correcta: i })}>{vf}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="button" className="w-full py-3.5 rounded-2xl border-2 border-dashed text-[13px] font-semibold flex items-center justify-center gap-2" style={{ borderColor: '#c4b5fd', color: '#6d28d9' }} onClick={() => addQuestion('multiple')}><Plus size={16} /> Agregar pregunta</button>
                </>
              )}
            </div>
          </div>
          {stylesPanelOpen && (
            <aside className="w-[260px] shrink-0 border-l overflow-y-auto bg-white">
              <div className="px-4 py-3 flex items-center justify-between border-b sticky top-0 bg-white">
                <span className="font-semibold text-[13px]">Temas visuales</span>
                <button type="button" className="btn-icon" onClick={() => setStylesPanelOpen(false)}><X size={15} /></button>
              </div>
              <div className="p-3 space-y-2">
                {FORM_THEMES.map((theme) => (
                  <button key={theme.id} type="button" onClick={() => setSelectedThemeId(theme.id)} className="w-full rounded-xl p-3 text-left text-white h-[72px]" style={{ background: theme.bgStyle, boxShadow: selectedThemeId === theme.id ? '0 0 0 2px #7c3aed' : 'none' }}>
                    <div className="font-bold text-[11px]">{theme.name}</div>
                    {selectedThemeId === theme.id && <div className="mt-1 text-[10px] opacity-90">✓ Seleccionado</div>}
                  </button>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    )
  }

  if (view === 'live-taker' && selectedExam) {
    const th = themeForExam(selectedExam)
    return (
      <div className="h-full flex flex-col overflow-auto" style={{ background: th.bgStyle }}>
        {!takerStarted ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="exam-card p-8 max-w-lg w-full text-center">
              <h2 className="text-[22px] font-bold mb-1">{selectedExam.titulo}</h2>
              <p className="text-[13px] mb-5" style={{ color: 'var(--text-secondary)' }}>{selectedExam.descripcion || 'Evaluación de competencias'}</p>
              <div className="space-y-3 text-left mb-5">
                <label className="block text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Nombre *<input className="input w-full mt-1" value={takerName} onChange={(e) => setTakerName(e.target.value)} autoFocus /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>DNI<input className="input w-full mt-1" value={takerDni} onChange={(e) => setTakerDni(e.target.value)} /></label>
                  <label className="block text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Área<input className="input w-full mt-1" value={takerArea} onChange={(e) => setTakerArea(e.target.value)} /></label>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setView('list')}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={() => { if (!takerName.trim()) { toast('Ingresa tu nombre', 'error'); return } setTakerStarted(true) }}>Iniciar</button>
              </div>
            </div>
          </div>
        ) : !examResult ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-3 flex items-center justify-between sticky top-0 z-20" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              <div><div className="text-[14px] font-semibold">{selectedExam.titulo}</div><div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{takerName}</div></div>
              <div className="flex items-center gap-3">
                <div className="font-mono text-[13px] font-bold px-3 py-1 rounded-lg" style={{ background: timeLeft < 180 ? 'var(--danger-soft)' : 'var(--surface-2)', color: timeLeft < 180 ? 'var(--danger)' : 'var(--text)' }}>
                  <Clock size={14} className="inline mr-1" />{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <button type="button" className="btn btn-primary h-8 text-[12px]" onClick={() => handleSubmitExam(false)}>Entregar</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full space-y-4">
              {selectedExam.preguntas.map((q, idx) => (
                <div key={q.id} className="exam-card p-5">
                  <div className="flex gap-3 mb-3">
                    <span className="w-7 h-7 rounded-lg text-white text-[12px] font-bold flex items-center justify-center shrink-0" style={{ background: 'var(--primary)' }}>{idx + 1}</span>
                    <div><div className="text-[14px] font-semibold">{q.texto}</div><div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{q.puntos} pts</div></div>
                  </div>
                  {(q.tipo === 'multiple' || q.tipo === 'desplegable') && (
                    <div className="space-y-2 ml-10">{(q.opciones || []).map((op, i) => (
                      <label key={i} className={`exam-option ${takerAnswers[q.id] === i ? 'is-selected' : ''}`}>
                        <input type="radio" name={q.id} checked={takerAnswers[q.id] === i} onChange={() => setTakerAnswers((p) => ({ ...p, [q.id]: i }))} />
                        <span className="text-[13px]">{op}</span>
                      </label>
                    ))}</div>
                  )}
                  {q.tipo === 'casillas' && (
                    <div className="space-y-2 ml-10">{(q.opciones || []).map((op, i) => {
                      const cur = Array.isArray(takerAnswers[q.id]) ? (takerAnswers[q.id] as number[]) : []
                      const checked = cur.includes(i)
                      return (
                        <label key={i} className={`exam-option ${checked ? 'is-selected' : ''}`}>
                          <input type="checkbox" checked={checked} onChange={() => setTakerAnswers((p) => ({ ...p, [q.id]: checked ? cur.filter((x) => x !== i) : [...cur, i] }))} />
                          <span className="text-[13px]">{op}</span>
                        </label>
                      )
                    })}</div>
                  )}
                  {q.tipo === 'verdadero_falso' && (
                    <div className="grid grid-cols-2 gap-2 ml-10">{['Verdadero', 'Falso'].map((vf, i) => (
                      <button key={vf} type="button" className={`exam-option justify-center ${takerAnswers[q.id] === i ? 'is-selected' : ''}`} onClick={() => setTakerAnswers((p) => ({ ...p, [q.id]: i }))}>{vf}</button>
                    ))}</div>
                  )}
                  {q.tipo === 'escala' && (
                    <div className="ml-10 flex flex-wrap gap-2">{Array.from({ length: (q.maxEscala || 5) - (q.minEscala || 1) + 1 }, (_, i) => {
                      const val = (q.minEscala || 1) + i
                      return <button key={val} type="button" className={`w-10 h-10 rounded-lg text-[13px] font-bold border ${Number(takerAnswers[q.id]) === val ? 'is-selected' : ''}`} style={{ background: Number(takerAnswers[q.id]) === val ? 'var(--primary-soft)' : 'var(--surface)', borderColor: Number(takerAnswers[q.id]) === val ? 'var(--primary)' : 'var(--border)' }} onClick={() => setTakerAnswers((p) => ({ ...p, [q.id]: val }))}>{val}</button>
                    })}</div>
                  )}
                  {q.tipo === 'abierta' && (
                    <div className="ml-10"><textarea className="input w-full min-h-[72px]" placeholder="Tu respuesta…" value={(takerAnswers[q.id] as string) || ''} onChange={(e) => setTakerAnswers((p) => ({ ...p, [q.id]: e.target.value }))} /></div>
                  )}
                </div>
              ))}
              <div className="pb-10 text-center"><button type="button" className="btn btn-primary px-8 h-11" onClick={() => handleSubmitExam(false)}>Entregar y finalizar</button></div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="exam-card p-8 max-w-lg w-full text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: examResult.aprobado ? 'var(--success-soft)' : 'var(--danger-soft)', color: examResult.aprobado ? 'var(--success)' : 'var(--danger)' }}>
                {examResult.aprobado ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <h2 className="text-[22px] font-bold">{examResult.aprobado ? '¡Aprobaste!' : 'No aprobado'}</h2>
              <div className="grid grid-cols-3 gap-2 my-5 p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <div><div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Nota</div><div className="text-[22px] font-bold">{examResult.notaBase20.toFixed(1)}</div></div>
                <div><div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>%</div><div className="text-[22px] font-bold">{examResult.porcentaje}</div></div>
                <div><div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Pts</div><div className="text-[22px] font-bold">{examResult.puntajeObtenido}/{examResult.puntajeMaximo}</div></div>
              </div>
              {examResult.aprobado && <button type="button" className="btn btn-primary w-full mb-2" onClick={() => generateCertificatePDF(examResult, selectedExam)}><Award size={16} /> Descargar certificado PDF</button>}
              <div className="flex gap-2">
                {selectedExam.config?.mostrarRespuestasAlTerminar && <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowReviewModal(true)}><Eye size={14} /> Revisar</button>}
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
      <div className="h-full flex flex-col">
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
            {[{ l: 'Evaluados', v: statsAnalytics.total }, { l: 'Aprobación', v: `${statsAnalytics.tasa}%` }, { l: 'Promedio', v: `${statsAnalytics.promedio}/20` }, { l: 'Aprobados', v: statsAnalytics.aprobados }].map((c) => (
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
              <button key={f} type="button" className="btn text-[12px] h-8 capitalize" style={{ background: analyticsFilter === f ? 'var(--primary-soft)' : 'var(--surface)', color: analyticsFilter === f ? 'var(--primary-text)' : 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={() => setAnalyticsFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="w-full text-[13px]">
              <thead><tr className="th-row text-left"><th className="px-4 py-3">Colaborador</th><th className="px-4 py-3">Nota</th><th className="px-4 py-3">Resultado</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="border-b tr-hover" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 font-medium">{sub.evaluadoNombre}<div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{sub.evaluadoArea || sub.evaluadoDni}</div></td>
                    <td className="px-4 py-3 font-bold">{sub.notaBase20.toFixed(1)}/20</td>
                    <td className="px-4 py-3"><span className={`badge ${sub.aprobado ? 'badge-success' : 'badge-danger'}`}>{sub.aprobado ? 'APROBADO' : 'DESAPROBADO'}</span></td>
                    <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>{new Date(sub.fecha).toLocaleDateString('es-PE')}</td>
                    <td className="px-4 py-3 text-right">
                      {sub.aprobado && <button type="button" className="btn-icon" style={{ color: 'var(--primary)' }} onClick={() => generateCertificatePDF(sub, analyticsExam)}><Award size={15} /></button>}
                      <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={async () => { if (!sub.id || !confirmar('¿Eliminar registro?')) return; await deleteSubmission(sub.id); setSubmissions(await listSubmissionsByExam(analyticsExam.id!)) }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredSubmissions.length && <div className="p-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin registros</div>}
          </div>
        </div>
      </div>
    )
  }

  return null
}
