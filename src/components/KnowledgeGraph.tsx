import { useMemo, useState, useRef, useEffect } from 'react'
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

function shortLabel(s: string, max: number) {
  const t = (s || '').trim()
  if (t.length <= max) return t
  return t.slice(0, max - 1) + '…'
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
  const frameRef = useRef(0)
  const ticksRef = useRef(0)

  const built = useMemo(() => {
    const ns: Node[] = []
    const es: Edge[] = []
    const cx = width / 2
    const cy = height / 2
    const temaIds = new Map<string, string>() // tema name lower -> node id

    const list = temas.slice(0, 20)
    list.forEach((t, i) => {
      const id = `t-${t.id ?? t.codigo ?? i}`
      temaIds.set(t.tema.trim().toLowerCase(), id)
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2 - Math.PI / 2
      const r = 150 + (i % 3) * 30
      ns.push({
        id,
        label: shortLabel(t.tema, 26),
        type: 'tema',
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r * 0.85,
        vx: 0,
        vy: 0,
      })
    })

    exams.slice(0, 10).forEach((ex, i) => {
      const id = `e-${ex.id ?? i}`
      ns.push({
        id,
        label: shortLabel(ex.titulo, 22),
        type: 'examen',
        x: 80 + (i % 5) * 160,
        y: 50 + Math.floor(i / 5) * 40,
        vx: 0,
        vy: 0,
      })
      let target: string | undefined
      if (ex.capacitacionId != null) {
        target = `t-${ex.capacitacionId}`
      }
      if (!target && ex.tema) {
        target = temaIds.get(ex.tema.trim().toLowerCase())
      }
      if (target && ns.some((n) => n.id === target)) {
        es.push({ from: id, to: target })
      }
    })

    folders.slice(0, 12).forEach((f, i) => {
      const id = `f-${f.id ?? i}`
      ns.push({
        id,
        label: shortLabel(f.tema, 20),
        type: 'carpeta',
        x: 80 + (i % 6) * 140,
        y: height - 50 - Math.floor(i / 6) * 36,
        vx: 0,
        vy: 0,
      })
      const target = temaIds.get(f.tema.trim().toLowerCase())
      if (target) es.push({ from: id, to: target })
    })

    return { ns, es }
  }, [temas, exams, folders])

  useEffect(() => {
    setNodes(built.ns.map((n) => ({ ...n })))
    edgesRef.current = built.es
    ticksRef.current = 0
  }, [built])

  useEffect(() => {
    let alive = true
    const tick = () => {
      if (!alive) return
      ticksRef.current += 1
      // Run limited physics then stop (stable graph)
      if (ticksRef.current > 180) return

      setNodes((prev) => {
        if (prev.length === 0) return prev
        const next = prev.map((n) => ({ ...n }))
        const n = next.length

        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            let dx = next[j].x - next[i].x
            let dy = next[j].y - next[i].y
            let dist = Math.sqrt(dx * dx + dy * dy) || 0.01
            const force = Math.min(400 / (dist * dist), 8)
            dx = (dx / dist) * force
            dy = (dy / dist) * force
            next[i].vx -= dx
            next[i].vy -= dy
            next[j].vx += dx
            next[j].vy += dy
          }
        }

        for (const e of edgesRef.current) {
          const a = next.find((x) => x.id === e.from)
          const b = next.find((x) => x.id === e.to)
          if (!a || !b) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
          const f = (dist - 110) * 0.006
          a.vx += (dx / dist) * f
          a.vy += (dy / dist) * f
          b.vx -= (dx / dist) * f
          b.vy -= (dy / dist) * f
        }

        for (const node of next) {
          node.vx += (width / 2 - node.x) * 0.001
          node.vy += (height / 2 - node.y) * 0.001
          node.vx *= 0.82
          node.vy *= 0.82
          node.x = Math.max(50, Math.min(width - 50, node.x + node.vx))
          node.y = Math.max(40, Math.min(height - 40, node.y + node.vy))
        }
        return next
      })

      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(frameRef.current)
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
            {nodes.find((n) => n.id === selected)?.label}
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
              key={`${e.from}-${e.to}-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={active ? 'var(--primary)' : 'var(--border-strong)'}
              strokeWidth={active ? 2 : 1}
              opacity={active ? 0.95 : 0.4}
            />
          )
        })}
        {nodes.map((n) => {
          const r = n.type === 'tema' ? 20 : 14
          const active = selected === n.id
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected((s) => (s === n.id ? null : n.id))}
            >
              <circle
                r={r + (active ? 2 : 0)}
                fill={TYPE_COLOR[n.type]}
                opacity={0.92}
                stroke={active ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}
                strokeWidth={active ? 2.5 : 1}
              />
              <text
                y={r + 12}
                textAnchor="middle"
                fontSize={9.5}
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
