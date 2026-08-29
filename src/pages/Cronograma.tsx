import { useEffect, useState, useCallback, useMemo, Fragment } from 'react'
import {
  Plus, Eye, Pencil, Trash2, FileSpreadsheet, FileText, FileType,
  X, Search, CalendarRange, Copy, Building2, ChevronDown, ChevronRight, RefreshCw, Check, CalendarPlus,
} from 'lucide-react'
import {
  seedIfEmpty, listCapacitaciones, saveCapacitacion, deleteCapacitacion, db,
  type Capacitacion, type Session, sessionsFromDates,
} from '../lib/db'
import { exportExcel, exportPDF, exportWord } from '../lib/exportCrono'
import { exportIcs, googleCalendarUrl } from '../lib/calendar'
import { confirmar, mensajes } from '../lib/confirm'
import { useToast } from '../lib/toast'
import { fieldErrors, temaSchema } from '../lib/validate'
import CronoToolbar from '../components/CronoToolbar'
import CronogramaMonth from './CronogramaMonth'
import { useCronoFilters } from '../hooks/useCronoFilters'
import type { FilterKey, ViewMode } from '../hooks/useCronoFilters'

function getSessions(c: Capacitacion): Session[] {
  if (c.sessions?.length) return c.sessions
  return sessionsFromDates(c.fechas || [])
}

function formatDateFull(d: string) {
  const p = d.split('-')
  if (p.length !== 3) return d
  return `${p[2]}/${p[1]}/${p[0]}`
}

