import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
  FileType,
  X,
  Search,
  CalendarRange,
  Copy,
  Building2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import {
  seedIfEmpty,
  listCapacitaciones,
  saveCapacitacion,
  deleteCapacitacion,
  db,
  type Capacitacion,
} from '../lib/db'

function formatDate(d: string) {
  const p = d.split('-')
  if (p.length !== 3) return d
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const mi = parseInt(p[1], 10) - 1
  return `${parseInt(p[2], 10)} ${months[mi] || p[1]}`
}

function formatDateFull(d: string) {
  const p = d.split('-')
  if (p.length !== 3) return d
  return `${p[2]}/${p[1]}/${p[0]}`
}

export default function Cronograma() {
  const [year, setYear] = useState(2026)
  const [rows, setRows] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Capacitacion | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Capacitacion | null>(null)
  const [yearModal, setYearModal] = useState(false)
  const [newYear, setNewYear] = useState(2027)
  const [copyFrom, setCopyFrom] = useState(2026)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [form, setForm] = useState({
    tema: '',
    responsable: '',
    periodoTexto: '',
    fechas: '',
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    let data = await listCapacitaciones(year)

    // Deduplicate by tema (keep first, merge fechas if accidental dupes)
    const byTema = new Map<string, Capacitacion>()
    for (const r of data) {
      const key = r.tema.trim().toLowerCase()
      const existing = byTema.get(key)
      if (!existing) {
        byTema.set(key, { ...r })
      } else {
        const merged = Array.from(new Set([...existing.fechas, ...r.fechas])).sort()
        byTema.set(key, {
          ...existing,
          fechas: merged,
          periodoTexto:
            merged.length > 1
              ? `${merged.length} sesiones \u00b7 ${year}`
              : existing.periodoTexto,
        })
        if (r.id && r.id !== existing.id) {
          await deleteCapacitacion(r.id)
        }
      }
    }
    data = Array.from(byTema.values()).sort((a, b) => a.item - b.item)
    setRows(data)
    setLoading(false)
  }, [year])

  useEffect(() => {
    refresh()
  }, [refresh])

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          !search ||
          r.tema.toLowerCase().includes(search.toLowerCase()) ||
          r.responsable.toLowerCase().includes(search.toLowerCase()) ||
          r.codigo.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  )

  const totalSesiones = useMemo(
    () => filtered.reduce((acc, r) => acc + (r.fechas?.length || 0), 0),
    [filtered]
  )

  async function createAnnualProgram() {
    const existing = await listCapacitaciones(newYear)
    if (existing.length > 0) {
      if (
        !confirm(
          `Ya existe un programa ${newYear} (${existing.length} temas). \u00bfReemplazarlo?`
        )
      )
        return
      await db.capacitaciones.where('year').equals(newYear).delete()
      await db.folders.where('year').equals(newYear).delete()
    }

    const source = await listCapacitaciones(copyFrom)
    const now = new Date().toISOString()

    if (source.length === 0) {
      setYear(newYear)
      setYearModal(false)
      return
    }

    // Unique by tema when copying
    const seen = new Set<string>()
    const unique = source.filter((s) => {
      const k = s.tema.trim().toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

    const mapped = unique.map((s, i) => {
      const fechas = s.fechas.map((f) =>
        f.replace(String(copyFrom), String(newYear))
      )
      return {
        codigo: `CAP-${newYear}-${String(i + 1).padStart(3, '0')}`,
        year: newYear,
        item: i + 1,
        tema: s.tema,
        responsable: s.responsable,
        fechas,
        periodoTexto:
          fechas.length > 1
            ? `${fechas.length} sesiones \u00b7 ${newYear}`
            : s.periodoTexto.replace(String(copyFrom), String(newYear)),
        estado: 'Programada' as const,
        createdAt: now,
        updatedAt: now,
      }
    })

    await db.capacitaciones.bulkAdd(mapped)
    await db.folders.bulkAdd(
      mapped.map((c) => ({
        year: newYear,
        tema: c.tema,
        path: `Cronograma de Capacitaciones - ${newYear}/${c.tema}`,
        createdAt: now,
      }))
    )

    setYear(newYear)
    setYearModal(false)
    await refresh()
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
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm({ tema: '', responsable: '', periodoTexto: '', fechas: '' })
  }

  async function handleSave() {
    if (!form.tema.trim()) return
    const fechas = form.fechas
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        if (s.includes('/')) {
          const [d, m, y] = s.split('/')
          return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        }
        return s
      })

    const nextItem = editing
      ? editing.item
      : rows.length
        ? Math.max(...rows.map((r) => r.item)) + 1
        : 1

    const codigo =
      editing?.codigo ?? `CAP-${year}-${String(nextItem).padStart(3, '0')}`

    await saveCapacitacion({
      id: editing?.id,
      codigo,
      year,
      item: nextItem,
      tema: form.tema.trim(),
      responsable: form.responsable.trim() || 'Por asignar',
      fechas,
      periodoTexto:
        form.periodoTexto.trim() ||
        (fechas.length > 1
          ? `${fechas.length} sesiones \u00b7 ${year}`
          : formatDateFull(fechas[0] || '')),
      estado: editing?.estado ?? 'Programada',
    })
    closeForm()
    await refresh()
  }

  async function handleDelete(id: number) {
    if (!confirm('\u00bfEliminar este tema del programa anual?')) return
    await deleteCapacitacion(id)
    setSelected(null)
    await refresh()
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header documento */}
      <div className="bg-white border-b border-[var(--border)] shrink-0">
        <div className="px-7 pt-5 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-sm">
                <Building2 size={20} className="text-white" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[var(--primary)] tracking-widest uppercase mb-0.5">
                  EXPORTADORA ROMEX S.A.
                </div>
                <h1 className="text-[20px] font-semibold text-[var(--text)] tracking-tight leading-tight">
                  Programa Anual de Formaci\u00f3n {year}
                </h1>
                <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                  Planta de cacao \u00b7 Chincha \u00b7 C\u00f3digo HACCP 004
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={year}
                onChange={(e) => setYear(+e.target.value)}
                className="input w-[96px] font-medium"
              >
                {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setNewYear(year + 1)
                  setCopyFrom(year)
                  setYearModal(true)
                }}
              >
                <CalendarRange size={15} strokeWidth={2} />
                Nuevo programa anual
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                className="input w-full pl-9"
                placeholder="Buscar tema o responsable\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1" />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditing(null)
                setForm({ tema: '', responsable: '', periodoTexto: '', fechas: '' })
                setFormOpen(true)
              }}
            >
              <Plus size={14} /> Agregar tema
            </button>
            <div className="h-5 w-px bg-[var(--border)]" />
            <button type="button" className="btn btn-ghost" title="Excel">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button type="button" className="btn btn-ghost" title="Word">
              <FileText size={14} /> Word
            </button>
            <button type="button" className="btn btn-ghost" title="PDF">
              <FileType size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">
            Cargando programa {year}\u2026
          </div>
        ) : rows.length === 0 ? (
          <div className="table-wrap p-16 text-center animate-in">
            <div className="w-14 h-14 rounded-2xl bg-[#f1f3f4] flex items-center justify-center mx-auto mb-4">
              <CalendarRange size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[15px] font-medium text-[var(--text)] mb-1">
              No hay programa para {year}
            </p>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5 max-w-sm mx-auto">
              Crea el programa anual completo. Puedes copiarlo desde un a\u00f1o anterior.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setNewYear(year)
                setCopyFrom(2026)
                setYearModal(true)
              }}
            >
              <CalendarRange size={15} />
              Crear programa {year}
            </button>
          </div>
        ) : (
          <div className="table-wrap animate-in">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[var(--border)] text-left">
                  <th className="px-3 py-3 w-8" />
                  <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[28px]">
                    #
                  </th>
                  <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[100px]">
                    ID
                  </th>
                  <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                    Tema
                  </th>
                  <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[200px]">
                    Sesiones / periodo
                  </th>
                  <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[150px]">
                    Responsable
                  </th>
                  <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[110px] text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const id = row.id ?? row.item
                  const isOpen = expanded[id]
                  const n = row.fechas?.length || 0
                  const hasMulti = n > 1

                  return (
                    <>
                      <tr
                        key={row.id}
                        className="border-b border-[var(--border)] hover:bg-[#f8f9fa] transition-colors group"
                      >
                        <td className="px-2 py-3">
                          {hasMulti ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(id)}
                              className="btn-icon text-[var(--text-muted)]"
                              title={isOpen ? 'Ocultar sesiones' : 'Ver sesiones'}
                            >
                              {isOpen ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          ) : (
                            <span className="w-8 inline-block" />
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--text-muted)] tabular-nums">
                          {row.item}
                        </td>
                        <td className="px-3 py-3 font-mono text-[12px] text-[var(--text-secondary)]">
                          {row.codigo}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-[var(--text)] leading-snug">
                            {row.tema}
                          </div>
                          {hasMulti && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <RefreshCw size={11} className="text-[var(--primary)]" />
                              <span className="text-[11px] text-[var(--primary-text)] font-medium">
                                Refuerzo \u00b7 {n} sesiones en el a\u00f1o
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">
                          {hasMulti ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary-text)] text-[11px] font-medium">
                                {n} sesiones
                              </span>
                            </span>
                          ) : (
                            <span>{row.fechas[0] ? formatDate(row.fechas[0]) : row.periodoTexto}</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--text-secondary)]">
                          {row.responsable}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
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
                              className="btn-icon text-[var(--text-secondary)]"
                            >
                              <Pencil size={15} />
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
                      {hasMulti && isOpen && (
                        <tr key={`${row.id}-sessions`} className="bg-[#fafbfc]">
                          <td colSpan={7} className="px-6 py-3 border-b border-[var(--border)]">
                            <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                              Calendario de sesiones (refuerzos)
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {row.fechas.map((f, i) => (
                                <span
                                  key={f + i}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[var(--border)] text-[12px] text-[var(--text)] shadow-sm"
                                >
                                  <span className="w-5 h-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary-text)] text-[10px] font-semibold flex items-center justify-center">
                                    {i + 1}
                                  </span>
                                  {formatDateFull(f)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-3 flex items-center justify-between text-[12px] text-[var(--text-muted)]">
            <span>
              {filtered.length} tema{filtered.length !== 1 ? 's' : ''} \u00b7{' '}
              {totalSesiones} sesi\u00f3n{totalSesiones !== 1 ? 'es' : ''} programada
              {totalSesiones !== 1 ? 's' : ''} \u00b7 {year}
            </span>
            <span>Documento controlado \u00b7 Aseguramiento de Calidad</span>
          </div>
        )}
      </div>

      {/* Modal Nuevo programa anual */}
      {yearModal && (
        <div className="modal-backdrop" onClick={() => setYearModal(false)}>
          <div className="modal-panel max-w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-semibold">Nuevo programa anual</h2>
              <button type="button" onClick={() => setYearModal(false)} className="btn-icon text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
                Genera el programa completo de un a\u00f1o. Al copiar desde otro a\u00f1o se
                mantienen los temas y se reajustan las fechas; cada tema conserva sus
                sesiones de refuerzo.
              </p>
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  A\u00f1o del nuevo programa
                </span>
                <input
                  type="number"
                  className="input w-full"
                  value={newYear}
                  onChange={(e) => setNewYear(+e.target.value)}
                  min={2020}
                  max={2040}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Copiar estructura desde
                </span>
                <select
                  className="input w-full"
                  value={copyFrom}
                  onChange={(e) => setCopyFrom(+e.target.value)}
                >
                  {[2023, 2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setYearModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={createAnnualProgram}>
                  <Copy size={14} /> Crear programa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visualizar */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-semibold">Detalle de capacitaci\u00f3n</h2>
              <button type="button" onClick={() => setSelected(null)} className="btn-icon text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">ID</div>
                  <div className="font-mono">{selected.codigo}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Sesiones</div>
                  <div className="font-medium">{selected.fechas.length}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Tema</div>
                  <div className="font-medium">{selected.tema}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Fechas de sesi\u00f3n (refuerzos)
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selected.fechas.map((f, i) => (
                      <span
                        key={f + i}
                        className="px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary-text)] text-[12px] font-medium"
                      >
                        {formatDateFull(f)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Responsable</div>
                  <div>{selected.responsable}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Accesos directos</div>
                <div className="flex flex-wrap gap-2">
                  {['Examen', 'PPTX / Materiales', 'Data Storage'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      className="px-2.5 py-1.5 rounded-lg bg-[#f1f3f4] text-[12px] text-[var(--text-secondary)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary-text)] transition-colors"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
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

      {/* Modal form */}
      {formOpen && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-semibold">
                {editing ? 'Editar tema' : 'Agregar tema al programa'}
              </h2>
              <button type="button" onClick={closeForm} className="btn-icon text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tema *</span>
                <input className="input w-full" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} placeholder="Ej. Sistema HACCP" autoFocus />
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Responsable</span>
                <input className="input w-full" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Blga. Nereyda Huachua" />
              </label>
              <label className="block">
                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Fechas de sesi\u00f3n (refuerzos, separadas por coma)
                </span>
                <input
                  className="input w-full"
                  value={form.fechas}
                  onChange={(e) => setForm({ ...form, fechas: e.target.value })}
                  placeholder="2026-01-21, 2026-02-03, 2026-03-03"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                  Varias fechas = refuerzos del mismo tema a lo largo del a\u00f1o.
                </p>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn btn-ghost flex-1" onClick={closeForm}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={handleSave}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
