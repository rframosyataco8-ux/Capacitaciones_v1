import { useEffect, useState, useCallback } from 'react'
import { Plus, ClipboardList, Trash2, Pencil, X, Save } from 'lucide-react'
import {
  seedIfEmpty,
  listExams,
  saveExam,
  deleteExam,
  listCapacitaciones,
  type Exam,
  type Capacitacion,
  type ExamQuestion,
} from '../lib/db'

function uid() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function Examenes() {
  const [exams, setExams] = useState<Exam[]>([])
  const [temas, setTemas] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Exam | null>(null)
  const [titulo, setTitulo] = useState('')
  const [temaId, setTemaId] = useState<number | ''>('')
  const [preguntas, setPreguntas] = useState<ExamQuestion[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    const [e, caps] = await Promise.all([listExams(), listCapacitaciones(2026)])
    setExams(e)
    setTemas(caps)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function openNew() {
    setEditing(null)
    setTitulo('')
    setTemaId('')
    setPreguntas([
      { id: uid(), tipo: 'multiple', texto: '', opciones: ['', '', '', ''], correcta: 0 },
    ])
    setFormOpen(true)
  }

  function openEdit(ex: Exam) {
    setEditing(ex)
    setTitulo(ex.titulo)
    setTemaId(ex.capacitacionId ?? '')
    setPreguntas(ex.preguntas?.length ? ex.preguntas : [])
    setFormOpen(true)
  }

  async function handleSave() {
    if (!titulo.trim()) return
    const cap = temas.find((t) => t.id === temaId)
    await saveExam({
      id: editing?.id,
      titulo: titulo.trim(),
      capacitacionId: typeof temaId === 'number' ? temaId : null,
      tema: cap?.tema,
      estado: editing?.estado ?? 'Borrador',
      preguntas: preguntas.filter((p) => p.texto.trim()),
      createdAt: editing?.createdAt,
    })
    setFormOpen(false)
    await refresh()
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este examen?')) return
    await deleteExam(id)
    await refresh()
  }

  function updatePregunta(id: string, patch: Partial<ExamQuestion>) {
    setPreguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[var(--border)] px-7 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Exámenes</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Enlazados a temas del programa · Verificación de aprendizaje
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Nuevo examen
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-7">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
        ) : exams.length === 0 ? (
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-16 text-center max-w-lg mx-auto">
            <ClipboardList size={28} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-[14px] font-medium">Sin exámenes</p>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1 mb-4">
              Crea un examen y enlázalo a un tema (ej. Sistema HACCP) para medir si el refuerzo funcionó.
            </p>
            <button type="button" className="btn btn-primary" onClick={openNew}>
              <Plus size={15} /> Crear examen
            </button>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[#f8f9fa]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate">{ex.titulo}</div>
                  <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                    {ex.tema || 'Sin tema'} · {(ex.preguntas || []).length} preguntas · {ex.estado}
                  </div>
                </div>
                <button type="button" className="btn-icon" onClick={() => openEdit(ex)} title="Editar">
                  <Pencil size={15} />
                </button>
                <button type="button" className="btn-icon text-[var(--danger)]" onClick={() => ex.id && handleDelete(ex.id)} title="Eliminar">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <div className="modal-panel max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-white">
              <h2 className="text-[15px] font-semibold">{editing ? 'Editar examen' : 'Nuevo examen'}</h2>
              <button type="button" className="btn-icon" onClick={() => setFormOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Título *</span>
                <input className="input w-full" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Examen HACCP - Refuerzo Q1" />
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tema del programa</span>
                <select
                  className="input w-full"
                  value={temaId === '' ? '' : String(temaId)}
                  onChange={(e) => setTemaId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">— Sin enlazar —</option>
                  {temas.map((t) => (
                    <option key={t.id} value={t.id}>{t.tema}</option>
                  ))}
                </select>
              </label>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Preguntas</span>
                  <button
                    type="button"
                    className="text-[12px] text-[var(--primary)] font-medium"
                    onClick={() =>
                      setPreguntas((p) => [
                        ...p,
                        { id: uid(), tipo: 'multiple', texto: '', opciones: ['', '', '', ''], correcta: 0 },
                      ])
                    }
                  >
                    + Añadir
                  </button>
                </div>
                <div className="space-y-3">
                  {preguntas.map((p, idx) => (
                    <div key={p.id} className="border border-[var(--border)] rounded-lg p-3">
                      <div className="flex gap-2 mb-2">
                        <span className="text-[12px] text-[var(--text-muted)] pt-2">{idx + 1}.</span>
                        <input
                          className="input flex-1"
                          value={p.texto}
                          onChange={(e) => updatePregunta(p.id, { texto: e.target.value })}
                          placeholder="Enunciado"
                        />
                        <select
                          className="input w-[130px]"
                          value={p.tipo}
                          onChange={(e) =>
                            updatePregunta(p.id, {
                              tipo: e.target.value as ExamQuestion['tipo'],
                            })
                          }
                        >
                          <option value="multiple">Múltiple</option>
                          <option value="verdadero_falso">V / F</option>
                          <option value="abierta">Abierta</option>
                        </select>
                      </div>
                      {p.tipo === 'multiple' && (
                        <div className="grid grid-cols-2 gap-2 ml-6">
                          {(p.opciones || ['', '', '', '']).map((op, i) => (
                            <input
                              key={i}
                              className="input text-[12px]"
                              value={op}
                              onChange={(e) => {
                                const ops = [...(p.opciones || ['', '', '', ''])]
                                ops[i] = e.target.value
                                updatePregunta(p.id, { opciones: ops })
                              }}
                              placeholder={`Opción ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setFormOpen(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={handleSave}>
                  <Save size={14} /> Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
