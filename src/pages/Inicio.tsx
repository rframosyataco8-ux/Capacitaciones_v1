import { useEffect, useState } from 'react'
import { LayoutDashboard, Network, Calendar, FileCheck, FolderOpen, Clock } from 'lucide-react'
import { seedIfEmpty, getStats } from '../lib/db'

type SubView = 'dashboard' | 'grafo'

export default function Inicio() {
  const [sub, setSub] = useState<SubView>('dashboard')
  const [year] = useState(2026)
  const [stats, setStats] = useState({
    temas: 0, sessions: 0, realizadas: 0, pendientes: 0, exams: 0, files: 0, proximas: 0,
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedIfEmpty().then(() => getStats(year)).then(setStats).finally(() => setReady(true))
  }, [year])

  const cards = [
    { label: 'Temas del programa', value: stats.temas, icon: Calendar },
    { label: 'Sesiones totales', value: stats.sessions, icon: Clock },
    { label: 'Realizadas', value: stats.realizadas, icon: FileCheck },
    { label: 'Próximas (7 días)', value: stats.proximas, icon: FolderOpen },
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="h-12 page-header flex items-center px-6 gap-1.5 shrink-0">
        {(['dashboard', 'grafo'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setSub(v)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              sub === v
                ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {v === 'dashboard' ? <LayoutDashboard size={15} /> : <Network size={15} />}
            {v === 'dashboard' ? 'Dashboard' : 'Grafo de conocimiento'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-7">
        {sub === 'dashboard' && (
          <div className="animate-in max-w-6xl">
            <div className="mb-7">
              <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                EXPORTADORA ROMEX S.A. · Programa {year}
              </p>
            </div>

            {!ready ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando métricas…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                  {cards.map((m) => (
                    <div key={m.label} className="card p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            {m.label}
                          </div>
                          <div className="text-[28px] font-semibold mt-1.5 tracking-tight" style={{ color: 'var(--text)' }}>
                            {m.value}
                          </div>
                        </div>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
                        >
                          <m.icon size={18} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card p-5">
                    <h2 className="text-[14px] font-semibold mb-3">Avance de sesiones</h2>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          background: 'var(--primary)',
                          width: `${stats.sessions ? Math.round((stats.realizadas / stats.sessions) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-[12px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {stats.realizadas} de {stats.sessions} realizadas
                      {stats.sessions > 0 ? ` (${Math.round((stats.realizadas / stats.sessions) * 100)}%)` : ''}
                    </p>
                  </div>
                  <div className="card p-5">
                    <h2 className="text-[14px] font-semibold mb-3">Resumen</h2>
                    <ul className="text-[13px] space-y-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <li>Exámenes: {stats.exams}</li>
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
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                Relaciones entre temas, materiales y exámenes
              </p>
            </div>
            <div className="card p-12 min-h-[360px] flex flex-col items-center justify-center text-center">
              <Network size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
              <p className="text-[14px] font-medium">Vista de grafo</p>
              <p className="text-[13px] mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                Se conectará a los temas del cronograma, carpetas y exámenes en una siguiente iteración.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