function formatDateShort(d: string) {
  const p = d.split('-')
  if (p.length !== 3) return d
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(p[2], 10)} ${months[parseInt(p[1], 10) - 1] || p[1]}`
}

export default function Cronograma() {
  const { toast } = useToast()
  const [year, setYear] = useState(2026)
  const [rows, setRows] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('todos')
  const [view, setView] = useState<ViewMode>('lista')
  const [selected, setSelected] = useState<Capacitacion | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Capacitacion | null>(null)
  const [yearModal, setYearModal] = useState(false)
  const [newYear, setNewYear] = useState(2027)
  const [copyFrom, setCopyFrom] = useState(2026)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [form, setForm] = useState({ tema: '', responsable: '', fechas: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const refresh = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    let data = await listCapacitaciones(year)
    const byTema = new Map<string, Capacitacion>()
    for (const r of data) {
      const key = r.tema.trim().toLowerCase()
      const existing = byTema.get(key)
      const sess = getSessions(r)
      if (!existing) {
        byTema.set(key, { ...r, sessions: sess })
      } else {
        const dates = new Set([
          ...getSessions(existing).map((s) => s.date),
          ...sess.map((s) => s.date),
        ])
        const merged = Array.from(dates).sort().map((date) => {
          const prev = [...getSessions(existing), ...sess].find((s) => s.date === date)
          return { date, status: prev?.status || ('Programada' as const) }
        })
        byTema.set(key, {
          ...existing,
          sessions: merged,
          periodoTexto: merged.length > 1 ? `${merged.length} sesiones · ${year}` : existing.periodoTexto,
        })
        if (r.id && r.id !== existing.id) await deleteCapacitacion(r.id)
      }
    }
    setRows(Array.from(byTema.values()).sort((a, b) => a.item - b.item))
    setLoading(false)
  }, [year])

  useEffect(() => { refresh() }, [refresh])

  // Usa el hook centralizado de filtros
  const { filtered, totalSesiones } = useCronoFilters(rows, search, filter)

  async function createAnnualProgram() {
    try {
      if (newYear < 2020 || newYear > 2040) {
        toast('El año debe estar entre 2020 y 2040', 'error')
        return
      }
      const existing = await listCapacitaciones(newYear)
      if (existing.length > 0) {
        if (!confirmar(mensajes.reemplazarPrograma(newYear, existing.length))) return
        await db.capacitaciones.where('year').equals(newYear).delete()
        await db.folders.where('year').equals(newYear).delete()
      }
      const source = await listCapacitaciones(copyFrom)
      const now = new Date().toISOString()
      if (source.length === 0) {
        setYear(newYear)
        setYearModal(false)
        toast(`Programa ${newYear} listo (vacío)`, 'info')
        return
      }
      const seen = new Set<string>()
      const unique = source.filter((s) => {
        const k = s.tema.trim().toLowerCase()
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      const mapped = unique.map((s, i) => {
        const sessions = getSessions(s).map((sess) => ({
          date: sess.date.replace(String(copyFrom), String(newYear)),
          status: 'Programada' as const,
        }))
        return {
          codigo: `CAP-${newYear}-${String(i + 1).padStart(3, '0')}`,
          year: newYear,
          item: i + 1,
          tema: s.tema,
          responsable: s.responsable,
          sessions,
          periodoTexto: sessions.length > 1 ? `${sessions.length} sesiones · ${newYear}` : s.periodoTexto.replace(String(copyFrom), String(newYear)),
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
      toast(`Programa ${newYear} creado (${mapped.length} temas)`, 'success')
    } catch {
      toast('No se pudo crear el programa', 'error')
    }
  }

  function openEdit(row: Capacitacion) {
    setEditing(row)
    setForm({
      tema: row.tema,
      responsable: row.responsable,
      fechas: getSessions(row).map((s) => s.date).join(', '),
    })
    setFormErrors({})
    setSelected(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm({ tema: '', responsable: '', fechas: '' })
    setFormErrors({})
  }

  async function handleSave() {
    const result = fieldErrors(temaSchema, form)
    if (!result.ok) {
      setFormErrors(result.errors)
      toast(Object.values(result.errors)[0] || 'Revise el formulario', 'error')
      return
    }
    setFormErrors({})
    try {
      const fechas = (result.data.fechas || '')
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
      const prev = editing ? getSessions(editing) : []
      const sessions = fechas.map((date) => {
        const old = prev.find((s) => s.date === date)
        return { date, status: old?.status || ('Programada' as const) }
      })
      const nextItem = editing ? editing.item : rows.length ? Math.max(...rows.map((r) => r.item)) + 1 : 1
      const codigo = editing?.codigo ?? `CAP-${year}-${String(nextItem).padStart(3, '0')}`
      await saveCapacitacion({
        id: editing?.id,
        codigo,
        year,
        item: nextItem,
        tema: result.data.tema,
        responsable: result.data.responsable,
        sessions,
        periodoTexto: sessions.length > 1 ? `${sessions.length} sesiones · ${year}` : formatDateFull(fechas[0] || ''),
        estado: editing?.estado ?? 'Programada',
        createdAt: editing?.createdAt,
      })
      closeForm()
      await refresh()
      toast(editing ? 'Tema actualizado' : 'Tema agregado al programa', 'success')
    } catch {
      toast('Error al guardar', 'error')
    }
  }

  async function handleDelete(id: number) {
    if (!confirmar(mensajes.eliminarTema)) return
    try {
      await deleteCapacitacion(id)
      setSelected(null)
      await refresh()
      toast('Tema eliminado', 'success')
    } catch {
      toast('No se pudo eliminar', 'error')
    }
  }

  async function toggleSessionStatus(row: Capacitacion, date: string) {
    const sessions = getSessions(row).map((s) =>
      s.date === date
        ? { ...s, status: (s.status === 'Realizada' ? 'Programada' : 'Realizada') as Session['status'] }
        : s
    )
    const next = sessions.find((s) => s.date === date)
    await saveCapacitacion({ ...row, sessions, id: row.id })
    await refresh()
    if (selected?.id === row.id) {
      const updated = (await listCapacitaciones(year)).find((c) => c.id === row.id)
      if (updated) setSelected(updated)
    }
    toast(
      next?.status === 'Realizada' ? 'Sesión marcada como realizada' : 'Sesión marcada como programada',
      'success'
    )
  }

  function doExport(kind: 'excel' | 'word' | 'pdf' | 'ics') {
    try {
      if (kind === 'excel') exportExcel(filtered, year)
      else if (kind === 'word') exportWord(filtered, year)
      else if (kind === 'pdf') exportPDF(filtered, year)
      else exportIcs(filtered, year)
      toast(kind === 'ics' ? 'Calendario .ics descargado (impórtalo en Google Calendar)' : `Exportación ${kind.toUpperCase()} lista`, 'success')
    } catch {
      toast('Error al exportar', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="page-header shrink-0">
        <div className="px-7 pt-5 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(15,76,129,0.3)' }}>
                <Building2 size={20} className="text-white" strokeWidth={1.8} />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'var(--primary-text)' }}>EXPORTADORA ROMEX S.A.</div>
                <h1 className="text-[20px] font-semibold tracking-tight leading-tight">Programa Anual de Formación {year}</h1>
                <p className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>Planta de cacao · Chincha · Código HACCP 004</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={year} onChange={(e) => setYear(+e.target.value)} className="input w-[96px] font-medium" aria-label="Seleccionar año">
                {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary" onClick={() => { setNewYear(year + 1); setCopyFrom(year); setYearModal(true) }}>
                <CalendarRange size={15} /> Nuevo programa anual
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input w-full pl-9"
                placeholder="Buscar tema o responsable…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar temas"
              />
            </div>
            <div className="flex-1" />
            <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm({ tema: '', responsable: '', fechas: '' }); setFormErrors({}); setFormOpen(true) }}>
              <Plus size={14} /> Agregar tema
            </button>
            <div className="h-5 w-px" style={{ background: 'var(--border)' }} />
            <button type="button" className="btn btn-ghost" onClick={() => doExport('excel')} title="Exportar Excel" aria-label="Exportar Excel"><FileSpreadsheet size={14} /> Excel</button>
            <button type="button" className="btn btn-ghost" onClick={() => doExport('word')} title="Exportar Word" aria-label="Exportar Word"><FileText size={14} /> Word</button>
            <button type="button" className="btn btn-ghost" onClick={() => doExport('pdf')} title="Exportar PDF" aria-label="Exportar PDF"><FileType size={14} /> PDF</button>
            <button type="button" className="btn btn-ghost" onClick={() => doExport('ics')} title="Google Calendar / Outlook (.ics)" aria-label="Exportar calendario ICS">
              <CalendarPlus size={14} /> Calendario
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando programa {year}…</div>
        ) : rows.length === 0 ? (
          <div className="table-wrap p-16 text-center">
            <CalendarRange size={24} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[15px] font-medium mb-1">No hay programa para {year}</p>
            <button type="button" className="btn btn-primary mt-4" onClick={() => { setNewYear(year); setCopyFrom(2026); setYearModal(true) }}>Crear programa {year}</button>
          </div>
        ) : (
          <>
            {/* Toolbar con filtros y vista — ahora activo */}
            <CronoToolbar filter={filter} setFilter={setFilter} view={view} setView={setView} />

            {view === 'meses' ? (
              <CronogramaMonth rows={filtered} year={year} onSelect={setSelected} />
            ) : (
              <div className="table-wrap">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="th-row text-left">
                      <th className="px-3 py-3 w-8" />
                      <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider w-[28px]" style={{ color: 'var(--text-muted)' }}>#</th>
                      <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider w-[100px]" style={{ color: 'var(--text-muted)' }}>ID</th>
                      <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tema</th>
                      <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider w-[160px]" style={{ color: 'var(--text-muted)' }}>Sesiones</th>
                      <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider w-[150px]" style={{ color: 'var(--text-muted)' }}>Responsable</th>
                      <th className="px-3 py-3 font-semibold text-[11px] uppercase tracking-wider w-[100px] text-right" style={{ color: 'var(--text-muted)' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const id = row.id ?? row.item
                      const sess = getSessions(row)
                      const n = sess.length
                      const hasMulti = n > 1
                      const done = sess.filter((s) => s.status === 'Realizada').length
                      const isOpen = expanded[id]
                      return (
                        <Fragment key={row.id ?? row.codigo}>
                          <tr className="border-b tr-hover group" style={{ borderColor: 'var(--border)' }}>
                            <td className="px-2 py-3">
                              {hasMulti ? (
                                <button
                                  type="button"
                                  onClick={() => setExpanded((p) => ({ ...p, [id]: !p[id] }))}
                                  className="btn-icon"
                                  style={{ color: 'var(--text-muted)' }}
                                  aria-label={isOpen ? 'Colapsar sesiones' : 'Expandir sesiones'}
                                >
                                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                              ) : <span className="w-8 inline-block" />}
                            </td>
                            <td className="px-3 py-3" style={{ color: 'var(--text-muted)' }}>{row.item}</td>
                            <td className="px-3 py-3 font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>{row.codigo}</td>
                            <td className="px-3 py-3">
                              <div className="font-medium leading-snug">{row.tema}</div>
                              {hasMulti && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <RefreshCw size={11} style={{ color: 'var(--primary)' }} />
                                  <span className="text-[11px] font-medium" style={{ color: 'var(--primary-text)' }}>Refuerzo · {done}/{n} realizadas</span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {hasMulti ? (
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}>{n} sesiones</span>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)' }}>{sess[0] ? formatDateShort(sess[0].date) : '—'}</span>
                              )}
                            </td>
                            <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{row.responsable}</td>
                            <td className="px-3 py-3">
                              <div className="flex justify-end gap-0.5 opacity-50 group-hover:opacity-100">
                                <button type="button" title="Ver detalle" aria-label="Ver detalle" onClick={() => setSelected(row)} className="btn-icon" style={{ color: 'var(--primary)' }}><Eye size={15} /></button>
                                <button type="button" title="Editar" aria-label="Editar tema" onClick={() => openEdit(row)} className="btn-icon"><Pencil size={15} /></button>
                                <button type="button" title="Eliminar" aria-label="Eliminar tema" onClick={() => row.id && handleDelete(row.id)} className="btn-icon" style={{ color: 'var(--danger)' }}><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                          {hasMulti && isOpen && (
                            <tr style={{ background: 'var(--surface-2)' }}>
                              <td colSpan={7} className="px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                                <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Sesiones (clic = realizada · icono calendario = Google)</div>
                                <div className="flex flex-wrap gap-2">
                                  {sess.map((s, i) => (
                                    <div key={s.date + i} className="inline-flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => toggleSessionStatus(row, s.date)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px]"
                                        aria-label={`Marcar sesión del ${formatDateFull(s.date)} como ${s.status === 'Realizada' ? 'programada' : 'realizada'}`}
                                        style={{
                                          background: s.status === 'Realizada' ? 'var(--success-soft)' : 'var(--surface)',
                                          borderColor: s.status === 'Realizada' ? 'transparent' : 'var(--border)',
                                          color: s.status === 'Realizada' ? 'var(--success)' : 'var(--text)',
                                        }}
                                      >
                                        {s.status === 'Realizada' ? <Check size={12} /> : <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}>{i + 1}</span>}
                                        {formatDateFull(s.date)}
                                      </button>
                                      <a
                                        href={googleCalendarUrl({
                                          title: `[ROMEX] ${row.tema}`,
                                          date: s.date,
                                          details: `Responsable: ${row.responsable}\nCódigo: ${row.codigo}`,
                                        })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-icon"
                                        title="Añadir a Google Calendar"
                                        aria-label="Añadir a Google Calendar"
                                        style={{ color: 'var(--primary)' }}
                                      >
                                        <CalendarPlus size={14} />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {rows.length > 0 && (
              <div className="mt-3 flex justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <span>{filtered.length} temas · {totalSesiones} sesiones · {year}</span>
                <span>Documento controlado · Aseguramiento de Calidad</span>
              </div>
            )}
          </>
        )}
      </div>

      {yearModal && (
        <div className="modal-backdrop" onClick={() => setYearModal(false)} role="dialog" aria-modal="true" aria-labelledby="modal-nuevo-programa-titulo">
          <div className="modal-panel max-w-[420px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 id="modal-nuevo-programa-titulo" className="text-[15px] font-semibold">Nuevo programa anual</h2>
              <button type="button" onClick={() => setYearModal(false)} className="btn-icon" aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Copia temas y sesiones de refuerzo a un año nuevo.</p>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Año nuevo</span>
                <input type="number" className="input w-full" value={newYear} onChange={(e) => setNewYear(+e.target.value)} min={2020} max={2040} />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Copiar desde</span>
                <select className="input w-full" value={copyFrom} onChange={(e) => setCopyFrom(+e.target.value)}>
                  {[2023, 2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setYearModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={createAnnualProgram}><Copy size={14} /> Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)} role="dialog" aria-modal="true" aria-labelledby="modal-detalle-titulo">
          <div className="modal-panel max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 id="modal-detalle-titulo" className="text-[15px] font-semibold">Detalle</h2>
              <button type="button" onClick={() => setSelected(null)} className="btn-icon" aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-3 text-[13px]">
              <div><span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ID</span><div className="font-mono">{selected.codigo}</div></div>
              <div><span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tema</span><div className="font-medium">{selected.tema}</div></div>
              <div><span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Responsable</span><div>{selected.responsable}</div></div>
              <div>
                <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sesiones</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {getSessions(selected).map((s, i) => (
                    <div key={s.date + i} className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => toggleSessionStatus(selected, s.date)}
                        className="px-2 py-0.5 rounded-md text-[12px] font-medium"
                        aria-label={`${formatDateFull(s.date)} — ${s.status}`}
                        style={{
                          background: s.status === 'Realizada' ? 'var(--success-soft)' : 'var(--primary-soft)',
                          color: s.status === 'Realizada' ? 'var(--success)' : 'var(--primary-text)',
                        }}
                      >{formatDateFull(s.date)}{s.status === 'Realizada' ? ' ✓' : ''}</button>
                      <a
                        href={googleCalendarUrl({ title: `[ROMEX] ${selected.tema}`, date: s.date, details: `Responsable: ${selected.responsable}` })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon"
                        title="Google Calendar"
                        aria-label="Añadir a Google Calendar"
                        style={{ color: 'var(--primary)', width: 28, height: 28 }}
                      ><CalendarPlus size={13} /></a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => openEdit(selected)}>Editar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={closeForm} role="dialog" aria-modal="true" aria-labelledby="modal-form-titulo">
          <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 id="modal-form-titulo" className="text-[15px] font-semibold">{editing ? 'Editar tema' : 'Agregar tema'}</h2>
              <button type="button" onClick={closeForm} className="btn-icon" aria-label="Cerrar"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Tema *</span>
                <input className="input w-full" value={form.tema} onChange={(e) => setForm({ ...form, tema: e.target.value })} autoFocus style={formErrors.tema ? { borderColor: 'var(--danger)' } : undefined} />
                {formErrors.tema && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{formErrors.tema}</p>}
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Responsable *</span>
                <input className="input w-full" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} style={formErrors.responsable ? { borderColor: 'var(--danger)' } : undefined} />
                {formErrors.responsable && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{formErrors.responsable}</p>}
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Fechas de refuerzo (coma)</span>
                <input className="input w-full" value={form.fechas} onChange={(e) => setForm({ ...form, fechas: e.target.value })} placeholder="2026-01-21, 2026-02-03" style={formErrors.fechas ? { borderColor: 'var(--danger)' } : undefined} />
                {formErrors.fechas && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{formErrors.fechas}</p>}
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Formato: AAAA-MM-DD o DD/MM/AAAA</p>
              </label>
              <div className="flex gap-2">
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
