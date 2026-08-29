import { useEffect, useState, useCallback } from 'react'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Save,
  FileSpreadsheet,
  FileText,
  FileType,
  X,
  Search,
  CalendarDays,
} from 'lucide-react'
import {
  seedIfEmpty,
  listCapacitaciones,
  saveCapacitacion,
  deleteCapacitacion,
  type Capacitacion,
} from '../lib/db'

function formatDates(fechas: string[]) {
  if (!fechas.length) return '—'
  return fechas
    .map((d) => {
      const [y, m, day] = d.split('-')
      return `${day}/${m}/${y}`
    })
    .join(' · ')
}

export default function Cronograma() {
  const [year, setYear] = useState(2026)
  const [rows, setRows] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Capacitacion | null>(null)
  const [editing, setEditing] = useState<Capacitacion | null>(null)
  const [form, setForm] = useState({ tema: '', responsable: '', periodoTexto: '', fechas: '' })

  const refresh = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    const data = await listCapacitaciones(year)
    setRows(data)
    setLoading(false)
  }, [year])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.tema.toLowerCase().includes(search.toLowerCase()) ||
      r.responsable.toLowerCase().includes(search.toLowerCase()) ||
      r.codigo.toLowerCase().includes(search.toLowerCase())
  )

  function openNew() {
    setEditing(null)
    setForm({ tema: '', responsable: '', periodoTexto: '', fechas: '' })
    setSelected(null)
  }

  function openEdit(row: Capacitacion) {
    setEditing(row)
    setForm({
      tema: row.tema,
      responsable: row.responsable,
      periodoTexto: row.periodoTexto,
      fechas: row.fechas.join(', '),
    })
    setSelected(null)
  }

  async function handleSave() {
    if (!form.tema.trim()) return
    const fechas = form.fechas
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        // accept DD/MM/YYYY or YYYY-MM-DD
        if (s.includes('/')) {
          const [d, m, y] = s.split('/')
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        }
        return s
      })

    const nextItem = editing ? editing.item : (rows.length ? Math.max(...rows.map((r) => r.item)) + 1 : 1)
    const codigo = editing?.codigo ?? `CAP-${year}-${String(nextItem).padStart(3, '0')}`

    await saveCapacitacion({
      id: editing?.id,
      codigo,
      year,
      item: nextItem,
      tema: form.tema.trim(),
      responsable: form.responsable.trim() || 'Por asignar',
      fechas,
      periodoTexto: form.periodoTexto.trim() || formatDates(fechas),
      estado: editing?.estado ?? 'Programada',
    })
    setEditing(null)
    setForm({ tema: '', responsable: '', periodoTexto: '', fechas: '' })
    await refresh()
  }

  async function handleDelete(id: number) {
    if (!confirm('\u00bfEliminar esta capacitaci\u00f3n?')) return
    await deleteCapacitacion(id)
    setSelected(null)
    await refresh()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] px-7 py-5 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CalendarDays size={18} className="text-[var(--primary)]" />
              <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Cronograma</h1>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)]">
              EXPORTADORA ROMEX S.A. · Programa Anual de Formaci\u00f3n · C\u00f3digo HACCP 004
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={year} onChange={(e) => setYear(+e.target.value)} className="input w-[100px]">
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={openNew}>
              <Plus size={15} strokeWidth={2.2} />
              Nueva capacitaci\u00f3n
            </button>
            <div className="h-5 w-px bg-[var(--border)] mx-0.5" />
            <button type="button" className="btn btn-ghost" title="Exportar Excel">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button type="button" className="btn btn-ghost" title="Exportar Word">
              <FileText size={14} /> Word
            </button>
            <button type="button" className="btn btn-ghost" title="Exportar PDF">
              <FileType size={14} /> PDF
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input w-full pl-9"
            placeholder="Buscar por tema, responsable o c\u00f3digo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--text-muted)] text-sm">Cargando…</div>
        ) : (
          <div className="table-wrap animate-in">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[var(--border)] text-left">
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[110px]">ID</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Tema</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[180px]">Fecha o periodo</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[170px]">Responsable</th>
                  <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[140px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[#f9fafb] transition-colors duration-150 group"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--text-secondary)]">{row.codigo}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text)] leading-snug">{row.tema}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.periodoTexto}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{row.responsable}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          title="Visualizar"
                          onClick={() => setSelected(row)}
                          className="btn-icon text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => openEdit(row)}
                          className="btn-icon text-[var(--text-secondary)] hover:bg-[#f3f4f6]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title="Guardar"
                          onClick={() => openEdit(row)}
                          className="btn-icon text-[var(--success)] hover:bg-[var(--success-soft)]"
                        >
                          <Save size={15} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          onClick={() => row.id && handleDelete(row.id)}
                          className="btn-icon text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-[var(--text-muted)] text-sm">
                No hay capacitaciones para {year}
              </div>
            )}
          </div>
        )}
        <div className="mt-3 text-[12px] text-[var(--text-muted)]">
          {filtered.length} capacitaci{filtered.length === 1 ? '\u00f3n' : 'ones'} · A\u00f1o {year}
        </div>
      </div>

      {/* Modal Visualizar */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-semibold text-[var(--text)]">Detalle de capacitaci\u00f3n</h2>
              <button type="button" onClick={() => setSelected(null)} className="btn-icon text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">ID</div>
                  <div className="font-mono text-[var(--text)]">{selected.codigo}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Estado</div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--primary-soft)] text-[var(--primary-text)]">
                    {selected.estado}
                  </span>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Tema</div>
                  <div className="font-medium text-[var(--text)]">{selected.tema}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Fecha o periodo</div>
                  <div className="text-[var(--text)]">{selected.periodoTexto}</div>
                  <div className="text-[12px] text-[var(--text-muted)] mt-1">{formatDates(selected.fechas)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Responsable</div>
                  <div className="text-[var(--text)]">{selected.responsable}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Accesos directos</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="px-2.5 py-1.5 rounded-lg bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] transition-colors">
                    Examen
                  </button>
                  <button type="button" className="px-2.5 py-1.5 rounded-lg bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] transition-colors">
                    PPTX / Materiales
                  </button>
                  <button type="button" className="px-2.5 py-1.5 rounded-lg bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] transition-colors">
                    Data Storage
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => openEdit(selected)}>
                  <Pencil size={14} /> Editar
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={() => setSelected(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {(editing !== null || (editing === null && form.tema === '' && document.activeElement?.tagName === 'BUTTON')) && false}
      {(editing !== undefined && (editing !== null || form.tema !== undefined)) && (
        // Always show form panel when openNew or openEdit was called
        null
      )}

      {/* Form drawer */}
      {(editing !== null || (form.tema === '' && editing === null && false)) ? null : null}

      {/* Simple form modal controlled by editing or a "creating" flag */}
      <FormModal
        open={editing !== null || (typeof (window as unknown as { __creating?: boolean }).__creating !== 'undefined')}
        editing={editing}
        form={form}
        setForm={setForm}
        onClose={() => {
          setEditing(null)
          setForm({ tema: '', responsable: '', periodoTexto: '', fechas: '' })
        }}
        onSave={handleSave}
        year={year}
      />
    </div>
  )
}

function FormModal({
  open,
  editing,
  form,
  setForm,
  onClose,
  onSave,
  year,
}: {
  open: boolean
  editing: Capacitacion | null
  form: { tema: string; responsable: string; periodoTexto: string; fechas: string }
  setForm: (f: typeof form) => void
  onClose: () => void
  onSave: () => void
  year: number
}) {
  // We need a creating flag - simplify: show when editing is not null OR when user clicked new
  // For reliability, parent will pass open based on a local state
  return null // replaced below
}
