import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import type { Capacitacion, Exam, MaterialFolder } from '../lib/db'

interface Node {
  id: string
  label: string
  type: 'tema' | 'examen' | 'carpeta'
  x: number
  y: number
  vx: number
  vy: number
}

interface Edge {
  from: string
  to: string
}

const TYPE_COLOR = {
  tema: '#0f4c81',
  examen: '#c4a35a',
  carpeta: '#047857',
}

export default function KnowledgeGraph({
  temas,
  exams,
  folders,
}: {
  temas: Capacitacion[]
  exams: Exam[]
  folders: MaterialFolder[]
}) {
  const width = 900
  const height = 520
  const [selected, setSelected] = useState<string | null>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const anim = useRef(0)

  const built = useMemo(() => {
    const ns: Node[] = []
    const es: Edge[] = []
    const cx = width / 2
    const cy = height / 2

    temas.slice(0, 18).forEach((t, i) => {
      const angle = (i / Math.min(temas.length, 18)) * Math.PI * 2
      const r = 160 + (i % 3) * 35
      ns.push({
        id: `t-${t.id}`,
        label: t.tema.length > 28 ? t.tema.slice(0, 26) + '…' : t.tema,
        type: 'tema',
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
      })
    })

    exams.forEach((ex, i) => {
      const id = `e-${ex.id}`
      ns.push({
        id,
        label: ex.titulo.length > 24 ? ex.titulo.slice(0, 22) + '…' : ex.titulo,
        type: 'examen',
        x: cx + (i - exams.length / 2) * 50,
        y: cy - 200,
        vx: 0,
        vy: 0,
      })
      if (ex.capacitacionId) {
        es.push({ from: id, to: `t-${ex.capacitacionId}` })
      } else if (ex.tema) {
        const match = temas.find((t) => t.tema === ex.tema)
        if (match) es.push({ from: id, to: `t-${match.id}` })
      }
    })

    // Sample folders linked by tema name
    const folderSample = folders.slice(0, 12)
    folderSample.forEach((f, i) => {
      const id = `f-${f.id}`
      ns.push({
        id,
        label: f.tema.length > 22 ? f.tema.slice(0, 20) + '…' : f.tema,
        type: 'carpeta',
        x: cx + (i - folderSample.length / 2) * 40,
        y: cy + 210,
        vx: 0,
        vy: 0,
      })
      const match = temas.find((t) => t.tema === f.tema)
      if (match) es.push({ from: id, to: `t-${match.id}` })
    })

    return { ns, es }
  }, [temas, exams, folders])

  useEffect(() => {
    setNodes(built.ns.map((n) => ({ ...n })))
    edgesRef.current = built.es
  }, [built])

  // Simple force simulation
  useEffect(() => {
    let alive = true
    const tick = () => {
      if (!alive) return
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }))
        const k = 0.004
        // repulsion
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            let dx = next[j].x - next[i].x
            let dy = next[j].y - next[i].y
            let dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = 800 / (dist * dist)
            dx = (dx / dist) * force
            dy = (dy / dist) * force
            next[i].vx -= dx
            next[i].vy -= dy
            next[j].vx += dx
            next[j].vy += dy
          }
        }
        // spring edges
        for (const e of edgesRef.current) {
          const a = next.find((n) => n.id === e.from)
          const b = next.find((n) => n.id === e.to)
          if (!a || !b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const target = 120
          const f = (dist - target) * k
          a.vx += (dx / dist) * f
          a.vy += (dy / dist) * f
          b.vx -= (dx / dist) * f
          b.vy -= (dy / dist) * f
        }
        // center gravity + damp
        for (const n of next) {
          n.vx += (width / 2 - n.x) * 0.0008
          n.vy += (height / 2 - n.y) * 0.0008
          n.vx *= 0.85
          n.vy *= 0.85
          n.x = Math.max(40, Math.min(width - 40, n.x + n.vx))
          n.y = Math.max(30, Math.min(height - 30, n.y + n.vy))
        }
        return next
      })
      anim.current = requestAnimationFrame(tick)
    }
    anim.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(anim.current)
    }
  }, [built])

  const nodeById = useMemo(() => {
    const m = new Map<string, Node>()
    nodes.forEach((n) => m.set(n.id, n))
    return m
  }, [nodes])

  if (temas.length === 0) {
    return (
      <div className="card p-12 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
        No hay datos para el grafo. Crea el programa en Cronograma.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b flex flex-wrap items-center gap-4" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>Leyenda</span>
        {(['tema', 'examen', 'carpeta'] as const).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5 text-[12px]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />
            {t === 'tema' ? 'Tema' : t === 'examen' ? 'Examen' : 'Carpeta'}
          </span>
        ))}
        {selected && (
          <span className="text-[12px] ml-auto truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Seleccionado: {nodes.find((n) => n.id === selected)?.label}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ background: 'var(--surface-2)' }}>
        {edgesRef.current.map((e, i) => {
          const a = nodeById.get(e.from)
          const b = nodeById.get(e.to)
          if (!a || !b) return null
          const active = selected === e.from || selected === e.to
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={active ? 'var(--primary)' : 'var(--border-strong)'}
              strokeWidth={active ? 2 : 1}
              opacity={active ? 0.9 : 0.45}
            />
          )
        })}
        {nodes.map((n) => {
          const r = n.type === 'tema' ? 22 : 16
          const active = selected === n.id
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected((s) => (s === n.id ? null : n.id))}
            >
              <circle
                r={r + (active ? 3 : 0)}
                fill={TYPE_COLOR[n.type]}
                opacity={active ? 1 : 0.9}
                stroke={active ? 'var(--accent)' : 'transparent'}
                strokeWidth={2}
              />
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize={10}
                fill="var(--text-secondary)"
                style={{ pointerEvents: 'none' }}
              >
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
