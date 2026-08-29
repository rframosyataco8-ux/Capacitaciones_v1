import { useState } from 'react'
import { LayoutDashboard, Network, Calendar, Users, FileCheck, Clock } from 'lucide-react'

type SubView = 'dashboard' | 'grafo'

const METRICS = [
  { label: 'Capacitaciones 2026', value: '12', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Ex\u00e1menes activos', value: '5', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Materiales', value: '48', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Pr\u00f3ximas (7 d\u00edas)', value: '3', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
]

export default function Inicio() {
  const [sub, setSub] = useState<SubView>('dashboard')

  return (
    <div className="h-full flex flex-col">
      {/* Sub-nav */}
      <div className="h-12 bg-white border-b border-[var(--border)] flex items-center px-6 gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setSub('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
            sub === 'dashboard'
              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6] hover:text-[var(--text)]'
          }`}
        >
          <LayoutDashboard size={15} strokeWidth={2} />
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setSub('grafo')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
            sub === 'grafo'
              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
              : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6] hover:text-[var(--text)]'
          }`}
        >
          <Network size={15} strokeWidth={2} />
          Grafo de conocimiento
        </button>
      </div>

      <div className="flex-1 overflow-auto p-7">
        {sub === 'dashboard' && (
          <div className="animate-in max-w-6xl">
            <div className="mb-7">
              <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Dashboard</h1>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Resumen general, calendario y pr\u00f3ximas capacitaciones
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger">
              {METRICS.map((m) => (
                <div
                  key={m.label}
                  className="surface surface-hover p-5 animate-in cursor-default"
                >
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

            <div className="surface p-6 min-h-[300px] flex flex-col items-center justify-center animate-in">
              <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-3">
                <Calendar size={22} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium">Calendario anual</p>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">Se conectar\u00e1 con el cronograma</p>
            </div>
          </div>
        )}

        {sub === 'grafo' && (
          <div className="animate-in max-w-6xl">
            <div className="mb-7">
              <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Grafo de conocimiento</h1>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Relaciones entre capacitaciones, materiales y ex\u00e1menes
              </p>
            </div>
            <div className="surface p-6 min-h-[420px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mb-3">
                <Network size={22} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] font-medium">Vista de grafo interactivo</p>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">Superior a Obsidian · Pr\u00f3ximamente</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
