import { useEffect, useRef, useState, useCallback } from 'react'
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw, Settings2, Filter } from 'lucide-react'
import type { Note, FileItem, Exam } from '../lib/db'

type Node = {
  id: string; label: string; kind: 'note' | 'folder' | 'exam' | 'tag'
  x: number; y: number; vx: number; vy: number; r: number; color: string
}
type Edge = { a: string; b: string }

type Props = {
  notes: Note[]; files: FileItem[]; exams: Exam[]
  onOpenNote?: (id: string) => void
}

export default function GraphView({ notes, files, exams, onOpenNote }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const animRef = useRef(0)
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const dragNode = useRef<string | null>(null)
  const dragPan = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })
  const [fullscreen, setFullscreen] = useState(false)
  const [showPanel, setShowPanel] = useState(true)
  const [showTags, setShowTags] = useState(true)
  const [showFolders, setShowFolders] = useState(true)
  const [showExams, setShowExams] = useState(true)
  const [showNotes, setShowNotes] = useState(true)
  const [animate, setAnimate] = useState(true)
  const [nodeSize, setNodeSize] = useState(1)
  const [linkForce, setLinkForce] = useState(1)
  const [centerForce, setCenterForce] = useState(0.02)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const isDark = () => document.documentElement.classList.contains('dark')

  const rebuild = useCallback(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    const idSet = new Set<string>()
    const W = 900, H = 600
    const rnd = () => ({ x: W * 0.2 + Math.random() * W * 0.6, y: H * 0.2 + Math.random() * H * 0.6 })
    const folders = new Set<string>()
    files.forEach(f => folders.add(f.folder || 'General'))

    if (showFolders) {
      Array.from(folders).forEach(folder => {
        const id = 'folder:' + folder
        if (idSet.has(id)) return
        idSet.add(id)
        const p = rnd()
        nodes.push({ id, label: folder, kind: 'folder', x: p.x, y: p.y, vx: 0, vy: 0, r: 14 * nodeSize, color: '#e37400' })
      })
    }
    if (showNotes) {
      notes.forEach(n => {
        const id = 'note:' + n.id
        idSet.add(id)
        const p = rnd()
        nodes.push({ id, label: n.title || 'Sin titulo', kind: 'note', x: p.x, y: p.y, vx: 0, vy: 0, r: 10 * nodeSize, color: '#1a73e8' })
        const tags = (n.tags && n.tags.length) ? n.tags.map(tg => '#' + tg) : ((n.body || '').match(/#[\wáéíóúñÁÉÍÓÚÑ-]+/gi) || [])
        if (showTags) {
          tags.forEach(tag => {
            const tid = 'tag:' + tag.toLowerCase()
            if (!idSet.has(tid)) {
              idSet.add(tid)
              const tp = rnd()
              nodes.push({ id: tid, label: tag, kind: 'tag', x: tp.x, y: tp.y, vx: 0, vy: 0, r: 7 * nodeSize, color: '#9334e6' })
            }
            edges.push({ a: id, b: tid })
          })
        }
        const links = (n.body || '').match(/\[\[([^\]]+)\]\]/g) || []
        links.forEach(raw => {
          const title = raw.slice(2, -2).trim().toLowerCase()
          const target = notes.find(x => (x.title || '').toLowerCase() === title)
          if (target) edges.push({ a: id, b: 'note:' + target.id })
        })
      })
    }
    if (showExams) {
      exams.forEach(ex => {
        const id = 'exam:' + ex.id
        idSet.add(id)
        const p = rnd()
        nodes.push({ id, label: ex.title || 'Examen', kind: 'exam', x: p.x, y: p.y, vx: 0, vy: 0, r: 11 * nodeSize, color: '#188038' })
        if (ex.folder && showFolders) edges.push({ a: id, b: 'folder:' + ex.folder })
      })
    }
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [notes, files, exams, showTags, showFolders, showExams, showNotes, nodeSize])

  useEffect(() => { rebuild() }, [rebuild])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const parent = canvas!.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const w = parent.clientWidth, h = parent.clientHeight
      canvas!.width = w * dpr; canvas!.height = h * dpr
      canvas!.style.width = w + 'px'; canvas!.style.height = h + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function tick() {
      const nodes = nodesRef.current, edges = edgesRef.current
      const w = canvas!.clientWidth, h = canvas!.clientHeight
      const dark = isDark()
      if (animate) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j]
            let dx = b.x - a.x, dy = b.y - a.y
            let dist = Math.sqrt(dx * dx + dy * dy) || 1
            const force = (120 * linkForce) / (dist * dist)
            dx = (dx / dist) * force; dy = (dy / dist) * force
            a.vx -= dx; a.vy -= dy; b.vx += dx; b.vy += dy
          }
        }
        edges.forEach(e => {
          const a = nodes.find(n => n.id === e.a), b = nodes.find(n => n.id === e.b)
          if (!a || !b) return
          let dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (dist - 100) * 0.008 * linkForce
          dx = (dx / dist) * force; dy = (dy / dist) * force
          a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy
        })
        nodes.forEach(n => {
          if (dragNode.current === n.id) return
          n.vx += (w / 2 - n.x) * centerForce
          n.vy += (h / 2 - n.y) * centerForce
          n.vx *= 0.85; n.vy *= 0.85
          n.x += n.vx; n.y += n.vy
        })
      }
      ctx!.clearRect(0, 0, w, h)
      ctx!.fillStyle = dark ? '#202124' : '#f8f9fa'
      ctx!.fillRect(0, 0, w, h)
      ctx!.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
      for (let gx = 0; gx < w; gx += 24)
        for (let gy = 0; gy < h; gy += 24) {
          ctx!.beginPath(); ctx!.arc(gx, gy, 1, 0, Math.PI * 2); ctx!.fill()
        }
      ctx!.save()
      ctx!.translate(panRef.current.x, panRef.current.y)
      ctx!.scale(scaleRef.current, scaleRef.current)
      const q = search.trim().toLowerCase()
      edges.forEach(e => {
        const a = nodes.find(n => n.id === e.a), b = nodes.find(n => n.id === e.b)
        if (!a || !b) return
        const highlight = selected && (a.id === selected || b.id === selected)
        ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y)
        ctx!.strokeStyle = highlight ? (dark ? 'rgba(138,180,248,0.7)' : 'rgba(26,115,232,0.55)') : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
        ctx!.lineWidth = highlight ? 2 / scaleRef.current : 1 / scaleRef.current
        ctx!.stroke()
      })
      nodes.forEach(n => {
        const isSel = selected === n.id
        const isDim = q && !n.label.toLowerCase().includes(q) && n.id !== selected
        ctx!.globalAlpha = isDim ? 0.2 : 1
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.r + (isSel ? 3 : 0), 0, Math.PI * 2)
        ctx!.fillStyle = n.color; ctx!.fill()
        if (isSel) { ctx!.strokeStyle = dark ? '#fff' : '#202124'; ctx!.lineWidth = 2 / scaleRef.current; ctx!.stroke() }
        const fontSize = Math.max(10, 12 / scaleRef.current)
        ctx!.font = (isSel ? '600 ' : '400 ') + fontSize + 'px Roboto, sans-serif'
        ctx!.fillStyle = dark ? '#e8eaed' : '#202124'
        ctx!.textAlign = 'center'
        ctx!.fillText(n.label.slice(0, 28), n.x, n.y + n.r + fontSize + 2)
        ctx!.globalAlpha = 1
      })
      ctx!.restore()
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)

    function screenToWorld(sx: number, sy: number) {
      return { x: (sx - panRef.current.x) / scaleRef.current, y: (sy - panRef.current.y) / scaleRef.current }
    }
    function hitTest(sx: number, sy: number): Node | null {
      const { x, y } = screenToWorld(sx, sy)
      for (let i = nodesRef.current.length - 1; i >= 0; i--) {
        const n = nodesRef.current[i]
        const dx = n.x - x, dy = n.y - y
        if (dx * dx + dy * dy < (n.r + 4) * (n.r + 4)) return n
      }
      return null
    }
    function onDown(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top
      lastMouse.current = { x: sx, y: sy }
      const hit = hitTest(sx, sy)
      if (hit) { dragNode.current = hit.id; setSelected(hit.id) }
      else { dragPan.current = true; setSelected(null) }
    }
    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top
      const dx = sx - lastMouse.current.x, dy = sy - lastMouse.current.y
      lastMouse.current = { x: sx, y: sy }
      if (dragNode.current) {
        const n = nodesRef.current.find(x => x.id === dragNode.current)
        if (n) { n.x += dx / scaleRef.current; n.y += dy / scaleRef.current; n.vx = 0; n.vy = 0 }
      } else if (dragPan.current) {
        panRef.current.x += dx; panRef.current.y += dy
      }
    }
    function onUp() { dragNode.current = null; dragPan.current = false }
    function onDblClick(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect()
      const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top)
      if (hit?.kind === 'note' && onOpenNote) onOpenNote(hit.id.replace('note:', ''))
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      scaleRef.current = Math.min(4, Math.max(0.2, scaleRef.current * (e.deltaY > 0 ? 0.9 : 1.1)))
    }
    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    canvas.addEventListener('dblclick', onDblClick)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      canvas.removeEventListener('dblclick', onDblClick)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [animate, linkForce, centerForce, search, selected, onOpenNote])

  function zoom(factor: number) {
    scaleRef.current = Math.min(4, Math.max(0.2, scaleRef.current * factor))
  }
  function resetView() { scaleRef.current = 1; panRef.current = { x: 0, y: 0 } }
  const selectedNode = selected ? nodesRef.current.find(n => n.id === selected) : null

  return (
    <div className={'relative overflow-hidden ' + (fullscreen ? 'fixed inset-0 z-50 bg-[var(--g-bg)]' : 'h-full min-h-[420px] rounded-xl border border-[var(--g-border)] bg-[var(--g-surface)]')}>
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap gap-1.5 pointer-events-auto">
          <button type="button" onClick={() => zoom(1.2)} className="h-8 w-8 rounded-full bg-[var(--g-surface)] border border-[var(--g-border)] shadow flex items-center justify-center hover:bg-[var(--g-hover)]" title="Acercar"><ZoomIn size={16} className="text-[var(--g-secondary)]" /></button>
          <button type="button" onClick={() => zoom(0.8)} className="h-8 w-8 rounded-full bg-[var(--g-surface)] border border-[var(--g-border)] shadow flex items-center justify-center hover:bg-[var(--g-hover)]" title="Alejar"><ZoomOut size={16} className="text-[var(--g-secondary)]" /></button>
          <button type="button" onClick={resetView} className="h-8 w-8 rounded-full bg-[var(--g-surface)] border border-[var(--g-border)] shadow flex items-center justify-center hover:bg-[var(--g-hover)]" title="Restablecer"><RotateCcw size={16} className="text-[var(--g-secondary)]" /></button>
          <button type="button" onClick={() => setFullscreen(f => !f)} className="h-8 w-8 rounded-full bg-[var(--g-surface)] border border-[var(--g-border)] shadow flex items-center justify-center hover:bg-[var(--g-hover)]" title={fullscreen ? 'Salir' : 'Maximizar'}>
            {fullscreen ? <Minimize2 size={16} className="text-[var(--g-secondary)]" /> : <Maximize2 size={16} className="text-[var(--g-secondary)]" />}
          </button>
          <button type="button" onClick={() => setShowPanel(p => !p)} className={'h-8 px-3 rounded-full border shadow flex items-center gap-1.5 text-xs font-medium ' + (showPanel ? 'bg-[var(--g-blue-soft)] text-[var(--g-blue)] border-transparent' : 'bg-[var(--g-surface)] border-[var(--g-border)] text-[var(--g-secondary)]')}>
            <Settings2 size={14} /> Controles
          </button>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar nodos..."
          className="pointer-events-auto h-8 w-48 px-3 rounded-full border border-[var(--g-border)] bg-[var(--g-surface)] text-xs text-[var(--g-text)] outline-none focus:border-[var(--g-blue)] shadow" />
      </div>

      {showPanel && (
        <div className="absolute top-14 left-3 z-10 w-56 rounded-xl border border-[var(--g-border)] bg-[var(--g-surface)] shadow-lg p-3 text-xs space-y-3 pointer-events-auto max-h-[70%] overflow-y-auto">
          <div className="font-medium text-[var(--g-text)] flex items-center gap-1.5"><Filter size={14} /> Filtros</div>
          <label className="flex items-center gap-2 text-[var(--g-secondary)] cursor-pointer"><input type="checkbox" checked={showNotes} onChange={e => setShowNotes(e.target.checked)} /> Notas</label>
          <label className="flex items-center gap-2 text-[var(--g-secondary)] cursor-pointer"><input type="checkbox" checked={showFolders} onChange={e => setShowFolders(e.target.checked)} /> Carpetas</label>
          <label className="flex items-center gap-2 text-[var(--g-secondary)] cursor-pointer"><input type="checkbox" checked={showExams} onChange={e => setShowExams(e.target.checked)} /> Examenes</label>
          <label className="flex items-center gap-2 text-[var(--g-secondary)] cursor-pointer"><input type="checkbox" checked={showTags} onChange={e => setShowTags(e.target.checked)} /> Etiquetas #</label>
          <div className="border-t border-[var(--g-border)] pt-2 font-medium text-[var(--g-text)]">Fuerzas</div>
          <label className="block text-[var(--g-secondary)]">Tamano nodos<input type="range" min={0.5} max={2} step={0.1} value={nodeSize} onChange={e => setNodeSize(+e.target.value)} className="w-full mt-1" /></label>
          <label className="block text-[var(--g-secondary)]">Fuerza enlaces<input type="range" min={0.3} max={2} step={0.1} value={linkForce} onChange={e => setLinkForce(+e.target.value)} className="w-full mt-1" /></label>
          <label className="block text-[var(--g-secondary)]">Centro<input type="range" min={0} max={0.08} step={0.005} value={centerForce} onChange={e => setCenterForce(+e.target.value)} className="w-full mt-1" /></label>
          <label className="flex items-center gap-2 text-[var(--g-secondary)] cursor-pointer"><input type="checkbox" checked={animate} onChange={e => setAnimate(e.target.checked)} /> Animacion</label>
          <div className="border-t border-[var(--g-border)] pt-2 text-[var(--g-faint)] leading-relaxed">Rueda: zoom · Arrastra: pan · Nodo: mover · Doble clic nota: abrir</div>
          {selectedNode && (
            <div className="border-t border-[var(--g-border)] pt-2">
              <div className="font-medium text-[var(--g-text)] truncate">{selectedNode.label}</div>
              <div className="text-[var(--g-faint)] capitalize">{selectedNode.kind}</div>
            </div>
          )}
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-10 flex gap-3 text-[10px] text-[var(--g-secondary)] bg-[var(--g-surface)]/90 border border-[var(--g-border)] rounded-full px-3 py-1.5 shadow pointer-events-none">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1a73e8]" /> Nota</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e37400]" /> Carpeta</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#188038]" /> Examen</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#9334e6]" /> #tag</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full block" style={{ minHeight: fullscreen ? '100%' : 420 }} />
    </div>
  )
}
