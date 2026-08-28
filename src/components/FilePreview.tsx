import { useEffect, useState } from 'react'
import { Download, X, Save, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import type { FileItem } from '../lib/db'
import * as db from '../lib/db'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

function isImage(name: string, type: string) {
  return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)
}
function isPdf(name: string, type: string) {
  return type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')
}
function isText(name: string, type: string) {
  if (type.startsWith('text/')) return true
  return /\.(txt|md|markdown|csv|json|log|xml|html|css|js|ts|tsx|jsx)$/i.test(name)
}
function isDocx(name: string) {
  return /\.docx$/i.test(name)
}
function isXlsx(name: string) {
  return /\.xlsx?$/i.test(name)
}
function isPptx(name: string) {
  return /\.pptx$/i.test(name)
}

async function extractPptxSlides(blob: Blob): Promise<{ title: string; text: string }[]> {
  const zip = await JSZip.loadAsync(blob)
  const slideFiles = Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/i)?.[1] || '0', 10)
      const nb = parseInt(b.match(/slide(\d+)/i)?.[1] || '0', 10)
      return na - nb
    })

  const slides: { title: string; text: string }[] = []
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('text')
    const parts: string[] = []
    const re = /<a:t[^>]*>([^<]*)<\/a:t>/g
    let m
    while ((m = re.exec(xml)) !== null) {
      const t = m[1].trim()
      if (t) parts.push(t)
    }
    const lines: string[] = []
    for (const p of parts) {
      if (lines[lines.length - 1] !== p) lines.push(p)
    }
    slides.push({
      title: 'Diapositiva ' + (i + 1),
      text: lines.join('\n') || '(sin texto extraible)',
    })
  }
  return slides
}

type Props = {
  file: FileItem
  onClose: () => void
  onUpdated: () => void
}

