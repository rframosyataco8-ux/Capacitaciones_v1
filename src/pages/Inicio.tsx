import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Network, Calendar, FileCheck, FolderOpen,
  Clock, ArrowRight, Sparkles, Award, Users, CheckCircle2, ChevronRight
} from 'lucide-react'
import {
  seedIfEmpty, getStats, listCapacitaciones, listExams, listFolders,
  listAllSubmissions, type Capacitacion, type Exam, type MaterialFolder,
} from '../lib/db'
import KnowledgeGraph from '../components/KnowledgeGraph'
import { CardsSkeleton } from '../components/Skeleton'

type SubView = 'dashboard' | 'grafo'

interface Proxima {
  tema: string
  date: string
  responsable: string
  codigo: string
}

function formatDateLabel(d: string) {
  const p = d.split('-')
  if (p.length !== 3) return d
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${parseInt(p[2], 10)} ${months[parseInt(p[1], 10) - 1]} ${p[0]}`
}

export default function Inicio() {
  const [sub, setSub] = useState<SubView>('dashboard')
  const [year, setYear] = useState<number>(2026)
  const [stats, setStats] = useState({
    temas: 0, sessions: 0, realizadas: 0, pendientes: 0, exams: 0, files: 0, proximas: 0, submissions: 0,
  })
  const [proximasList, setProximasList] = useState<Proxima[]>([])
  const [temas, setTemas] = useState<Capacitacion[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [folders, setFolders] = useState<MaterialFolder[]>([])
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0)
  const [aprobadosCount, setAprobadosCount] = useState<number>(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await seedIfEmpty()
        if (cancelled) return
        const s = await getStats(year)
        const caps = await listCapacitaciones(year)
        const ex = await listExams()
        const fo = await listFolders(year)
        const allSubs = await listAllSubmissions()
        if (cancelled) return

        setStats(s)
        setTemas(caps)
        setExams(ex)
        setFolders(fo)
        setTotalSubmissions(allSubs.length)
        setAprobadosCount(allSubs.filter((x) => x.aprobado).length)

        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const limit = new Date(now)
        limit.setDate(limit.getDate() + 14)
        const list: Proxima[] = []
        for (const c of caps) {
          for (const sess of c.sessions || []) {
            if (sess.status === 'Realizada') continue
            const d = new Date(sess.date + 'T12:00:00')
            if (d >= now && d <= limit) {
              list.push({
                tema: c.tema,
                date: sess.date,
                responsable: c.responsable,
                codigo: c.codigo,
              })
            }
          }
        }
        list.sort((a, b) => a.date.localeCompare(b.date))
        setProximasList(list.slice(0, 8))
        setReady(true)
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setError('No se pudieron cargar los datos. Recarga la página.')
          setReady(true)
        }
      }
    })()
    return () => { cancelled = true }
  }, [year])

  const cards = [
    { label: 'Temas del programa', value: stats.temas, icon: Calendar, hint: `Año ${year} · HACCP 004` },
    { label: 'Sesiones totales', value: stats.sessions, icon: Clock, hint: 'Incluye refuerzos' },
    { label: 'Sesiones ejecutadas', value: stats.realizadas, icon: FileCheck, hint: `${stats.pendientes} pendientes` },
    { label: 'Evaluaciones rendidas', value: totalSubmissions, icon: Award, hint: `${aprobadosCount} constancias emitidas` },
  ]

  const pct = stats.sessions ? Math.round((stats.realizadas / stats.sessions) * 100) : 0

  return (
    <div className="h-full flex flex-col select-none">
      {/* Header Sub-view */}
      <div className="h-12 page-header flex items-center justify-between px-6 gap-1.5 shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          {(['dashboard', 'grafo'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSub(v)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                sub === v
                  ? 'bg-[var(--primary-soft)] text-[var(--primary-text)] shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
              }`}
            >
              {v === 'dashboard' ? <LayoutDashboard size={15} /> : <Network size={15} />}
              {v === 'dashboard' ? 'Panel de Control' : 'Grafo de Conocimiento'}
            </button>
          ))}
        </div>

        {/* Selector de Año */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Año del Programa:</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input h-8 text-[12px] font-bold py-0"
          >
            {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-7">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-[13px]" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {sub === 'dashboard' && (
          <div className="animate-in max-w-6xl mx-auto">
            {/* Banner Institucional */}
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0f4c81] to-[#1a6bb0] text-white shadow-md">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#c4a35a] mb-1">
                  <Sparkles size={13} /> EXPORTADORA ROMEX S.A. · PLANTA CHINCHA
                </div>
                <h1 className="text-[26px] font-black tracking-tight">Sistema de Gestión de Capacitaciones {year}</h1>
                <p className="text-[13px] opacity-90 mt-1 max-w-xl">
                  Programa oficial de formación continua para personal operativo y técnico en BPM, Sistema HACCP e Inocuidad Alimentaria.
                </p>
              </div>
              <div className="flex gap-2">
                <Link to="/cronograma" className="btn bg-white hover:bg-slate-100 text-[#0f4c81] font-bold text-xs shadow-sm no-underline">
                  Ver Cronograma <ChevronRight size={15} />
                </Link>
                <Link to="/examenes" className="btn bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 no-underline">
                  Evaluaciones Forms
                </Link>
              </div>
            </div>

            {!ready ? (
              <CardsSkeleton />
            ) : (
              <>
                {/* Métricas KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {cards.map((m) => (
                    <div key={m.label} className="card p-5 transition-shadow hover:shadow-md border" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{m.label}</div>
                          <div className="text-[28px] font-black mt-1 tracking-tight text-[var(--text)]">{m.value}</div>
                          <div className="text-[11px] mt-1 text-[var(--text-secondary)] font-medium">{m.hint}</div>
                        </div>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[var(--primary-soft)] text-[var(--primary-text)] shrink-0 shadow-2xs">
                          <m.icon size={20} strokeWidth={2.2} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-5 gap-5">
                  {/* Progreso del Programa */}
                  <div className="card p-6 lg:col-span-2 border" style={{ borderColor: 'var(--border)' }}>
                    <h2 className="text-[15px] font-bold mb-4">Avance del Programa {year}</h2>
                    <div className="flex items-end gap-3 mb-3">
                      <span className="text-[40px] font-black tracking-tight leading-none text-[var(--primary)]">{pct}%</span>
                      <span className="text-[12px] pb-1 text-[var(--text-secondary)] font-medium">{stats.realizadas} de {stats.sessions} sesiones</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden bg-[var(--surface-2)] mb-6">
                      <div className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#0f4c81] to-[#2563eb]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="space-y-3 pt-3 border-t text-[13px]" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Evaluaciones creadas</span>
                        <strong className="font-bold">{stats.exams}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Archivos en OneDrive</span>
                        <strong className="font-bold">{stats.files}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Tasa de Aprobación</span>
                        <strong className="font-bold text-[var(--success)]">
                          {totalSubmissions > 0 ? `${Math.round((aprobadosCount / totalSubmissions) * 100)}%` : '—'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Próximas Sesiones */}
                  <div className="card p-6 lg:col-span-3 border" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[15px] font-bold">Próximas Sesiones Programadas</h2>
                      <Link to="/cronograma" className="text-[12px] font-bold text-[var(--primary-text)] hover:underline no-underline">
                        Ver todas
                      </Link>
                    </div>
                    {proximasList.length === 0 ? (
                      <div className="py-12 text-center text-[13px] text-[var(--text-muted)]">
                        No hay sesiones programadas en los próximos 14 días.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {proximasList.map((p) => (
                          <div
                            key={p.codigo + p.date}
                            className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-[var(--surface-2)] transition-colors"
                          >
                            <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary-text)] shadow-2xs">
                              <span className="text-xs font-black">{formatDateLabel(p.date).split(' ')[0]}</span>
                              <span className="uppercase opacity-80 text-[9px]">{formatDateLabel(p.date).split(' ')[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-bold truncate text-[var(--text)]">{p.tema}</div>
                              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{p.responsable} · <span className="font-mono">{p.codigo}</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {sub === 'grafo' && (
          <div className="animate-in max-w-6xl mx-auto">
            <div className="mb-5">
              <h1 className="text-[22px] font-bold tracking-tight">Grafo de Conocimiento Interactivo</h1>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Visualización de relaciones entre capacitaciones, evaluaciones de Forms y carpetas técnicas de OneDrive.
              </p>
            </div>
            {!ready ? (
              <div className="card p-16 text-center text-sm text-[var(--text-muted)]">Cargando grafo…</div>
            ) : (
              <KnowledgeGraph temas={temas} exams={exams} folders={folders} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
