import { useState, useRef, useEffect } from 'react'
import {
  Grid, Search, Settings, HelpCircle, Moon, Sun,
  ClipboardList, FolderOpen, Calendar, ShieldCheck, ChevronDown,
} from 'lucide-react'
import { useTheme } from '../lib/theme'
import { Link, useNavigate } from 'react-router-dom'

export default function M365Header() {
  const { theme, toggle } = useTheme()
  const [waffleOpen, setWaffleOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const waffleRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (waffleRef.current && !waffleRef.current.contains(e.target as Node)) setWaffleOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    navigate(`/data-storage?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
  }

  const APPS = [
    { name: 'Data Storage', desc: 'Archivos y evidencias', icon: FolderOpen, color: '#0078d4', to: '/data-storage' },
    { name: 'Exámenes Forms', desc: 'Evaluaciones', icon: ClipboardList, color: '#008272', to: '/examenes' },
    { name: 'Cronograma', desc: 'Programa anual', icon: Calendar, color: '#0f4c81', to: '/cronograma' },
    { name: 'Dashboard', desc: 'Métricas calidad', icon: ShieldCheck, color: '#c4a35a', to: '/inicio' },
  ]

  return (
    <header
      className="h-12 flex items-center justify-between px-3 shrink-0 z-40 relative select-none"
      style={{
        background: 'linear-gradient(90deg, #0a0a0a 0%, #121212 50%, #0a0a0a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        color: '#fff',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative" ref={waffleRef}>
          <button
            type="button"
            onClick={() => setWaffleOpen(!waffleOpen)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/12 transition-colors ${
              waffleOpen ? 'bg-white/15' : ''
            }`}
            title="Aplicaciones ROMEX"
          >
            <Grid size={17} />
          </button>

          {waffleOpen && (
            <div
              className="absolute top-11 left-0 w-[320px] rounded-2xl shadow-2xl p-4 z-50 animate-scale"
              style={{
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <span className="font-bold text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Aplicaciones ROMEX
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}>
                  Chincha
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {APPS.map((app) => (
                  <button
                    key={app.name}
                    type="button"
                    onClick={() => { setWaffleOpen(false); navigate(app.to) }}
                    className="flex flex-col items-start p-2.5 rounded-xl text-left transition-all"
                    style={{ border: '1px solid transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--row-hover)'
                      e.currentTarget.style.borderColor = 'var(--border)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white mb-1.5 shadow-sm"
                      style={{ background: app.color }}
                    >
                      <app.icon size={15} />
                    </div>
                    <span className="font-bold text-[12px] leading-tight">{app.name}</span>
                    <span className="text-[10px] mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{app.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link to="/inicio" className="flex items-center gap-2 text-white no-underline">
          <span className="font-extrabold text-[14px] tracking-tight">
            <span style={{ color: '#4ade80' }}>RomEx</span>
            <span className="text-white/90 font-semibold pl-1.5 ml-1.5 border-l border-white/20">Capacitaciones</span>
          </span>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:block">
        <div
          className={`flex items-center rounded-full px-3 h-8 transition-all ${
            searchFocused ? 'ring-2 ring-[#3b8fd4]' : ''
          }`}
          style={{ background: '#fff', color: '#1a1a1a' }}
        >
          <Search size={14} className="text-slate-500 mr-2 shrink-0" />
          <input
            className="bg-transparent border-0 focus:outline-none w-full text-[12px] text-slate-800 placeholder:text-slate-400"
            placeholder="Buscar materiales, temas…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200 text-[11px] text-slate-500 font-medium whitespace-nowrap">
            <span>Archivos</span>
            <ChevronDown size={11} />
          </div>
        </div>
      </form>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={toggle}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/12 transition-colors"
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/12 text-white/70" title="Ayuda">
          <HelpCircle size={15} />
        </button>
        <button type="button" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/12 text-white/70" title="Configuración">
          <Settings size={15} />
        </button>

        <div className="relative ml-1" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-white/30 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#0078d4] text-white font-bold text-[11px] flex items-center justify-center border border-white/25">
              NH
            </div>
          </button>

          {userMenuOpen && (
            <div
              className="absolute top-11 right-0 w-72 rounded-2xl shadow-2xl p-4 z-50 animate-scale"
              style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-10 h-10 rounded-full bg-[#0078d4] text-white font-bold text-sm flex items-center justify-center shrink-0">
                  NH
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[13px] truncate">Nereyda Huachua Flores</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>Calidad e Inocuidad</div>
                </div>
              </div>
              <div className="p-2.5 rounded-xl text-[11px] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}>
                <strong>EXPORTADORA ROMEX S.A.</strong><br />
                Planta de Cacao · Chincha<br />
                HACCP 004 · Local-first
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
