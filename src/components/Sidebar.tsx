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
  { to: '/inicio', label: 'INICIO', icon: Home },
  { to: '/cronograma', label: 'CRONOGRAMA', icon: CalendarDays },
  { to: '/examenes', label: 'EXAMENES', icon: ClipboardList },
  { to: '/data-storage', label: 'DATA STORAGE', icon: FolderOpen },
] as const

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`bg-white border-r border-[var(--border)] flex flex-col shrink-0 transition-all duration-300 ease-out ${
        collapsed ? 'w-[68px]' : 'w-[232px]'
      }`}
      style={{ boxShadow: '1px 0 0 0 rgba(0,0,0,0.02)' }}
    >
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-3.5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0 shadow-sm">
          <GraduationCap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-in" style={{ animation: 'slideInLeft 0.25s ease-out' }}>
            <div className="text-[13px] font-semibold text-[var(--text)] tracking-tight leading-tight">
              Capacitaciones
            </div>
            <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide uppercase">
              Sistema v2
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="btn-icon ml-auto text-[var(--text-secondary)] hover:text-[var(--text)]"
          title={collapsed ? 'Expandir men\u00fa' : 'Colapsar men\u00fa'}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon }, i) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-[13px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--primary-soft)] text-[var(--primary-text)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6] hover:text-[var(--text)]'
              } ${
                collapsed ? 'justify-center px-0' : ''
              }`
            }
            style={{ animationDelay: `${i * 0.04}s` }}
            title={label}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--primary)]" />
                )}
                <Icon
                  size={18}
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? 'text-[var(--primary)]' : ''
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {!collapsed && (
                  <span className="truncate tracking-wide">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3.5 border-t border-[var(--border)]">
          <div className="text-[10px] text-[var(--text-muted)] font-medium tracking-wider uppercase">
            Local-first · 2026
          </div>
        </div>
      )}
    </aside>
  )
}
