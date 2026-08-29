import { NavLink } from 'react-router-dom'
import {
  Home,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  ChevronLeft,
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
      className={`bg-white border-r border-[#e8eaed] flex flex-col shrink-0 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-[220px]'
      }`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-[#e8eaed]">
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide text-[#1a73e8] px-1">
            CAPACITACIONES
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4] transition-colors"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#e8f0fe] text-[#1967d2]'
                  : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]'
              } ${
                collapsed ? 'justify-center px-0' : ''
              }`
            }
            title={label}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-[#e8eaed] text-[11px] text-[#80868b]">
          v2.0 · Local-first
        </div>
      )}
    </aside>
  )
}
