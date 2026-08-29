import { useState, useRef, useEffect } from 'react'
import {
  Grid, Search, Bell, Settings, HelpCircle, Moon, Sun,
  FileSpreadsheet, Presentation, FileText, ClipboardList, FolderOpen,
  Calendar, Check, Sparkles, X, ShieldCheck, ChevronDown
} from 'lucide-react'
import { useTheme } from '../lib/theme'
import { Link, useNavigate } from 'react-router-dom'

export default function M365Header() {
  const { theme, toggle } = useTheme()
  const [waffleOpen, setWaffleOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchScope, setSearchScope] = useState('Mis archivos')
  const [searchFocused, setSearchFocused] = useState(false)
  const waffleRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (waffleRef.current && !waffleRef.current.contains(e.target as Node)) {
        setWaffleOpen(false)
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const APPS = [
    { name: 'OneDrive Storage', desc: 'Archivos y evidencias', icon: FolderOpen, color: '#0078d4', to: '/data-storage' },
    { name: 'Microsoft Forms', desc: 'Evaluaciones y encuestas', icon: ClipboardList, color: '#008272', to: '/examenes' },
    { name: 'Cronograma HACCP', desc: 'Programa anual de calidad', icon: Calendar, color: '#0f4c81', to: '/cronograma' },
    { name: 'Dashboard Calidad', desc: 'Métricas de inocuidad', icon: ShieldCheck, color: '#c4a35a', to: '/inicio' },
  ]

  return (
    <header className="h-12 bg-[#000000] text-white flex items-center justify-between px-3 shrink-0 z-40 relative select-none border-b border-white/10">
      {/* Izquierda: Waffle + Logo Oficial RomEx OneDrive */}
      <div className="flex items-center gap-3">
        {/* Waffle App Launcher */}
        <div className="relative" ref={waffleRef}>
          <button
            type="button"
            onClick={() => setWaffleOpen(!waffleOpen)}
            className={`w-9 h-9 rounded-md flex items-center justify-center hover:bg-white/15 transition-colors ${
              waffleOpen ? 'bg-white/20' : ''
            }`}
            title="Iniciador de aplicaciones Microsoft 365"
            aria-label="Iniciador de aplicaciones"
          >
            <Grid size={18} />
          </button>

          {/* Menú Waffle flotante */}
          {waffleOpen && (
            <div className="absolute top-11 left-0 w-80 bg-white dark:bg-[#1a2536] text-slate-800 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Aplicaciones ROMEX 365
                </span>
                <span className="text-[10px] font-bold bg-[#0078d4]/10 text-[#0078d4] px-2 py-0.5 rounded-full">
                  Planta Chincha
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {APPS.map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => {
                      setWaffleOpen(false)
                      navigate(app.to)
                    }}
                    className="flex flex-col items-start p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-1.5 shadow-sm group-hover:scale-105 transition-transform"
                      style={{ background: app.color }}
                    >
                      <app.icon size={16} />
                    </div>
                    <span className="font-bold text-[12px] text-slate-800 dark:text-slate-200 leading-tight group-hover:text-[#0078d4]">
                      {app.name}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                      {app.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Logo RomEx OneDrive (Idéntico a la imagen) */}
        <Link to="/inicio" className="flex items-center gap-2 text-white no-underline">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[15px] tracking-tight flex items-center gap-1 text-[#22c55e]">
              🌱 <span className="text-white">RomEx</span>
            </span>
            <span className="font-semibold text-[14px] text-slate-200 pl-1 border-l border-white/20">
              OneDrive
            </span>
          </div>
        </Link>
      </div>

      {/* Centro: Barra de Búsqueda de Píldora estilo SharePoint (Idéntico a la imagen) */}
      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div
          className={`flex items-center bg-white text-slate-900 rounded-full px-3 py-1 shadow-sm transition-all text-xs border border-transparent ${
            searchFocused ? 'ring-2 ring-[#0078d4]' : 'hover:bg-slate-50'
          }`}
        >
          <Search size={14} className="text-slate-500 mr-2 shrink-0" />
          <input
            className="bg-transparent border-0 focus:outline-none w-full text-xs text-slate-800 placeholder:text-slate-400"
            placeholder="Buscar en archivos de RomEx…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {/* Scope Dropdown */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 text-[11px] text-slate-600 font-medium whitespace-nowrap">
            <span>{searchScope}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Derecha: Notificaciones, Ayuda y Avatar de Usuario NF (Idéntico a la imagen) */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors text-white"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <button
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors text-white/80"
          title="Configuración"
        >
          <Settings size={15} />
        </button>

        <button
          type="button"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 transition-colors text-white/80"
          title="Ayuda"
        >
          <HelpCircle size={15} />
        </button>

        {/* Avatar Oficial "NF" (Nereyda Flores / Huachua) */}
        <div className="relative ml-1" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-white/40 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#0078d4] text-white font-bold text-xs flex items-center justify-center shadow-xs border border-white/30">
              NF
            </div>
          </button>

          {/* Menú de Usuario */}
          {userMenuOpen && (
            <div className="absolute top-11 right-0 w-72 bg-white dark:bg-[#1a2536] text-slate-800 dark:text-slate-200 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#0078d4] text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                  NF
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 truncate">Nereyda Huachua Flores</div>
                  <div className="text-[11px] text-slate-500 truncate">nhuachua_romex_com_pe</div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                  🏢 <strong>Organización:</strong> EXPORTADORA ROMEX S.A.<br />
                  📍 <strong>Planta:</strong> Planta de Cacao · Chincha<br />
                  📋 <strong>Rol:</strong> Jefatura de Calidad e Inocuidad
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
