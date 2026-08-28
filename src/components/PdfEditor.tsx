import { useEffect, useState } from 'react'
import { Download, X, Type, Highlighter, Save, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { FileItem } from '../lib/db'
import * as db from '../lib/db'

type Annotation =
  | { id: string; kind: 'text'; page: number; x: number; y: number; text: string; size: number }
  | { id: string; kind: 'highlight'; page: number; x: number; y: number; w: number; h: number }

type Props = {
  file: FileItem
  onClose: () => void
  onUpdated: () => void
}

export default function PdfEditor({ file, onClose, onUpdated }: Props) {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [tool, setTool] = useState<'text' | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [textDraft, setTextDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let url: string | null = null
    ;(async () => {
      try {
        const full = await db.getFile(file.id)
        if (!full?.blob) {
          setError('Sin contenido')
          setLoading(false)
          return
        }
        const ab = new Uint8Array(await full.blob.arrayBuffer())
        setPdfBytes(ab)
        const doc = await PDFDocument.load(ab)
        setPageCount(doc.getPageCount())
        url = URL.createObjectURL(new Blob([ab], { type: 'application/pdf' }))
        setPreviewUrl(url + '#page=1')
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      if (url) URL.revokeObjectURL(url.split('#')[0])
    }
  }, [file.id])

  function goPage(n: number) {
    const p = Math.max(0, Math.min(pageCount - 1, n))
    setPage(p)
    if (previewUrl) {
      const base = previewUrl.split('#')[0]
      setPreviewUrl(base + '#page=' + (p + 1))
    }
  }

  function addTextAtCenter() {
    if (!textDraft.trim()) return alert('Escribe el texto a insertar')
    setAnnotations(a => [
      ...a,
      { id: crypto.randomUUID().slice(0, 8), kind: 'text', page, x: 50, y: 700, text: textDraft.trim(), size: 14 },
    ])
    setTextDraft('')
    setTool(null)
  }

  function addHighlight() {
    setAnnotations(a => [
      ...a,
      { id: crypto.randomUUID().slice(0, 8), kind: 'highlight', page, x: 50, y: 650, w: 200, h: 18 },
    ])
  }

  async function buildPdf(): Promise<Uint8Array> {
    if (!pdfBytes) throw new Error('PDF no cargado')
    const doc = await PDFDocument.load(pdfBytes)
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const pages = doc.getPages()
    for (const ann of annotations) {
      const pg = pages[ann.page]
      if (!pg) continue
      const { height } = pg.getSize()
      if (ann.kind === 'text') {
        pg.drawText(ann.text, {
          x: ann.x,
          y: Math.min(ann.y, height - 20),
          size: ann.size,
          font,
          color: rgb(0.1, 0.2, 0.55),
        })
      } else {
        pg.drawRectangle({
          x: ann.x,
          y: Math.min(ann.y, height - 30),
          width: ann.w,
          height: ann.h,
          color: rgb(1, 0.95, 0.3),
          opacity: 0.45,
          borderWidth: 0,
        })
      }
    }
    return doc.save()
  }

  async function saveToVault() {
    setSaving(true)
    try {
      const bytes = await buildPdf()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      await db.updateFile(file.id, { blob, size: blob.size, type: 'application/pdf' })
      setPdfBytes(bytes)
      setAnnotations([])
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url + '#page=' + (page + 1))
      onUpdated()
      alert('PDF guardado en CapaciHub')
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function download() {
    try {
      const bytes = annotations.length ? await buildPdf() : pdfBytes
      if (!bytes) return
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = file.name.replace(/\.pdf$/i, '') + (annotations.length ? '-editado.pdf' : '.pdf')
      a.click()
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#e8eaed] shrink-0 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#202124] truncate text-sm">{file.name}</div>
          <div className="text-xs text-[#80868b]">Editor PDF · Pagina {page + 1}/{pageCount}</div>
        </div>
        <button type="button" onClick={() => setTool(tool === 'text' ? null : 'text')}
          className={'h-9 px-3 rounded-full text-sm font-medium flex items-center gap-1.5 ' + (tool === 'text' ? 'bg-[#e8f0fe] text-[#1967d2]' : 'text-[#5f6368] hover:bg-[#f1f3f4]')}>
          <Type size={16} /> Texto
        </button>
        <button type="button" onClick={addHighlight}
          className="h-9 px-3 rounded-full text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] flex items-center gap-1.5">
          <Highlighter size={16} /> Resaltar
        </button>
        <button type="button" disabled={saving || !pdfBytes} onClick={saveToVault}
          className="h-9 px-4 rounded-full text-sm font-medium bg-[#1a73e8] text-white hover:bg-[#1765cc] flex items-center gap-1.5 disabled:opacity-50">
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={download} className="h-9 px-3 rounded-full text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] flex items-center gap-1.5">
          <Download size={16} /> Descargar
        </button>
        <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4]">
          <X size={18} />
        </button>
      </div>

      {tool === 'text' && (
        <div className="bg-[#e8f0fe] px-4 py-2 flex gap-2 items-center border-b border-[#dadce0]">
          <input autoFocus value={textDraft} onChange={e => setTextDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTextAtCenter()}
            placeholder="Texto a insertar en la pagina actual..."
            className="flex-1 h-9 px-3 rounded-lg border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8]" />
          <button type="button" onClick={addTextAtCenter} className="h-9 px-4 rounded-full bg-[#1a73e8] text-white text-sm font-medium">Insertar</button>
          <button type="button" onClick={() => setTool(null)} className="h-9 px-3 rounded-full text-sm text-[#5f6368]">Cancelar</button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 bg-[#525659] flex flex-col">
          <div className="flex items-center justify-center gap-3 py-2 bg-[#323639] text-white text-sm">
            <button type="button" disabled={page === 0} onClick={() => goPage(page - 1)} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-40"><ChevronLeft size={18} /></button>
            <span>{page + 1} / {pageCount}</span>
            <button type="button" disabled={page >= pageCount - 1} onClick={() => goPage(page + 1)} className="p-1.5 rounded hover:bg-white/10 disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
          <div className="flex-1 overflow-auto flex justify-center p-4">
            {loading && <div className="text-white/80 text-sm">Cargando PDF...</div>}
            {error && <div className="text-red-300 text-sm bg-black/40 px-4 py-2 rounded">{error}</div>}
            {!loading && previewUrl && (
              <iframe title="pdf" src={previewUrl} className="w-full max-w-3xl h-full bg-white rounded shadow-lg" />
            )}
          </div>
        </div>

        <aside className="w-64 bg-white border-l border-[#e8eaed] flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-[#e8eaed] text-xs font-medium uppercase tracking-wider text-[#5f6368]">
            Anotaciones ({annotations.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {annotations.length === 0 && (
              <p className="text-xs text-[#80868b] p-3 leading-relaxed">
                Usa <strong>Texto</strong> o <strong>Resaltar</strong>, luego <strong>Guardar</strong> para aplicar al PDF en CapaciHub.
              </p>
            )}
            {annotations.map(a => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[#f8f9fa] text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#80868b">Pag. {a.page + 1} · {a.kind === 'text' ? 'Texto' : 'Resaltado'}</div>
                  <div className="truncate text-[#202124]">{a.kind === 'text' ? a.text : 'Marcador amarillo'}</div>
                </div>
                <button type="button" onClick={() => setAnnotations(list => list.filter(x => x.id !== a.id))} className="p-1 text-[#80868b] hover:text-[#d93025]">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}
