import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Calendar, CheckSquare, FileText, FolderOpen, Network,
  Plus, Search, Upload, Download, Trash2, Copy, X,
} from 'lucide-react'
import * as db from './lib/db'
import type { Note, Event, FileItem, Exam } from './lib/db'

type View = 'vault' | 'graph' | 'cronograma' | 'files' | 'examenes' | 'auditoria'

const NAV: { id: View; icon: typeof FileText; label: string }[] = [
  { id: 'vault', icon: FileText, label: 'Vault' },
  { id: 'graph', icon: Network, label: 'Grafo' },
  { id: 'cronograma', icon: Calendar, label: 'Cronograma' },
  { id: 'files', icon: FolderOpen, label: 'Archivos' },
  { id: 'examenes', icon: CheckSquare, label: 'Exámenes' },
  { id: 'auditoria', icon: CheckSquare, label: 'Auditoría' },
]

function Chip({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'green' | 'orange' | 'blue' | 'red' }) {
  const tones: Record<string, string> = {
    green: 'bg-[#e6f4ea] text-[#188038]',
    orange: 'bg-[#fef7e0] text-[#e37400]',
    blue: 'bg-[#e8f0fe] text-[#1967d2]',
    red: 'bg-[#fce8e6] text-[#d93025]',
  }
  return <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + tones[tone]}>{children}</span>
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed]">
          <h2 className="text-lg font-medium text-[#202124]">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-medium text-[#5f6368] mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'w-full h-10 px-3 rounded-lg border border-[#dadce0] text-sm text-[#202124] outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe] bg-white'

export default function App() {
  const [view, setView] = useState<View>('vault')
  const [notes, setNotes] = useState<Note[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [fileFolder, setFileFolder] = useState('General')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [ready, setReady] = useState(false)
  const [eventModal, setEventModal] = useState(false)
  const [examModal, setExamModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)
  const [editBody, setEditBody] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const refresh = useCallback(async () => {
    const [n, e, f, x] = await Promise.all([
      db.listNotes(), db.listEvents(year), db.listFiles(), db.listExams(),
    ])
    setNotes(n); setEvents(e); setFiles(f); setExams(x)
  }, [year])

  useEffect(() => { db.seedIfEmpty().then(() => refresh()).then(() => setReady(true)) }, [refresh])
  useEffect(() => { refresh() }, [year, refresh])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setSearchOpen(true); setSearchQ('') }
      if (e.key === 'Escape') { setSearchOpen(false); setEventModal(false); setExamModal(false); setNoteModal(false); setEditBody(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const currentNote = useMemo(() => notes.find(n => n.id === currentNoteId) || notes[0] || null, [notes, currentNoteId])
  useEffect(() => { if (!currentNoteId && notes.length) setCurrentNoteId(notes[0].id) }, [notes, currentNoteId])

  const folders = useMemo(() => {
    const s = new Set(files.map(f => f.folder || 'General'))
    return ['General', ...[...s].filter(x => x !== 'General').sort()]
  }, [files])

  const searchHits = useMemo(() => {
    const q = searchQ.toLowerCase()
    if (!q) return notes
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.path.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
  }, [notes, searchQ])

  function renderMarkdown(text: string) {
    let h = text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
    h = h.replace(/^## (.+)$/gm, '<h2 class="text-lg font-medium mt-6 mb-2 pb-2 border-b border-[#e8eaed]">$1</h2>')
    h = h.replace(/^# (.+)$/gm, '<h1 class="text-xl font-medium mt-4 mb-2">$1</h1>')
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    h = h.replace(/\[\[([^\]]+)\]\]/g, (_, t) => {
      const note = notes.find(n => n.title.includes(t) || t.includes(n.title.split('\u2014')[0].trim()))
      return '<a data-id="' + (note?.id || '') + '" class="wiki text-[#1a73e8] cursor-pointer hover:underline">[[' + t + ']]</a>'
    })
    h = h.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    h = h.replace(/\n\n/g, '</p><p class="mb-3">')
    return '<p class="mb-3">' + h + '</p>'
  }

  async function addEvent() {
    if (!form.title || !form.date) return
    await db.saveEvent({ title: form.title, date: form.date, time: form.time || '09:00', tipo: form.tipo || 'Presencial', estado: form.estado || 'Programada' })
    setEventModal(false); setForm({}); await refresh()
  }
  async function addExam() {
    if (!form.title) return
    await db.saveExam({ title: form.title, preguntas: parseInt(form.preguntas || '10', 10), notaMin: parseInt(form.notaMin || '70', 10) })
    setExamModal(false); setForm({}); await refresh()
  }
  async function addNote() {
    if (!form.title) return
    const note = await db.saveNote({ title: form.title, path: (form.folder || 'Base de Conocimiento') + '/' + form.title + '.md', body: '# ' + form.title + '\n\nEscribe aqui...\n' })
    setNoteModal(false); setForm({}); await refresh(); setCurrentNoteId(note.id); setView('vault')
  }
  async function saveNoteBody() {
    if (!currentNote) return
    await db.saveNote({ ...currentNote, body: form.body ?? currentNote.body })
    setEditBody(false); setForm({}); await refresh()
  }
  async function dupYear() {
    const next = year + 1
    if (!confirm('Duplicar eventos de ' + year + ' a ' + next + '?')) return
    for (const e of await db.listEvents(year)) {
      await db.saveEvent({ ...e, id: undefined as unknown as string, date: e.date.replace(String(year), String(next)), estado: 'Borrador' })
    }
    setYear(next)
  }
  async function onUpload(fileList: FileList | null) {
    if (!fileList?.length) return
    for (const file of Array.from(fileList)) {
      await db.saveFile({ name: file.name, folder: fileFolder, type: file.type, size: file.size, blob: file })
    }
    await refresh()
  }
  async function downloadFile(id: string) {
    const f = await db.getFile(id)
    if (!f?.blob) return alert('Archivo no disponible')
    const url = URL.createObjectURL(f.blob)
    const a = document.createElement('a'); a.href = url; a.download = f.name; a.click(); URL.revokeObjectURL(url)
  }
  function exportAudit() {
    const data = { exportedAt: new Date().toISOString(), year, notes: notes.map(({ body, ...r }) => r), events, files: files.map(({ blob, ...r }) => r), exams }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'CapaciHub-auditoria-' + year + '.json'; a.click()
  }

  const tree = useMemo(() => {
    const structure: Record<string, unknown> = {}
    notes.forEach(n => {
      const parts = (n.path || n.title + '.md').split('/')
      let cur = structure as Record<string, unknown>
      parts.forEach((part, i) => {
        if (i === parts.length - 1) cur[part] = { __note: n }
        else { cur[part] = cur[part] || {}; cur = cur[part] as Record<string, unknown> }
      })
    })
    return structure
  }, [notes])

  function TreeNodes({ obj, depth = 0 }: { obj: Record<string, unknown>; depth?: number }) {
    const keys = Object.keys(obj).sort((a, b) => {
      const af = !(obj[a] as { __note?: Note }).__note
      const bf = !(obj[b] as { __note?: Note }).__note
      if (af !== bf) return af ? -1 : 1
      return a.localeCompare(b)
    })
    return (
      <>
        {keys.map(key => {
          const val = obj[key] as { __note?: Note } & Record<string, unknown>
          if (val.__note) {
            const n = val.__note
            const on = currentNote?.id === n.id
            const cls = on
              ? 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors bg-[#e8f0fe] text-[#1967d2] font-medium'
              : 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors text-[#202124] hover:bg-[#f1f3f4]'
            return (
              <button key={n.id} type="button" onClick={() => { setCurrentNoteId(n.id); setView('vault') }}
                className={cls} style={{ paddingLeft: 12 + depth * 14 }}>
                <span className="text-base">📝</span><span className="truncate">{key}</span>
              </button>
            )
          }
          return (
            <div key={key}>
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#5f6368]" style={{ paddingLeft: 12 + depth * 14 }}>
                <span>📁</span><span className="truncate font-medium">{key}</span>
              </div>
              <TreeNodes obj={val as Record<string, unknown>} depth={depth + 1} />
            </div>
          )
        })}
      </>
    )
  }

  if (!ready) return <div className="h-full flex items-center justify-center bg-[#f8f9fa] text-[#5f6368]">Cargando CapaciHub…</div>

  return (
    <div className="h-full flex flex-col">
      <header className="h-14 bg-white border-b border-[#e8eaed] flex items-center px-3 gap-3 shadow-sm z-10 shrink-0">
        <span className="text-[22px] text-[#5f6368] pl-1">Capaci<span className="text-[#1a73e8] font-medium">Hub</span></span>
        <div className="flex-1 flex gap-1 ml-4 min-w-0">
          {currentNote && view === 'vault' && (
            <span className="px-4 py-2 rounded-full text-sm bg-[#e8f0fe] text-[#1967d2] font-medium truncate max-w-xs">{currentNote.title.split('\u2014')[0].trim()}</span>
          )}
        </div>
        <button type="button" onClick={() => { setSearchOpen(true); setSearchQ('') }} className="flex items-center gap-2 h-10 px-4 rounded-full bg-[#f1f3f4] text-[#5f6368] text-sm hover:bg-[#e8eaed]">
          <Search size={16} /><span className="hidden sm:inline">Buscar (Ctrl+P)</span>
        </button>
      </header>

      <div className="flex-1 flex min-h-0">
        <nav className="w-16 bg-white border-r border-[#e8eaed] flex flex-col items-center py-3 gap-1 shrink-0">
          {NAV.map(({ id, icon: Icon, label }) => {
            const active = view === id
            const cls = active
              ? 'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors bg-[#e8f0fe] text-[#1a73e8]'
              : 'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors text-[#5f6368] hover:bg-[#f1f3f4]'
            return (
              <button key={id} type="button" title={label} onClick={() => setView(id)} className={cls}>
                <Icon size={20} />
              </button>
            )
          })}
        </nav>

        {view === 'vault' && (
          <aside className="w-[280px] bg-white border-r border-[#e8eaed] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wider text-[#5f6368]">Archivos</span>
              <button type="button" onClick={() => { setForm({}); setNoteModal(true) }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4]"><Plus size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4"><TreeNodes obj={tree} /></div>
          </aside>
        )}

        <main className="flex-1 flex flex-col min-w-0 bg-[#f8f9fa]">
          {view === 'vault' && currentNote && (
            <>
              <div className="h-12 bg-white border-b border-[#e8eaed] flex items-center px-6 gap-2 shrink-0">
                <button type="button" className="px-4 py-1.5 rounded-full text-sm font-medium bg-[#e8f0fe] text-[#1967d2]">Lectura</button>
                <button type="button" onClick={() => { setForm({ body: currentNote.body }); setEditBody(true) }} className="px-4 py-1.5 rounded-full text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4]">Editar</button>
              </div>
              <div className="flex-1 overflow-y-auto p-10">
                <article className="max-w-[720px] mx-auto bg-white rounded-xl shadow-sm border border-[#e8eaed] p-10">
                  <h1 className="text-[28px] font-normal text-[#202124] tracking-tight mb-2">{currentNote.title}</h1>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-[#80868b] mb-7">
                    <span>{new Date(currentNote.updatedAt).toLocaleDateString('es')}</span>
                    {currentNote.tags.map(t => (<span key={t} className="px-2.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1967d2] text-xs font-medium">#{t}</span>))}
                  </div>
                  <div className="text-[15px] leading-relaxed text-[#202124]" dangerouslySetInnerHTML={{ __html: renderMarkdown(currentNote.body) }}
                    onClick={e => { const a = (e.target as HTMLElement).closest('a.wiki') as HTMLElement | null; if (a?.dataset.id) setCurrentNoteId(a.dataset.id) }} />
                </article>
              </div>
            </>
          )}

          {view === 'cronograma' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h1 className="text-[28px] font-normal text-[#202124] mb-1">Cronograma</h1>
              <p className="text-sm text-[#5f6368] mb-6">Plan del año · Duplica al siguiente</p>
              <div className="flex flex-wrap gap-3 items-center mb-6">
                <select value={year} onChange={e => setYear(+e.target.value)} className={inputCls + ' w-28'}>
                  {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button type="button" onClick={() => { setForm({ date: year + '-09-01', time: '09:00', tipo: 'Presencial', estado: 'Programada' }); setEventModal(true) }} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2"><Plus size={16} /> Capacitación</button>
                <button type="button" onClick={dupYear} className="h-10 px-5 rounded-full border border-[#dadce0] text-[#1967d2] text-sm font-medium hover:bg-[#e8f0fe] flex items-center gap-2"><Copy size={16} /> Duplicar año</button>
              </div>
              <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm overflow-hidden">
                {events.length === 0 ? <div className="p-12 text-center text-[#80868b] text-sm">No hay capacitaciones</div> :
                  [...events].sort((a, b) => a.date.localeCompare(b.date)).map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-[#e8eaed] last:border-0 hover:bg-[#f8f9fa]">
                      <span className="text-sm text-[#5f6368] w-36 shrink-0">{e.date} {e.time}</span>
                      <span className="flex-1 font-medium text-sm">{e.title}</span>
                      <Chip tone={e.estado === 'Pendiente' ? 'orange' : e.estado === 'Borrador' ? 'blue' : 'green'}>{e.estado}</Chip>
                      <button type="button" onClick={async () => { if (confirm('Eliminar?')) { await db.deleteEvent(e.id); await refresh() } }} className="p-1.5 rounded-full text-[#80868b] hover:bg-[#fce8e6] hover:text-[#d93025]"><Trash2 size={16} /></button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {view === 'files' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-8 pt-8 pb-4">
                <h1 className="text-[28px] font-normal text-[#202124] mb-1">Almacenamiento</h1>
                <p className="text-sm text-[#5f6368] mb-4">PDF, PPT, Word, Excel, imágenes</p>
                <div className="flex gap-3">
                  <label className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2 cursor-pointer">
                    <Upload size={16} /> Subir<input type="file" multiple className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.zip" onChange={e => onUpload(e.target.files)} />
                  </label>
                  <button type="button" onClick={() => { const n = prompt('Carpeta:', '2026 / Materiales'); if (n) setFileFolder(n) }} className="h-10 px-5 rounded-full border border-[#dadce0] text-[#1967d2] text-sm font-medium hover:bg-[#e8f0fe]">Nueva carpeta</button>
                </div>
              </div>
              <div className="flex-1 flex min-h-0 border-t border-[#e8eaed]">
                <div className="w-56 bg-white border-r border-[#e8eaed] overflow-y-auto p-2">
                  {folders.map(f => {
                    const active = fileFolder === f
                    const cls = active
                      ? 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left bg-[#e8f0fe] text-[#1967d2] font-medium'
                      : 'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left hover:bg-[#f1f3f4]'
                    return (
                      <button key={f} type="button" onClick={() => setFileFolder(f)} className={cls}>
                        <span>📁</span><span className="truncate flex-1">{f}</span>
                        <span className="text-xs text-[#80868b]">{files.filter(x => (x.folder || 'General') === f).length}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 border-2 border-dashed border-[#dadce0] rounded-xl p-8 text-center text-sm text-[#5f6368] bg-white"
                    onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onUpload(e.dataTransfer.files) }}>
                    Arrastra archivos aquí
                  </div>
                  <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm overflow-hidden">
                    {files.filter(f => (f.folder || 'General') === fileFolder).map(f => (
                      <div key={f.id} className="flex items-center gap-3 px-5 py-3 border-b border-[#e8eaed] last:border-0 hover:bg-[#f8f9fa]">
                        <span>📎</span><span className="flex-1 font-medium text-sm truncate">{f.name}</span>
                        <button type="button" onClick={() => downloadFile(f.id)} className="p-1.5 rounded-full hover:bg-[#e8f0fe] text-[#1a73e8]"><Download size={16} /></button>
                        <button type="button" onClick={async () => { if (confirm('Eliminar?')) { await db.deleteFile(f.id); await refresh() } }} className="p-1.5 rounded-full hover:bg-[#fce8e6]"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {files.filter(f => (f.folder || 'General') === fileFolder).length === 0 && <div className="p-12 text-center text-[#80868b] text-sm">Carpeta vacía</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'examenes' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h1 className="text-[28px] font-normal text-[#202124] mb-1">Exámenes</h1>
              <p className="text-sm text-[#5f6368] mb-6">Evaluaciones</p>
              <button type="button" onClick={() => { setForm({ preguntas: '10', notaMin: '70' }); setExamModal(true) }} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2 mb-6"><Plus size={16} /> Crear examen</button>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map(x => (
                  <div key={x.id} className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-5">
                    <Chip tone={x.estado === 'Activo' ? 'green' : 'orange'}>{x.estado}</Chip>
                    <div className="font-medium mt-3 mb-1">{x.title}</div>
                    <div className="text-xs text-[#80868b]">{x.preguntas} preguntas · Mín. {x.notaMin}%</div>
                  </div>
                ))}
                {exams.length === 0 && <div className="col-span-full p-12 text-center text-[#80868b] text-sm bg-white rounded-xl border">Sin exámenes</div>}
              </div>
            </div>
          )}

          {view === 'auditoria' && (
            <div className="flex-1 overflow-y-auto p-8">
              <h1 className="text-[28px] font-normal text-[#202124] mb-1">Auditoría</h1>
              <p className="text-sm text-[#5f6368] mb-6">Exporta JSON para fin de año</p>
              <button type="button" onClick={exportAudit} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] mb-6">Exportar JSON</button>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[{ label: 'Eventos ' + year, value: events.length }, { label: 'OK', value: events.filter(e => e.estado === 'Confirmada' || e.estado === 'Programada').length }, { label: 'Archivos', value: files.length }, { label: 'Exámenes', value: exams.length }].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-5">
                    <div className="text-xs text-[#80868b] mb-1">{s.label}</div>
                    <div className="text-3xl font-medium">{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-6 space-y-3">
                {['Cronograma aprobado', 'Cronograma próximo año', 'Asistencias digitalizadas', 'Materiales versionados', 'Resultados disponibles', 'Certificados emitidos'].map(label => (
                  <label key={label} className="flex items-center gap-3 text-sm cursor-pointer"><input type="checkbox" className="w-[18px] h-[18px] accent-[#1a73e8]" />{label}</label>
                ))}
              </div>
            </div>
          )}

          {view === 'graph' && (
            <div className="flex-1 flex items-center justify-center bg-[#e8eaed] text-[#5f6368] text-sm p-8">
              <div className="text-center max-w-md">
                <Network size={48} className="mx-auto mb-4 text-[#1a73e8]" />
                <p className="font-medium text-[#202124] mb-2">Grafo de relaciones</p>
                <p>Enlaces con wiki links entre notas del Vault.</p>
                <p className="mt-3 text-xs">{notes.length} notas · {events.length} eventos · {exams.length} exámenes</p>
              </div>
            </div>
          )}
        </main>

        {view === 'vault' && currentNote && (
          <aside className="w-[280px] bg-white border-l border-[#e8eaed] flex flex-col shrink-0 overflow-hidden">
            <div className="p-5 border-b border-[#e8eaed]">
              <div className="text-xs font-medium uppercase tracking-wider text-[#5f6368] mb-3">Propiedades</div>
              {Object.keys(currentNote.props).length === 0 ? <div className="text-sm text-[#80868b]">Sin propiedades</div> :
                Object.entries(currentNote.props).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1.5"><span className="text-[#5f6368]">{k}</span><span>{v}</span></div>
                ))}
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="text-xs font-medium uppercase tracking-wider text-[#5f6368] mb-3">Enlazado desde</div>
              {notes.filter(o => o.id !== currentNote.id && o.body.includes(currentNote.title.split('\u2014')[0].trim())).map(o => (
                <button key={o.id} type="button" onClick={() => setCurrentNoteId(o.id)} className="block w-full text-left text-sm text-[#1a73e8] py-2 px-2 rounded-lg hover:bg-[#f1f3f4]">
                  {o.title}<div className="text-xs text-[#80868b] mt-0.5">menciona esta nota</div>
                </button>
              ))}
            </div>
          </aside>
        )}
      </div>

      <footer className="h-7 bg-white border-t border-[#e8eaed] flex items-center px-4 text-xs text-[#80868b] gap-3 shrink-0">
        <span>Vault local</span><span className="w-px h-3 bg-[#dadce0]" /><span className="truncate">{currentNote?.path || '-'}</span>
        <span className="ml-auto">CapaciHub · React + Vite + Tailwind</span>
      </footer>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-[2px]" onClick={() => setSearchOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e8eaed]">
              <Search size={18} className="text-[#80868b]" />
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Buscar notas..." className="flex-1 outline-none text-base" />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {searchHits.map(n => (
                <button key={n.id} type="button" onClick={() => { setCurrentNoteId(n.id); setView('vault'); setSearchOpen(false) }} className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f1f3f4] text-sm">
                  <span>📝</span><div><div>{n.title}</div><div className="text-xs text-[#80868b]">{n.path}</div></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={eventModal} onClose={() => setEventModal(false)} title="Nueva capacitacion">
        <Field label="Titulo"><input className={inputCls} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Fecha"><input type="date" className={inputCls} value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
        <Field label="Hora"><input type="time" className={inputCls} value={form.time || '09:00'} onChange={e => setForm({ ...form, time: e.target.value })} /></Field>
        <Field label="Tipo"><select className={inputCls} value={form.tipo || 'Presencial'} onChange={e => setForm({ ...form, tipo: e.target.value })}><option>Presencial</option><option>Virtual</option><option>Hibrida</option></select></Field>
        <Field label="Estado"><select className={inputCls} value={form.estado || 'Programada'} onChange={e => setForm({ ...form, estado: e.target.value })}><option>Programada</option><option>Confirmada</option><option>Pendiente</option><option>Borrador</option></select></Field>
        <button type="button" onClick={addEvent} className="w-full h-10 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Guardar</button>
      </Modal>

      <Modal open={examModal} onClose={() => setExamModal(false)} title="Nuevo examen">
        <Field label="Titulo"><input className={inputCls} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Preguntas"><input type="number" className={inputCls} value={form.preguntas || '10'} onChange={e => setForm({ ...form, preguntas: e.target.value })} /></Field>
        <Field label="Nota minima %"><input type="number" className={inputCls} value={form.notaMin || '70'} onChange={e => setForm({ ...form, notaMin: e.target.value })} /></Field>
        <button type="button" onClick={addExam} className="w-full h-10 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Guardar</button>
      </Modal>

      <Modal open={noteModal} onClose={() => setNoteModal(false)} title="Nueva nota">
        <Field label="Titulo"><input className={inputCls} value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
        <Field label="Carpeta"><input className={inputCls} value={form.folder || 'Base de Conocimiento'} onChange={e => setForm({ ...form, folder: e.target.value })} /></Field>
        <button type="button" onClick={addNote} className="w-full h-10 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Crear</button>
      </Modal>

      <Modal open={editBody} onClose={() => setEditBody(false)} title="Editar nota">
        <Field label="Contenido (markdown)"><textarea className={inputCls + ' h-48 py-2 resize-y'} value={form.body || ''} onChange={e => setForm({ ...form, body: e.target.value })} /></Field>
        <button type="button" onClick={saveNoteBody} className="w-full h-10 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Guardar</button>
      </Modal>
    </div>
  )
}
