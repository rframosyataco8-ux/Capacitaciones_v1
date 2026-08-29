import { List, CalendarDays } from 'lucide-react'
import type { FilterKey, ViewMode } from '../hooks/useCronoFilters'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'refuerzos', label: 'Con refuerzos' },
  { key: 'pendientes', label: 'Pendientes' },
  { key: 'completados', label: 'Completados' },
]

export default function CronoToolbar({
  filter,
  setFilter,
  view,
  setView,
}: {
  filter: FilterKey
  setFilter: (f: FilterKey) => void
  view: ViewMode
  setView: (v: ViewMode) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{
              background: filter === f.key ? 'var(--primary-soft)' : 'transparent',
              color: filter === f.key ? 'var(--primary-text)' : 'var(--text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setView('lista')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
          style={{
            background: view === 'lista' ? 'var(--primary-soft)' : 'transparent',
            color: view === 'lista' ? 'var(--primary-text)' : 'var(--text-secondary)',
          }}
        >
          <List size={14} /> Lista
        </button>
        <button
          type="button"
          onClick={() => setView('meses')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
          style={{
            background: view === 'meses' ? 'var(--primary-soft)' : 'transparent',
            color: view === 'meses' ? 'var(--primary-text)' : 'var(--text-secondary)',
          }}
        >
          <CalendarDays size={14} /> Por meses
        </button>
      </div>
    </div>
  )
}