export default function FilePreview({ file, onClose, onUpdated }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [html, setHtml] = useState('')
  const [tableHtml, setTableHtml] = useState('')
  const [slides, setSlides] = useState<{ title: string; text: string }[]>([])
  const [slideIdx, setSlideIdx] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let objectUrl: string | null = null
    setError('')
    setText('')
    setHtml('')
    setTableHtml('')
    setSlides([])
    setSlideIdx(0)
    setEditing(false)
    setLoading(true)
    ;(async () => {
      try {
        const full = await db.getFile(file.id)
        if (!full?.blob) {
          setError('No hay contenido guardado para este archivo.')
          setLoading(false)
          return
        }
        objectUrl = URL.createObjectURL(full.blob)
        setUrl(objectUrl)

        if (isText(full.name, full.type)) {
          setText(await full.blob.text())
        } else if (isDocx(full.name)) {
          const ab = await full.blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer: ab })
          setHtml(result.value || '<p>(documento vacio)</p>')
        } else if (isXlsx(full.name)) {
          const ab = await full.blob.arrayBuffer()
          const wb = XLSX.read(ab, { type: 'array' })
          const first = wb.SheetNames[0]
          const sheet = wb.Sheets[first]
          setTableHtml(XLSX.utils.sheet_to_html(sheet, { id: 'sheet-preview' }))
        } else if (isPptx(full.name)) {
          const s = await extractPptxSlides(full.blob)
          setSlides(s)
          if (s.length === 0) setError('No se encontraron diapositivas legibles en este PPTX.')
        }
      } catch (e) {
        setError('Error al abrir: ' + String(e))
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file.id])

  async function saveText() {
    setSaving(true)
    try {
      const blob = new Blob([text], { type: file.type || 'text/plain' })
      await db.updateFile(file.id, { blob, size: blob.size })
      setEditing(false)
      onUpdated()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function download() {
    const full = await db.getFile(file.id)
    if (!full?.blob) return
    const u = URL.createObjectURL(full.blob)
    const a = document.createElement('a')
    a.href = u
    a.download = full.name
    a.click()
    URL.revokeObjectURL(u)
  }

  const img = isImage(file.name, file.type)
  const pdf = isPdf(file.name, file.type)
  const txt = isText(file.name, file.type)
  const docx = isDocx(file.name)
  const xlsx = isXlsx(file.name)
  const pptx = isPptx(file.name)
  const officeLegacy = /\.(doc|ppt|xls)$/i.test(file.name) && !docx && !xlsx && !pptx

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8eaed] shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#202124] truncate">{file.name}</div>
          <div className="text-xs text-[#80868b]">
            {file.folder} · {(file.size / 1024).toFixed(1)} KB
            {pptx && slides.length > 0 ? ' · ' + slides.length + ' diapositivas' : ''}
          </div>
        </div>
        {txt && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="h-9 px-4 rounded-full text-sm font-medium text-[#1967d2] hover:bg-[#e8f0fe] flex items-center gap-1.5">
            <Pencil size={16} /> Editar
          </button>
        )}
        {txt && editing && (
          <button type="button" disabled={saving} onClick={saveText} className="h-9 px-4 rounded-full text-sm font-medium bg-[#1a73e8] text-white hover:bg-[#1765cc] flex items-center gap-1.5">
            <Save size={16} /> {saving ? 'Guardando...' : 'Guardar'}
          </button>
        )}
        <button type="button" onClick={download} className="h-9 px-4 rounded-full text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] flex items-center gap-1.5">
          <Download size={16} /> Descargar
        </button>
        <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-[#5f6368] hover:bg-[#f1f3f4]">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-[#f1f3f4] flex items-center justify-center p-4">
        {loading && <div className="text-[#5f6368] text-sm">Cargando vista previa...</div>}
        {!loading && error && <div className="text-[#d93025] text-sm bg-white px-6 py-4 rounded-xl shadow max-w-md">{error}</div>}

        {!loading && !error && img && url && (
          <img src={url} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white" />
        )}
        {!loading && !error && pdf && url && (
          <iframe title={file.name} src={url} className="w-full h-full max-w-5xl bg-white rounded-lg shadow-lg border border-[#dadce0]" />
        )}
        {!loading && !error && txt && (
          editing ? (
            <textarea value={text} onChange={e => setText(e.target.value)}
              className="w-full h-full max-w-4xl bg-white rounded-xl shadow border border-[#dadce0] p-6 font-mono text-sm text-[#202124] outline-none focus:border-[#1a73e8] resize-none" />
          ) : (
            <pre className="w-full h-full max-w-4xl bg-white rounded-xl shadow border border-[#dadce0] p-6 font-mono text-sm text-[#202124] overflow-auto whitespace-pre-wrap">{text || '(vacio)'}</pre>
          )
        )}

        {!loading && !error && docx && (
          <div className="w-full h-full max-w-4xl bg-white rounded-xl shadow border border-[#dadce0] p-8 overflow-auto text-[#202124] text-[15px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: html }} />
        )}

        {!loading && !error && xlsx && (
          <div className="w-full h-full max-w-5xl bg-white rounded-xl shadow border border-[#dadce0] p-4 overflow-auto">
            <style>{`#sheet-preview{border-collapse:collapse;width:100%;font-size:13px}#sheet-preview td,#sheet-preview th{border:1px solid #dadce0;padding:6px 10px;text-align:left}#sheet-preview tr:first-child td{font-weight:500;background:#f8f9fa}`}</style>
            <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
          </div>
        )}

        {!loading && !error && pptx && slides.length > 0 && (
          <div className="w-full max-w-3xl flex flex-col gap-4">
            <div className="bg-white rounded-xl shadow border border-[#dadce0] overflow-hidden min-h-[320px] flex flex-col">
              <div className="px-6 py-4 border-b border-[#e8eaed] flex items-center justify-between bg-[#f8f9fa]">
                <span className="font-medium text-[#202124]">{slides[slideIdx]?.title}</span>
                <span className="text-xs text-[#80868b]">{slideIdx + 1} / {slides.length}</span>
              </div>
              <div className="flex-1 p-8 text-[#202124] text-[15px] leading-relaxed whitespace-pre-wrap overflow-auto">
                {slides[slideIdx]?.text}
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" disabled={slideIdx === 0} onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                className="h-10 px-4 rounded-full border border-[#dadce0] bg-white text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 flex items-center gap-1">
                <ChevronLeft size={16} /> Anterior
              </button>
              <button type="button" disabled={slideIdx >= slides.length - 1} onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))}
                className="h-10 px-4 rounded-full border border-[#dadce0] bg-white text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] disabled:opacity-40 flex items-center gap-1">
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-center text-xs text-[#80868b]">
              Vista del texto de cada diapositiva. Para animaciones y diseno completo, descarga y abre en PowerPoint.
            </p>
          </div>
        )}

        {!loading && !error && officeLegacy && (
          <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-[#202124] font-medium mb-2">{file.name}</p>
            <p className="text-sm text-[#5f6368] mb-6">
              Formato antiguo (.ppt / .doc / .xls). Guardalo como .pptx, .docx o .xlsx para verlo aqui, o descargalo.
            </p>
            <button type="button" onClick={download} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Descargar archivo</button>
          </div>
        )}

        {!loading && !error && !img && !pdf && !txt && !docx && !xlsx && !pptx && !officeLegacy && url && (
          <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
            <div className="text-4xl mb-4">📎</div>
            <p className="text-[#202124] font-medium mb-2">{file.name}</p>
            <p className="text-sm text-[#5f6368] mb-6">Vista previa no disponible.</p>
            <button type="button" onClick={download} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Descargar</button>
          </div>
        )}
      </div>
    </div>
  )
}
