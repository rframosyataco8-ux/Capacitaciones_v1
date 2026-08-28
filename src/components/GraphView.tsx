import { useEffect, useRef, useState } from 'react'
import type { Note, Event, Exam } from '../lib/db'

type Node = { id: string; label: string; type: string; x: number; y: number; vx: number; vy: number }
type Link = { s: string; t: string }

const COLORS: Record<string, string> = {
  cap: '#1a73e8',
  proc: '#188038',
  exam: '#e37400',
  pol: '#9334e6',
}

export default function GraphView({ notes, events, exams }: { notes: Note[]; events: Event[]; exams: Exam[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<Node | null>(null)
  const nodesRef = useRef<Node[]>([])
  const linksRef = useRef<Link[]>([])
  const dragRef = useRef<Node | null>(null)
  const animRef = useRef(0)
  const hoverRef = useRef<Node | null>(null)

  useEffect(() => {
    const nodes: Node[] = []
    notes.forEach((n, i) => {
      const a = (i / Math.max(notes.length, 1)) * Math.PI * 2
      const type = (n.tags || []).includes('obligatoria') ? 'cap' : (n.path || '').includes('Base') ? 'pol' : 'proc'
      nodes.push({ id: n.id, label: (n.title || '').split('\u2014')[0].trim().slice(0, 22), type, x: Math.cos(a) * 180, y: Math.sin(a) * 140, vx: 0, vy: 0 })
    })
    events.forEach((e, i) => {
      const a = (i / Math.max(events.length, 1)) * Math.PI * 2 + 0.4
      nodes.push({ id: e.id, label: e.title.slice(0, 20), type: 'cap', x: Math.cos(a) * 220, y: Math.sin(a) * 160, vx: 0, vy: 0 })
    })
    exams.forEach((x, i) => {
      const a = (i / Math.max(exams.length, 1)) * Math.PI * 2 + 0.8
      nodes.push({ id: x.id, label: x.title.slice(0, 20), type: 'exam', x: Math.cos(a) * 150, y: Math.sin(a) * 200, vx: 0, vy: 0 })
    })
    const links: Link[] = []
    notes.forEach(n => {
      const body = n.body || ''
      notes.forEach(o => {
        if (n.id === o.id) return
        const key = (o.title || '').split('\u2014')[0].trim()
        if (key && body.includes(key)) links.push({ s: n.id, t: o.id })
      })
      exams.forEach(ex => {
        if (ex.folder && (n.path || '').includes((ex.folder || '').split('/')[0])) links.push({ s: n.id, t: ex.id })
      })
    })
    nodesRef.current = nodes
    linksRef.current = links
  }, [notes, events, exams])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const parent = canvas!.parentElement!
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth || 800
      const h = parent.clientHeight || 500
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = w + 'px'
      canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function tick() {
      const W = canvas!.clientWidth
      const H = canvas!.clientHeight
      const nodes = nodesRef.current
      const links = linksRef.current
      const cx = W / 2
      const cy = H / 2

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          let dx = b.x - a.x, dy = b.y - a.y
          const d = Math.hypot(dx, dy) || 1
          const f = 2500 / (d * d)
          dx /= d; dy /= d
          if (a !== dragRef.current) { a.vx -= f * dx; a.vy -= f * dy }
          if (b !== dragRef.current) { b.vx += f * dx; b.vy += f * dy }
        }
      }
      links.forEach(l => {
        const a = nodes.find(n => n.id === l.s)
        const b = nodes.find(n => n.id === l.t)
        if (!a || !b) return
        let dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const f = (d - 110) * 0.02
        dx /= d; dy /= d
        if (a !== dragRef.current) { a.vx += f * dx; a.vy += f * dy }
        if (b !== dragRef.current) { b.vx -= f * dx; b.vy -= f * dy }
      })
      nodes.forEach(n => {
        if (n === dragRef.current) return
        n.vx += -n.x * 0.003
        n.vy += -n.y * 0.003
        n.vx *= 0.86
        n.vy *= 0.86
        n.x = Math.max(-cx + 50, Math.min(cx - 50, n.x + n.vx))
        n.y = Math.max(-cy + 50, Math.min(cy - 50, n.y + n.vy))
      })

      ctx!.clearRect(0, 0, W, H)
      const hv = hoverRef.current

      links.forEach(l => {
        const a = nodes.find(n => n.id === l.s)
        const b = nodes.find(n => n.id === l.t)
        if (!a || !b) return
        const hl = hv && (hv.id === l.s || hv.id === l.t)
        ctx!.beginPath()
        ctx!.moveTo(cx + a.x, cy + a.y)
        ctx!.lineTo(cx + b.x, cy + b.y)
        ctx!.strokeStyle = hl ? 'rgba(26,115,232,0.5)' : 'rgba(60,64,67,0.2)'
        ctx!.lineWidth = hl ? 2 : 1
        ctx!.stroke()
      })

      nodes.forEach(n => {
        const px = cx + n.x
        const py = cy + n.y
        const active = hv === n || dragRef.current === n
        const r = active ? 11 : 8
        const c = COLORS[n.type] || '#5f6368'
        ctx!.beginPath()
        ctx!.arc(px, py, r + 5, 0, Math.PI * 2)
        ctx!.fillStyle = c + '28'
        ctx!.fill()
        ctx!.beginPath()
        ctx!.arc(px, py, r, 0, Math.PI * 2)
        ctx!.fillStyle = c
        ctx!.fill()
        ctx!.font = '500 12px Roboto, sans-serif'
        ctx!.fillStyle = '#5f6368'
        ctx!.textAlign = 'center'
        ctx!.fillText(n.label, px, py + r + 14)
      })
      animRef.current = requestAnimationFrame(tick)
    }
    tick()

    function pos(e: MouseEvent) {
      const r = canvas!.getBoundingClientRect()
      return { x: e.clientX - r.left - canvas!.clientWidth / 2, y: e.clientY - r.top - canvas!.clientHeight / 2 }
    }
    function hit(x: number, y: number) {
      return nodesRef.current.find(n => Math.hypot(n.x - x, n.y - y) < 16) || null
    }
    const onDown = (e: MouseEvent) => { const p = pos(e); dragRef.current = hit(p.x, p.y) }
    const onMove = (e: MouseEvent) => {
      const p = pos(e)
      if (dragRef.current) { dragRef.current.x = p.x; dragRef.current.y = p.y; dragRef.current.vx = 0; dragRef.current.vy = 0 }
      const h = hit(p.x, p.y)
      hoverRef.current = h
      setHover(h)
    }
    const onUp = () => { dragRef.current = null }
    canvas.addEventListener('mousedown', onDown)
    canvas.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('mousedown', onDown)
      canvas.removeEventListener('mousemove', onMove)
    }
  }, [])

  return (
    <div className="relative w-full h-full bg-[#e8eaed]">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <div className="absolute bottom-4 left-4 bg-white/95 rounded-xl shadow border border-[#e8eaed] px-4 py-3 text-xs text-[#5f6368] space-y-1.5">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" /> Capacitacion</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#188038]" /> Procedimiento</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#e37400]" /> Examen</div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#9334e6]" /> Politica</div>
      </div>
      {hover && (
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg border border-[#e8eaed] px-4 py-3 max-w-xs">
          <div className="font-medium text-[#202124] text-sm">{hover.label}</div>
          <div className="text-xs text-[#80868b] mt-0.5">{hover.type}</div>
        </div>
      )}
      <div className="absolute top-4 left-4 text-xs text-[#80868b] bg-white/90 rounded-full px-3 py-1.5 shadow-sm">
        Arrastra nodos · {notes.length + events.length + exams.length} elementos
      </div>
    </div>
  )
}
