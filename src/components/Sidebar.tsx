import { NavLink } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  ChevronLeft,
  GraduationCap,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to: '/inicio', label: 'Inicio', icon: Home, desc: 'Panel y grafo' },
  { to: '/cronograma', label: 'Cronograma', icon: CalendarDays, desc: 'Programa anual' },
  { to: '/examenes', label: 'Exámenes', icon: ClipboardList, desc: 'Forms & evaluaciones' },
  { to: '/data-storage', label: 'Data Storage', icon: FolderOpen, desc: 'Materiales' },
] as const

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`flex flex-col shrink-0 transition-all duration-300 ease-out ${
        collapsed ? 'w-[72px]' : 'w-[232px]'
      }`}
      style={{
        background: 'var(--bg-sidebar)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.2)',
      }}
    >
      <div className="h-14 flex items-center gap-3 px-3.5 border-b border-white/8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(145deg, #1a6bb0 0%, #0f4c81 55%, #0a3558 100%)',
            boxShadow: '0 2px 12px rgba(15, 76, 129, 0.5)',
          }}
        >
          <GraduationCap size={18} className="text-white" strokeWidth={2} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-white tracking-tight leading-tight truncate">
              Capacitaciones
            </div>
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: 'var(--accent)' }}>
              ROMEX · Calidad
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className="flex-1 py-3.5 px-2.5 flex flex-col gap-0.5">
        {!collapsed && (
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Módulos
          </div>
        )}
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(26,107,176,0.5) 0%, rgba(15,76,129,0.35) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  />
                )}
                {isActive && !collapsed && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
                <Icon size={18} className="relative shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                {!collapsed && <span className="relative truncate tracking-wide">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3.5 border-t border-white/8">
          <div className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
            Local-first · 2026
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
            Planta de cacao · Chincha
          </div>
        </div>
      )}
    </aside>
  )
}
