import { useState } from 'react'
import { LayoutDashboard, Network } from 'lucide-react'

type SubView = 'dashboard' | 'grafo'

export default function Inicio() {
  const [sub, setSub] = useState<SubView>('dashboard')

  return (
    <div className="h-full flex flex-col">
      {/* Sub-nav */}
      <div className="h-12 bg-white border-b border-[#e8eaed] flex items-center px-6 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setSub('dashboard')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            sub === 'dashboard'
              ? 'bg-[#e8f0fe] text-[#1967d2]'
              : 'text-[#5f6368] hover:bg-[#f1f3f4]'
          }`}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => setSub('grafo')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            sub === 'grafo'
              ? 'bg-[#e8f0fe] text-[#1967d2]'
              : 'text-[#5f6368] hover:bg-[#f1f3f4]'
          }`}
        >
          <Network size={16} />
          Grafo de conocimiento
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {sub === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-normal text-[#202124] mb-1">Dashboard</h1>
            <p className="text-sm text-[#5f6368] mb-8">
              Resumen general, calendario y próximas capacitaciones
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Capacitaciones 2026', value: '—' },
                { label: 'Exámenes activos', value: '—' },
                { label: 'Materiales', value: '—' },
                { label: 'Próximas (7 días)', value: '—' },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-5"
                >
                  <div className="text-xs text-[#80868b] uppercase tracking-wide">{c.label}</div>
                  <div className="text-3xl font-medium mt-1 text-[#202124]">{c.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-6 min-h-[320px] flex items-center justify-center text-[#80868b] text-sm">
              Calendario (se implementará a continuación)
            </div>
          </div>
        )}

        {sub === 'grafo' && (
          <div>
            <h1 className="text-2xl font-normal text-[#202124] mb-1">Grafo de conocimiento</h1>
            <p className="text-sm text-[#5f6368] mb-8">
              Vista de relaciones entre capacitaciones, materiales y exámenes (superior a Obsidian)
            </p>
            <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-6 min-h-[480px] flex items-center justify-center text-[#80868b] text-sm">
              Grafo interactivo (se implementará a continuación)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
