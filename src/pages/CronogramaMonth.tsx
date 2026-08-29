import type { Capacitacion, Session } from '../lib/db'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function sessionsOf(c: Capacitacion): Session[] {
  if (c.sessions?.length) return c.sessions
  return (c.fechas || []).map((d) => ({ date: d, status: 'Programada' as const }))
}

export default function CronogramaMonth({
  rows,
  year,
  onSelect,
}: {
  rows: Capacitacion[]
  year: number
  onSelect: (c: Capacitacion) => void
}) {
  const byMonth: { tema: Capacitacion; session: Session }[][] = Array.from({ length: 12 }, () => [])

  for (const r of rows) {
    for (const s of sessionsOf(r)) {
      const m = parseInt(s.date.split('-')[1], 10) - 1
      if (m >= 0 && m < 12 && s.date.startsWith(String(year))) {
        byMonth[m].push({ tema: r, session: s })
      }
    }
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-in">
      {MONTHS.map((name, mi) => {
        const items = byMonth[mi].sort((a, b) => a.session.date.localeCompare(b.session.date))
        return (
          <div key={name} className="card overflow-hidden flex flex-col min-h-[140px]">
            <div
              className="px-3 py-2 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border)', background: 'var(--table-head)' }}
            >
              <span className="text-[13px] font-semibold">{name}</span>
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
              >
                {items.length}
              </span>
            </div>
            <div className="p-2 flex-1 space-y-1 overflow-y-auto max-h-[200px]">
              {items.length === 0 ? (
                <p className="text-[11px] px-1 py-2" style={{ color: 'var(--text-muted)' }}>Sin sesiones</p>
              ) : (
                items.map(({ tema, session }, idx) => (
                  <button
                    key={tema.id + session.date + idx}
                    type="button"
                    onClick={() => onSelect(tema)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors"
                    style={{
                      background: session.status === 'Realizada' ? 'var(--success-soft)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (session.status !== 'Realizada') e.currentTarget.style.background = 'var(--row-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        session.status === 'Realizada' ? 'var(--success-soft)' : 'transparent'
                    }}
                  >
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--primary-text)' }}>
                      {session.date.slice(8)}
                    </span>{' '}
                    <span className="line-clamp-1" style={{ color: 'var(--text)' }}>
                      {tema.tema}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
