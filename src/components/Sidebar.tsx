import { NavLink } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  ChevronLeft,
  GraduationCap,
  Sun,
  Moon,
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../lib/theme'

const NAV = [
  { to: '/inicio', label: 'Inicio', icon: Home },
  { to: '/cronograma', label: 'Cronograma', icon: CalendarDays },
  { to: '/examenes', label: 'Exámenes', icon: ClipboardList },
  { to: '/data-storage', label: 'Data Storage', icon: FolderOpen },
] as const

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggle } = useTheme()

  return (
    <aside
      className={`flex flex-col shrink-0 transition-all duration-300 ease-out ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      style={{
        background: 'var(--bg-sidebar)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}
    >
      <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #1a6bb0 0%, #0f4c81 100%)',
            boxShadow: '0 2px 10px rgba(21, 101, 168, 0.45)',
          }}
        >
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-white tracking-tight leading-tight truncate">
              Capacitaciones
            </div>
            <div
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'var(--accent)' }}
            >
              ROMEX · v2
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2.5 flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                        'linear-gradient(135deg, rgba(26,107,176,0.55) 0%, rgba(15,76,129,0.4) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                  />
                )}
                {isActive && !collapsed && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
                <Icon size={18} className="relative shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span className="relative truncate tracking-wide">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`px-3 py-3 border-t border-white/10 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={toggle}
          className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && (
            <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          )}
        </button>
        {!collapsed && (
          <div className="px-3 pt-2">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
              Local-first · 2026
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">Planta cacao · Chincha</div>
          </div>
        )}
      </div>
    </aside>
  )
}
