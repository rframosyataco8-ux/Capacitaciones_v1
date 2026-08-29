import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Network,
  Calendar,
  FileCheck,
  FolderOpen,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import {
  seedIfEmpty,
  getStats,
  listCapacitaciones,
  listExams,
  listFolders,
  type Capacitacion,
  type Exam,
  type MaterialFolder,
} from '../lib/db'
import KnowledgeGraph from '../components/KnowledgeGraph'

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
  const [year] = useState(2026)
  const [stats, setStats] = useState({
    temas: 0, sessions: 0, realizadas: 0, pendientes: 0, exams: 0, files: 0, proximas: 0,
  })
  const [proximasList, setProximasList] = useState<Proxima[]>([])
  const [temas, setTemas] = useState<Capacitacion[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [folders, setFolders] = useState<MaterialFolder[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      await seedIfEmpty()
      const s = await getStats(year)
      setStats(s)
      const caps = await listCapacitaciones(year)
      setTemas(caps)
      setExams(await listExams())
      setFolders(await listFolders(year))

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
    })()
  }, [year])

  const cards = [
    { label: 'Temas del programa', value: stats.temas, icon: Calendar, hint: 'Programa anual' },
    { label: 'Sesiones totales', value: stats.sessions, icon: Clock, hint: 'Incluye refuerzos' },
    { label: 'Realizadas', value: stats.realizadas, icon: FileCheck, hint: 'Marcadas en cronograma' },
    { label: 'Próximas (7 días)', value: stats.proximas, icon: FolderOpen, hint: 'Por ejecutar' },
  ]

  const pct = stats.sessions ? Math.round((stats.realizadas / stats.sessions) * 100) : 0

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
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--accent)' }}>
                  <Sparkles size={12} /> ROMEX · Calidad
                </div>
                <h1 className="text-[24px] font-semibold tracking-tight">Panel de capacitaciones</h1>
                <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                  EXPORTADORA ROMEX S.A. · Programa {year} · HACCP 004
                </p>
              </div>
              <Link to="/cronograma" className="btn btn-primary no-underline">
                Ir al cronograma <ArrowRight size={15} />
              </Link>
            </div>

            {!ready ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando métricas…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {cards.map((m) => (
                    <div key={m.label} className="card p-5 transition-shadow hover:shadow-[var(--shadow-md)]">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                          <div className="text-[28px] font-semibold mt-1.5 tracking-tight tabular-nums">{m.value}</div>
                          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.hint}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}>
                          <m.icon size={18} strokeWidth={2} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-5 gap-4">
                  <div className="card p-5 lg:col-span-2">
                    <h2 className="text-[14px] font-semibold mb-4">Avance del programa</h2>
                    <div className="flex items-end gap-3 mb-3">
                      <span className="text-[36px] font-semibold tracking-tight tabular-nums leading-none">{pct}%</span>
                      <span className="text-[12px] pb-1" style={{ color: 'var(--text-secondary)' }}>{stats.realizadas} / {stats.sessions} sesiones</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, #3b82c4 100%)', width: `${pct}%` }} />
                    </div>
                    <ul className="mt-5 text-[13px] space-y-2" style={{ color: 'var(--text-secondary)' }}>
                      <li className="flex justify-between"><span>Exámenes</span><strong style={{ color: 'var(--text)' }}>{stats.exams}</strong></li>
                      <li className="flex justify-between"><span>Archivos</span><strong style={{ color: 'var(--text)' }}>{stats.files}</strong></li>
                      <li className="flex justify-between"><span>Pendientes</span><strong style={{ color: 'var(--text)' }}>{stats.pendientes}</strong></li>
                    </ul>
                  </div>

                  <div className="card p-5 lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-[14px] font-semibold">Próximas sesiones (14 días)</h2>
                      <Link to="/cronograma" className="text-[12px] font-semibold no-underline" style={{ color: 'var(--primary-text)' }}>Ver todo</Link>
                    </div>
                    {proximasList.length === 0 ? (
                      <div className="py-10 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
                        No hay sesiones programadas en los próximos 14 días.
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {proximasList.map((p) => (
                          <div
                            key={p.codigo + p.date}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--row-hover)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 text-[10px] font-bold" style={{ background: 'var(--primary-soft)', color: 'var(--primary-text)' }}>
                              <span>{formatDateLabel(p.date).split(' ')[0]}</span>
                              <span className="uppercase opacity-80">{formatDateLabel(p.date).split(' ')[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium truncate">{p.tema}</div>
                              <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{p.responsable} · {p.codigo}</div>
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
          <div className="animate-in max-w-6xl">
            <div className="mb-5">
              <h1 className="text-[22px] font-semibold tracking-tight">Grafo de conocimiento</h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                Temas del programa conectados con exámenes y carpetas de materiales. Clic en un nodo para resaltar enlaces.
              </p>
            </div>
            {!ready ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando grafo…</p>
            ) : (
              <KnowledgeGraph temas={temas} exams={exams} folders={folders} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
