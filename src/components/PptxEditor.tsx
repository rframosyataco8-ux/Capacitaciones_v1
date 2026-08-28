import { useEffect, useState } from 'react'
import {
  Download, X, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Plus, Trash2, Type, Bold, Italic, AlignLeft, AlignCenter,
} from 'lucide-react'
import JSZip from 'jszip'
import type { FileItem } from '../lib/db'
import * as db from '../lib/db'

type SlideData = { title: string; paragraphs: string[]; imageUrls: string[] }

function decodeXml(s: string) {
  return s
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

async function extractPptxSlides(blob: Blob): Promise<{ slides: SlideData[]; revoke: () => void }> {
  const zip = await JSZip.loadAsync(blob)
  const objectUrls: string[] = []
  const mediaMap: Record<string, string> = {}
  const mediaFiles = Object.keys(zip.files).filter(p => /^ppt\/media\//i.test(p) && !zip.files[p].dir)
  for (const path of mediaFiles) {
    try {
      const data = await zip.files[path].async('blob')
      const name = path.split('/').pop() || path
      const url = URL.createObjectURL(data)
      objectUrls.push(url)
      mediaMap[name.toLowerCase()] = url
      mediaMap[path.toLowerCase()] = url
    } catch { /* skip */ }
  }
  const slideFiles = Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/i)?.[1] || '0', 10)
      const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || '0', 10)
      return na - nb
    })
  const slides: SlideData[] = []
  for (let i = 0; i < slideFiles.length; i++) {
    const slidePath = slideFiles[i]
    const xml = await zip.files[slidePath].async('text')
    const paragraphs: string[] = []
    const paraBlocks = xml.split(/<\/a:p>/i)
    for (const block of paraBlocks) {
      const texts = [...block.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi)].map(m => decodeXml(m[1]))
      const joined = texts.join('').trim()
      if (joined) paragraphs.push(joined)
    }
    const imageUrls: string[] = []
    const slideNum = slidePath.match(/slide(\d+)/i)?.[1]
    if (slideNum) {
      const relPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`
      if (zip.files[relPath]) {
        try {
          const relXml = await zip.files[relPath].async('text')
          const targets = [...relXml.matchAll(/Target="([^"]+)"/gi)].map(m => m[1])
          for (const t of targets) {
            const base = t.split('/').pop()?.toLowerCase() || ''
            const key = t.replace(/^\.\.\//, 'ppt/').toLowerCase()
            const url = mediaMap[base] || mediaMap[key]
            if (url && !imageUrls.includes(url)) imageUrls.push(url)
          }
        } catch { /* skip */ }
      }
    }
    slides.push({ title: paragraphs[0] || `Diapositiva ${i + 1}`, paragraphs, imageUrls })
  }
  const allMedia = Object.values(mediaMap).filter((v, i, a) => a.indexOf(v) === i)
  if (allMedia.length && slides.every(s => s.imageUrls.length === 0)) {
    slides.forEach((s, i) => { if (allMedia[i]) s.imageUrls = [allMedia[i]] })
  }
  return { slides, revoke: () => objectUrls.forEach(u => URL.revokeObjectURL(u)) }
}

type Props = { file: FileItem; onClose: () => void; onUpdated: () => void }

export default function PptxEditor({ file, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [slides, setSlides] = useState<SlideData[]>([])
  const [idx, setIdx] = useState(0)
  const [present, setPresent] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [revoke, setRevoke] = useState<(() => void) | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const full = await db.getFile(file.id)
        if (!full?.blob) { setError('Sin contenido'); setLoading(false); return }
        const result = await extractPptxSlides(full.blob)
        if (!active) { result.revoke(); return }
        setSlides(result.slides)
        setRevoke(() => result.revoke)
        if (result.slides.length === 0) setError('No se encontraron diapositivas')
      } catch (e) {
        setError(String(e))
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [file.id])

  useEffect(() => () => { revoke?.() }, [revoke])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (present) setPresent(false); else onClose() }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setIdx(i => Math.min(slides.length - 1, i + 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length, present, onClose])

  const slide = slides[idx]

  function updateParagraph(pi: number, text: string) {
    setSlides(prev => prev.map((s, si) => {
      if (si !== idx) return s
      const paragraphs = [...s.paragraphs]
      paragraphs[pi] = text
      return { ...s, paragraphs, title: pi === 0 ? text || s.title : s.title }
    }))
    setDirty(true)
  }

  function addParagraph() {
    setSlides(prev => prev.map((s, si) => si === idx ? { ...s, paragraphs: [...s.paragraphs, 'Nuevo texto'] } : s))
    setDirty(true)
  }

  function addSlide() {
    setSlides(prev => [...prev, { title: 'Nueva diapositiva', paragraphs: ['Titulo', 'Contenido'], imageUrls: [] }])
    setIdx(slides.length)
    setDirty(true)
  }

  function deleteSlide() {
    if (slides.length <= 1) return
    if (!confirm('Eliminar esta diapositiva?')) return
    setSlides(prev => prev.filter((_, i) => i !== idx))
    setIdx(i => Math.max(0, i - 1))
    setDirty(true)
  }

  async function downloadOriginal() {
    const full = await db.getFile(file.id)
    if (!full?.blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(full.blob)
    a.download = full.name
    a.click()
  }

  function exec(cmd: string) {
    document.execCommand(cmd, false)
    setDirty(true)
  }

  if (present && slide) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#111] flex flex-col text-white">
        <div className="flex-1 flex items-center justify-center p-10 overflow-auto">
          <div className="max-w-5xl w-full text-center space-y-6">
            {slide.imageUrls.map((src, i) => (
              <img key={i} src={src} alt="" className="mx-auto max-h-[45vh] object-contain rounded shadow-2xl" />
            ))}
            {slide.paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-4xl font-semibold' : 'text-xl text-white/90'}>{p}</p>
            ))}
            {slide.paragraphs.length === 0 && slide.imageUrls.length === 0 && (
              <p className="text-white/50">(Diapositiva vacia)</p>
            )}
          </div>
        </div>
        <div className="h-12 flex items-center justify-center gap-4 bg-black/40">
          <button type="button" disabled={idx === 0} onClick={() => setIdx(i => i - 1)} className="px-4 py-1.5 rounded-full bg-white/10 disabled:opacity-30">Anterior</button>
          <span className="text-sm text-white/70">{idx + 1} / {slides.length}</span>
          <button type="button" disabled={idx >= slides.length - 1} onClick={() => setIdx(i => i + 1)} className="px-4 py-1.5 rounded-full bg-white/10 disabled:opacity-30">Siguiente</button>
          <button type="button" onClick={() => setPresent(false)} className="px-4 py-1.5 rounded-full bg-white/10 flex items-center gap-1"><Minimize2 size={14} /> Salir</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f3f3]">
      <div className="h-12 bg-white border-b border-[#e0e0e0] flex items-center px-3 gap-2 shrink-0">
        <div className="w-8 h-8 rounded bg-[#c43e1c] text-white flex items-center justify-center text-xs font-bold shadow-sm">P</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#201f1e] truncate">{file.name}{dirty ? ' •' : ''}</div>
          <div className="text-[11px] text-[#605e5c]">Capacitaciones · Editor de presentacion</div>
        </div>
        <button type="button" onClick={() => setPresent(true)} className="h-8 px-3 rounded text-sm text-[#444] hover:bg-[#e8e8e8] flex items-center gap-1.5">
          <Maximize2 size={14} /> Presentar
        </button>
        <button type="button" onClick={downloadOriginal} className="h-8 px-3 rounded text-sm text-[#444] hover:bg-[#e8e8e8] flex items-center gap-1.5">
          <Download size={14} /> Descargar
        </button>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded flex items-center justify-center hover:bg-[#e8e8e8]">
          <X size={16} />
        </button>
      </div>

      <div className="bg-white border-b border-[#e0e0e0] shrink-0">
        <div className="flex px-3 gap-1 pt-1">
          <span className="px-4 py-1.5 text-sm text-[#c43e1c] font-medium border border-b-0 border-[#e0e0e0] bg-[#f3f3f3] rounded-t">Inicio</span>
        </div>
        <div className="bg-[#f3f3f3] border-t border-[#e0e0e0] px-3 py-1.5 flex flex-wrap items-center gap-1">
          <button type="button" onClick={addSlide} className="h-8 px-3 rounded flex items-center gap-1.5 text-sm text-[#444] hover:bg-[#e8e8e8]"><Plus size={16} /> Nueva</button>
          <button type="button" onClick={deleteSlide} className="h-8 px-3 rounded flex items-center gap-1.5 text-sm text-[#444] hover:bg-[#e8e8e8]"><Trash2 size={16} /></button>
          <div className="w-px h-6 bg-[#dadce0] mx-1" />
          <button type="button" onClick={() => exec('bold')} className="h-8 w-8 rounded flex items-center justify-center hover:bg-[#e8e8e8]"><Bold size={16} /></button>
          <button type="button" onClick={() => exec('italic')} className="h-8 w-8 rounded flex items-center justify-center hover:bg-[#e8e8e8]"><Italic size={16} /></button>
          <button type="button" onClick={() => exec('justifyLeft')} className="h-8 w-8 rounded flex items-center justify-center hover:bg-[#e8e8e8]"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => exec('justifyCenter')} className="h-8 w-8 rounded flex items-center justify-center hover:bg-[#e8e8e8]"><AlignCenter size={16} /></button>
          <div className="w-px h-6 bg-[#dadce0] mx-1" />
          <button type="button" onClick={addParagraph} className="h-8 px-3 rounded flex items-center gap-1.5 text-sm text-[#444] hover:bg-[#e8e8e8]"><Type size={16} /> Texto</button>
          <span className="ml-auto text-[11px] text-[#605e5c] hidden sm:inline">Edicion de texto · Diseño completo: OnlyOffice (docker compose up -d)</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[140px] bg-[#f3f3f3] border-r border-[#e0e0e0] overflow-y-auto py-3 px-2 shrink-0">
          {loading && <div className="text-xs text-[#605e5c] p-2">Cargando...</div>}
          {slides.map((s, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className={'w-full mb-2 rounded-lg overflow-hidden border-2 text-left transition-all ' + (i === idx ? 'border-[#c43e1c] shadow-md' : 'border-transparent hover:border-[#dadce0]')}>
              <div className="bg-white aspect-video flex flex-col items-center justify-center p-1.5 relative">
                <span className="absolute top-0.5 left-1 text-[9px] text-[#605e5c]">{i + 1}</span>
                {s.imageUrls[0] ? (
                  <img src={s.imageUrls[0]} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-[8px] text-[#605e5c] text-center line-clamp-3 px-1">{s.paragraphs[0] || 'Vacia'}</div>
                )}
              </div>
            </button>
          ))}
          <button type="button" onClick={addSlide} className="w-full py-2 text-xs text-[#c43e1c] hover:bg-[#fce8e6] rounded-lg flex items-center justify-center gap-1">
            <Plus size={12} /> Agregar
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-[#e8e8e8]">
          {error && <div className="text-sm text-red-600 bg-white px-4 py-2 rounded shadow">{error}</div>}
          {loading && <div className="text-sm text-[#605e5c]">Cargando presentacion...</div>}
          {!loading && !error && slide && (
            <div className="w-full max-w-4xl aspect-video bg-white shadow-xl rounded-sm flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto p-10 flex flex-col">
                {slide.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-6 justify-center">
                    {slide.imageUrls.map((src, ii) => (
                      <img key={ii} src={src} alt="" className="max-h-[40%] max-w-full object-contain rounded" />
                    ))}
                  </div>
                )}
                <div className="space-y-3 flex-1">
                  {slide.paragraphs.length === 0 && slide.imageUrls.length === 0 && (
                    <p className="text-[#80868b] text-center mt-20">(Sin contenido — escribe o agrega texto)</p>
                  )}
                  {slide.paragraphs.map((p, pi) => (
                    <div key={pi} contentEditable suppressContentEditableWarning
                      onBlur={e => updateParagraph(pi, e.currentTarget.innerText)}
                      className={'outline-none rounded px-1 -mx-1 hover:bg-[#f8f9fa] focus:bg-[#f8f9fa] focus:ring-1 focus:ring-[#c43e1c]/30 ' + (pi === 0 ? 'text-2xl font-semibold text-[#201f1e]' : 'text-[15px] text-[#323130]')}>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-8 bg-white border-t border-[#e0e0e0] flex items-center px-3 text-[11px] text-[#605e5c] shrink-0 gap-4">
        <span>Diapositiva {idx + 1} de {slides.length || 0}</span>
        {dirty && <span className="text-[#c43e1c]">Cambios de texto (vista local)</span>}
        <span className="flex-1" />
        <button type="button" disabled={idx === 0} onClick={() => setIdx(i => i - 1)} className="px-2 hover:bg-[#f0f0f0] rounded disabled:opacity-30"><ChevronLeft size={14} /></button>
        <button type="button" disabled={idx >= slides.length - 1} onClick={() => setIdx(i => i + 1)} className="px-2 hover:bg-[#f0f0f0] rounded disabled:opacity-30"><ChevronRight size={14} /></button>
      </div>
    </div>
  )
}
