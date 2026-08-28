import { useEffect, useState } from 'react'
import { Plus, Link2, Trash2, BarChart3, Play } from 'lucide-react'
import * as db from '../lib/db'
import type { Exam, ExamQuestion, ExamAttempt } from '../lib/db'

const THEMES: Record<string, string> = {
  blue: 'from-[#1a73e8] to-[#174ea6]',
  green: 'from-[#188038] to-[#0d652d]',
  purple: 'from-[#9334e6] to-[#681da8]',
  orange: 'from-[#e37400] to-[#b06000]',
}

export default function ExamPanel({ exams, folders, onRefresh }: { exams: Exam[]; folders: string[]; onRefresh: () => Promise<void> }) {
  const [editing, setEditing] = useState<Exam | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [resultsExam, setResultsExam] = useState<Exam | null>(null)
  const [attempts, setAttempts] = useState<ExamAttempt[]>([])
  const [form, setForm] = useState({ title: '', description: '', notaMin: '70', folder: 'General', theme: 'blue' })
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [qDraft, setQDraft] = useState({ text: '', o0: '', o1: '', o2: '', o3: '', correct: '0' })

  useEffect(() => {
    if (!resultsExam) return
    db.listAttempts(resultsExam.id).then(setAttempts)
  }, [resultsExam])

  function openNew() {
    setIsNew(true)
    setEditing(null)
    setForm({ title: '', description: '', notaMin: '70', folder: folders[0] || 'General', theme: 'blue' })
    setQuestions([])
  }

  function openEdit(ex: Exam) {
    setIsNew(false)
    setEditing(ex)
    setForm({
      title: ex.title,
      description: ex.description || '',
      notaMin: String(ex.notaMin),
      folder: ex.folder || 'General',
      theme: ex.theme || 'blue',
    })
    setQuestions(ex.questions || [])
  }

  function addQuestion() {
    if (!qDraft.text.trim()) return
    const opts = [qDraft.o0, qDraft.o1, qDraft.o2, qDraft.o3].filter(Boolean)
    if (opts.length < 2) return alert('Minimo 2 opciones')
    setQuestions(qs => [...qs, {
      id: 'q_' + crypto.randomUUID().slice(0, 6),
      text: qDraft.text,
      options: opts,
      correctIndex: Math.min(parseInt(qDraft.correct, 10) || 0, opts.length - 1),
      points: 1,
    }])
    setQDraft({ text: '', o0: '', o1: '', o2: '', o3: '', correct: '0' })
  }

  async function save() {
    if (!form.title.trim()) return alert('Titulo requerido')
    await db.saveExam({
      id: isNew ? undefined : editing?.id,
      title: form.title,
      description: form.description,
      notaMin: parseInt(form.notaMin, 10) || 70,
      folder: form.folder,
      theme: form.theme,
      questions,
      estado: questions.length ? (editing?.estado === 'Activo' ? 'Activo' : 'Borrador') : 'Borrador',
    })
    setEditing(null)
    setIsNew(false)
    await onRefresh()
  }

  async function publish(ex: Exam) {
    if (!(ex.questions && ex.questions.length)) return alert('Agrega preguntas primero')
    await db.saveExam({ ...ex, estado: 'Activo' })
    await onRefresh()
  }

  function shareUrl(ex: Exam) {
    return window.location.origin + window.location.pathname + '#/exam/' + ex.shareToken
  }

  async function copyLink(ex: Exam) {
    await navigator.clipboard.writeText(shareUrl(ex))
    alert('URL copiada')
  }

  const showEditor = isNew || editing !== null

  if (resultsExam) {
    const approved = attempts.filter(a => a.approved).length
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <button type="button" onClick={() => setResultsExam(null)} className="text-sm text-[#1a73e8] mb-4 hover:underline">Volver</button>
        <h1 className="text-[28px] font-normal mb-1">{resultsExam.title}</h1>
        <p className="text-sm text-[#5f6368] mb-6">Resultados</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { l: 'Intentos', v: attempts.length },
            { l: 'Aprobados', v: approved },
            { l: '% Aprobacion', v: attempts.length ? Math.round((approved / attempts.length) * 100) + '%' : '-' },
            { l: 'Promedio', v: resultsExam.promedio != null ? Math.round(resultsExam.promedio) + '%' : '-' },
          ].map(s => (
            <div key={s.l} className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-5">
              <div className="text-xs text-[#80868b]">{s.l}</div>
              <div className="text-3xl font-medium mt-1">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm overflow-hidden">
          {attempts.length === 0 ? (
            <div className="p-12 text-center text-[#80868b] text-sm">Aun no hay respuestas</div>
          ) : attempts.map(a => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3 border-b border-[#e8eaed] last:border-0">
              <div className="flex-1">
                <div className="font-medium text-sm">{a.nombre}</div>
                <div className="text-xs text-[#80868b]">{a.email || '-'} · {new Date(a.createdAt).toLocaleString('es')}</div>
              </div>
              <span className={'text-sm font-medium ' + (a.approved ? 'text-[#188038]' : 'text-[#d93025]')}>{a.percent}%</span>
              <span className={'px-2.5 py-0.5 rounded-full text-xs font-medium ' + (a.approved ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#fce8e6] text-[#d93025]')}>
                {a.approved ? 'Aprobado' : 'No aprobado'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (showEditor) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <button type="button" onClick={() => { setEditing(null); setIsNew(false) }} className="text-sm text-[#1a73e8] mb-4 hover:underline">Cancelar</button>
        <h1 className="text-[28px] font-normal mb-6">{isNew ? 'Nuevo examen' : 'Editar examen'}</h1>
        <div className="max-w-2xl space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">Titulo</span>
            <input className="mt-1 w-full h-10 px-3 rounded-lg border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8]" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">Descripcion</span>
            <textarea className="mt-1 w-full h-20 px-3 py-2 rounded-lg border border-[#dadce0] text-sm" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">Nota minima %</span>
              <input type="number" className="mt-1 w-full h-10 px-3 rounded-lg border border-[#dadce0] text-sm" value={form.notaMin} onChange={e => setForm({ ...form, notaMin: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">Carpeta</span>
              <select className="mt-1 w-full h-10 px-3 rounded-lg border border-[#dadce0] text-sm" value={form.folder} onChange={e => setForm({ ...form, folder: e.target.value })}>
                {['General', ...folders.filter(f => f !== 'General')].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-[#5f6368] uppercase tracking-wide">Tema</span>
              <select className="mt-1 w-full h-10 px-3 rounded-lg border border-[#dadce0] text-sm" value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })}>
                {Object.keys(THEMES).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
          <div className={'h-24 rounded-xl bg-gradient-to-r ' + (THEMES[form.theme] || THEMES.blue) + ' flex items-center px-6 text-white'}>
            <div>
              <div className="text-lg font-medium">{form.title || 'Vista previa'}</div>
              <div className="text-sm opacity-90">{form.description || 'Descripcion'}</div>
            </div>
          </div>
          <div className="border border-[#e8eaed] rounded-xl p-4 bg-white">
            <div className="font-medium text-sm mb-3">Preguntas ({questions.length})</div>
            {questions.map((q, i) => (
              <div key={q.id} className="flex gap-2 items-start py-2 border-b border-[#f1f3f4] last:border-0">
                <span className="text-xs text-[#80868b] mt-1">{i + 1}.</span>
                <div className="flex-1 text-sm">
                  <div>{q.text}</div>
                  <div className="text-xs text-[#80868b] mt-1">{q.options.map((o, j) => (j === q.correctIndex ? 'OK ' : '') + o).join(' · ')}</div>
                </div>
                <button type="button" onClick={() => setQuestions(qs => qs.filter(x => x.id !== q.id))} className="p-1 text-[#80868b] hover:text-[#d93025]"><Trash2 size={14} /></button>
              </div>
            ))}
            <div className="mt-4 space-y-2 border-t border-[#e8eaed] pt-4">
              <input placeholder="Texto de la pregunta" className="w-full h-10 px-3 rounded-lg border border-[#dadce0] text-sm" value={qDraft.text} onChange={e => setQDraft({ ...qDraft, text: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map(i => (
                  <input key={i} placeholder={'Opcion ' + (i + 1)} className="h-9 px-3 rounded-lg border border-[#dadce0] text-sm"
                    value={[qDraft.o0, qDraft.o1, qDraft.o2, qDraft.o3][i]}
                    onChange={e => {
                      const keys = ['o0', 'o1', 'o2', 'o3'] as const
                      setQDraft({ ...qDraft, [keys[i]]: e.target.value })
                    }} />
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-[#5f6368]">Correcta:</span>
                <select className="h-9 px-2 rounded-lg border border-[#dadce0] text-sm" value={qDraft.correct} onChange={e => setQDraft({ ...qDraft, correct: e.target.value })}>
                  <option value="0">1</option><option value="1">2</option><option value="2">3</option><option value="3">4</option>
                </select>
                <button type="button" onClick={addQuestion} className="h-9 px-4 rounded-full bg-[#e8f0fe] text-[#1967d2] text-sm font-medium">+ Pregunta</button>
              </div>
            </div>
          </div>
          <button type="button" onClick={save} className="h-10 px-8 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Guardar examen</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-[28px] font-normal mb-1">Examenes</h1>
      <p className="text-sm text-[#5f6368] mb-6">Crea, publica con URL, vincula a carpetas y revisa resultados</p>
      <button type="button" onClick={openNew} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2 mb-6">
        <Plus size={16} /> Crear examen
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(ex => (
          <div key={ex.id} className="bg-white rounded-xl border border-[#e8eaed] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={'h-16 bg-gradient-to-r ' + (THEMES[ex.theme] || THEMES.blue)} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-[#202124]">{ex.title}</div>
                <span className={'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ' + (ex.estado === 'Activo' ? 'bg-[#e6f4ea] text-[#188038]' : 'bg-[#fef7e0] text-[#e37400]')}>{ex.estado}</span>
              </div>
              <div className="text-xs text-[#80868b] mt-1">{(ex.questions || []).length} preguntas · Min. {ex.notaMin}% · {ex.folder || 'General'}</div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button type="button" onClick={() => openEdit(ex)} className="text-xs px-3 py-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]">Editar</button>
                {ex.estado !== 'Activo' && (
                  <button type="button" onClick={() => publish(ex)} className="text-xs px-3 py-1.5 rounded-full bg-[#e8f0fe] text-[#1967d2] font-medium flex items-center gap-1"><Play size={12} /> Publicar</button>
                )}
                {ex.estado === 'Activo' && (
                  <button type="button" onClick={() => copyLink(ex)} className="text-xs px-3 py-1.5 rounded-full bg-[#e8f0fe] text-[#1967d2] font-medium flex items-center gap-1"><Link2 size={12} /> URL</button>
                )}
                <button type="button" onClick={() => setResultsExam(ex)} className="text-xs px-3 py-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368] flex items-center gap-1"><BarChart3 size={12} /> Resultados</button>
                <button type="button" onClick={async () => { if (confirm('Eliminar?')) { await db.deleteExam(ex.id); await onRefresh() } }} className="text-xs px-3 py-1.5 rounded-full hover:bg-[#fce8e6] text-[#d93025]"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && <div className="col-span-full p-12 text-center text-[#80868b] text-sm bg-white rounded-xl border">Sin examenes. Crea el primero.</div>}
      </div>
    </div>
  )
}
