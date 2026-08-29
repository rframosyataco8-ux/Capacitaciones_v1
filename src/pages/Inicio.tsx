import { useEffect, useState } from 'react'
import { LayoutDashboard, Network, Calendar, FileCheck, FolderOpen, Clock } from 'lucide-react'
import { seedIfEmpty, getStats } from '../lib/db'

type SubView = 'dashboard' | 'grafo'

export default function Inicio() {
  const [sub, setSub] = useState<SubView>('dashboard')
  const [year] = useState(2026)
  const [stats, setStats] = useState({
    temas: 0,
    sessions: 0,
    realizadas: 0,
    pendientes: 0,
    exams: 0,
    files: 0,
    proximas: 0,
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedIfEmpty()
      .then(() => getStats(year))
      .then(setStats)
      .finally(() => setReady(true))
  }, [year])

  const cards = [
    { label: 'Temas del programa', value: stats.temas, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sesiones totales', value: stats.sessions, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Realizadas', value: stats.realizadas, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pr\u00f3ximas (7 d\u00edas)', value: stats.proximas, icon: FolderOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 bg-white border-b border-[var(--border)] flex items-center px-6 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setSub('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            sub === 'dashboard'
              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6]'
          }`}
        >
          <LayoutDashboard size={15} />
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setSub('grafo')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            sub === 'grafo'
              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6]'
          }`}
        >
          <Network size={15} />
          Grafo de conocimiento
        </button>
      </div>

      <div className="flex-1 overflow-auto p-7">
        {sub === 'dashboard' && (
          <div className="animate-in max-w-6xl">
            <div className="mb-7">
              <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Dashboard</h1>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                EXPORTADORA ROMEX S.A. \u00b7 Programa {year}
              </p>
            </div>

            {!ready ? (
              <p className="text-sm text-[var(--text-muted)]">Cargando m\u00e9tricas\u2026</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                  {cards.map((m) => (
                    <div key={m.label} className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                            {m.label}
                          </div>
                          <div className="text-[28px] font-semibold text-[var(--text)] mt-1.5 tracking-tight">
                            {m.value}
                          </div>
                        </div>
                        <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}>
                          <m.icon size={16} className={m.color} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
                    <h2 className="text-[14px] font-semibold mb-3">Avance de sesiones</h2>
                    <div className="h-3 rounded-full bg-[#f1f3f4] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all"
                        style={{
                          width: `${stats.sessions ? Math.round((stats.realizadas / stats.sessions) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-2">
                      {stats.realizadas} de {stats.sessions} realizadas
                      {stats.sessions > 0
                        ? ` (${Math.round((stats.realizadas / stats.sessions) * 100)}%)`
                        : ''}
                    </p>
                  </div>
                  <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
                    <h2 className="text-[14px] font-semibold mb-3">Resumen</h2>
                    <ul className="text-[13px] text-[var(--text-secondary)] space-y-1.5">
                      <li>Ex\u00e1menes: {stats.exams}</li>
                      <li>Archivos en Data Storage: {stats.files}</li>
                      <li>Sesiones pendientes: {stats.pendientes}</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {sub === 'grafo' && (
          <div className="animate-in max-w-6xl">
            <div className="mb-7">
              <h1 className="text-[22px] font-semibold tracking-tight">Grafo de conocimiento</h1>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Relaciones entre temas, materiales y ex\u00e1menes
              </p>
            </div>
            <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] p-12 min-h-[360px] flex flex-col items-center justify-center text-center">
              <Network size={32} className="text-[var(--text-muted)] mb-3" />
              <p className="text-[14px] font-medium text-[var(--text)]">Vista de grafo</p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1 max-w-sm">
                Se conectar\u00e1 a los temas del cronograma, carpetas y ex\u00e1menes en una siguiente iteraci\u00f3n.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
