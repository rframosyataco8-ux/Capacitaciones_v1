import { useEffect, useState } from 'react'
import { Download, X, Save, Pencil, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import type { FileItem } from '../lib/db'
import * as db from '../lib/db'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import PdfEditor from './PdfEditor'
import DocxEditor from './DocxEditor'

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
    const pBlocks = xml.split(/<\/a:p>/i)
    for (const block of pBlocks) {
      const texts: string[] = []
      const re = /<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/gi
      let m
      while ((m = re.exec(block)) !== null) texts.push(decodeXml(m[1]))
      const line = texts.join('').replace(/\s+/g, ' ').trim()
      if (line) paragraphs.push(line)
    }
    const imageUrls: string[] = []
    const slideNum = slidePath.match(/slide(\d+)/i)?.[1]
    if (slideNum) {
      const relPath = 'ppt/slides/_rels/slide' + slideNum + '.xml.rels'
      const relKey = Object.keys(zip.files).find(k => k.toLowerCase() === relPath.toLowerCase())
      const relFile = relKey ? zip.files[relKey] : undefined
      if (relFile) {
        try {
          const relXml = await relFile.async('text')
          const targetRe = /Target="([^"]+)"/gi
          let tm
          while ((tm = targetRe.exec(relXml)) !== null) {
            const target = tm[1].replace(/^\.\.\//, 'ppt/')
            const base = target.split('/').pop()?.toLowerCase() || ''
            const u = mediaMap[base] || mediaMap[target.toLowerCase()]
            if (u && !imageUrls.includes(u)) imageUrls.push(u)
          }
        } catch { /* skip */ }
      }
    }
    slides.push({
      title: 'Diapositiva ' + (i + 1),
      paragraphs: paragraphs.length ? paragraphs : ['(Sin texto en esta diapositiva)'],
      imageUrls,
    })
  }
  const allMedia = Object.values(mediaMap).filter((v, i, a) => a.indexOf(v) === i)
  if (allMedia.length && slides.every(s => s.imageUrls.length === 0)) {
    slides.forEach((s, i) => { if (allMedia[i]) s.imageUrls = [allMedia[i]] })
  }
  return { slides, revoke: () => objectUrls.forEach(u => URL.revokeObjectURL(u)) }
}

type Props = { file: FileItem; onClose: () => void; onUpdated: () => void }

export default function FilePreview({ file, onClose, onUpdated }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [html, setHtml] = useState('')
  const [tableHtml, setTableHtml] = useState('')
  const [slides, setSlides] = useState<SlideData[]>([])
  const [slideIdx, setSlideIdx] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [showPdfEditor, setShowPdfEditor] = useState(false)
  const [showDocxEditor, setShowDocxEditor] = useState(false)
  const [excelData, setExcelData] = useState<string[][]>([])
  const [excelEditing, setExcelEditing] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let revokeSlides: (() => void) | null = null
    setError(''); setText(''); setHtml(''); setTableHtml(''); setSlides([]); setSlideIdx(0); setEditing(false); setExcelEditing(false); setLoading(true)
    ;(async () => {
      try {
        const full = await db.getFile(file.id)
        if (!full?.blob) { setError('No hay contenido guardado para este archivo.'); setLoading(false); return }
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
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][]
          setExcelData(rows.map(r => r.map(c => String(c ?? ''))))
        } else if (isPptx(full.name)) {
          const result = await extractPptxSlides(full.blob)
          revokeSlides = result.revoke
          setSlides(result.slides)
          if (result.slides.length === 0) setError('No se encontraron diapositivas en este PPTX.')
        }
      } catch (e) {
        setError('Error al abrir: ' + String(e))
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      if (revokeSlides) revokeSlides()
    }
  }, [file.id])

  useEffect(() => {
    if (!slides.length) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setSlideIdx(i => Math.min(slides.length - 1, i + 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setSlideIdx(i => Math.max(0, i - 1))
      if (e.key === 'Escape' && fullscreen) setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length, fullscreen])

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

  async function saveExcel() {
    setSaving(true)
    try {
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Hoja1')
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([new Uint8Array(out as ArrayBuffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      await db.updateFile(file.id, { blob, size: blob.size })
      setExcelEditing(false)
      onUpdated()
      alert('Excel guardado')
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
  const slide = slides[slideIdx]
  const isHtml = file.name.toLowerCase().endsWith('.html') || file.type === 'text/html'

  if (showPdfEditor && pdf) {
    return <PdfEditor file={file} onClose={() => setShowPdfEditor(false)} onUpdated={onUpdated} />
  }
  if (showDocxEditor && (docx || isHtml)) {
    return <DocxEditor file={file} onClose={() => setShowDocxEditor(false)} onUpdated={onUpdated} />
  }

  return (
    <div className={'fixed inset-0 z-50 flex flex-col ' + (fullscreen ? 'bg-[#1a1a1a]' : 'bg-black/50 backdrop-blur-sm')}>
      {!fullscreen && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8eaed] shrink-0">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[#202124] truncate">{file.name}</div>
            <div className="text-xs text-[#80868b]">
              {file.folder} · {(file.size / 1024).toFixed(1)} KB
              {pptx && slides.length > 0 ? ' · ' + slides.length + ' diapositivas' : ''}
            </div>
          </div>
          {pdf && (
            <button type="button" onClick={() => setShowPdfEditor(true)} className="h-9 px-4 rounded-full text-sm font-medium text-[#1967d2] hover:bg-[#e8f0fe] flex items-center gap-1.5">
              <Pencil size={16} /> Editar PDF
            </button>
          )}
          {(docx || isHtml) && (
            <button type="button" onClick={() => setShowDocxEditor(true)} className="h-9 px-4 rounded-full text-sm font-medium text-[#1967d2] hover:bg-[#e8f0fe] flex items-center gap-1.5">
              <Pencil size={16} /> Editar Word
            </button>
          )}
          {xlsx && !excelEditing && (
            <button type="button" onClick={() => setExcelEditing(true)} className="h-9 px-4 rounded-full text-sm font-medium text-[#1967d2] hover:bg-[#e8f0fe] flex items-center gap-1.5">
              <Pencil size={16} /> Editar Excel
            </button>
          )}
          {xlsx && excelEditing && (
            <button type="button" disabled={saving} onClick={saveExcel} className="h-9 px-4 rounded-full text-sm font-medium bg-[#1a73e8] text-white hover:bg-[#1765cc] flex items-center gap-1.5">
              <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Excel'}
            </button>
          )}
          {pptx && slides.length > 0 && (
            <button type="button" onClick={() => setFullscreen(true)} className="h-9 px-4 rounded-full text-sm font-medium text-[#5f6368] hover:bg-[#f1f3f4] flex items-center gap-1.5">
              <Maximize2 size={16} /> Presentar
            </button>
          )}
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
      )}

      <div className={'flex-1 overflow-auto flex items-center justify-center p-4 ' + (fullscreen ? 'bg-[#111]' : 'bg-[#f1f3f4]')}>
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
            {excelEditing ? (
              <table className="border-collapse w-full text-sm">
                <tbody>
                  {excelData.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="border border-[#dadce0] p-0">
                          <input value={cell} onChange={e => {
                            const next = excelData.map(r => [...r])
                            next[ri][ci] = e.target.value
                            setExcelData(next)
                          }} className="w-full min-w-[80px] px-2 py-1.5 outline-none focus:bg-[#e8f0fe] text-[#202124]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
                <style>{`#sheet-preview{border-collapse:collapse;width:100%;font-size:13px}#sheet-preview td,#sheet-preview th{border:1px solid #dadce0;padding:6px 10px;text-align:left}#sheet-preview tr:first-child td{font-weight:500;background:#f8f9fa}`}</style>
                <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
              </>
            )}
          </div>
        )}
        {!loading && !error && pptx && slide && (
          <div className={'w-full flex flex-col items-center gap-4 ' + (fullscreen ? 'h-full justify-center' : 'max-w-4xl')}>
            {fullscreen && (
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <span className="text-white/70 text-sm px-3 py-1.5">{slideIdx + 1} / {slides.length}</span>
                <button type="button" onClick={() => setFullscreen(false)} className="h-9 px-4 rounded-full bg-white/10 text-white text-sm hover:bg-white/20">Salir</button>
                <button type="button" onClick={onClose} className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center"><X size={16} /></button>
              </div>
            )}
            <div className={'w-full overflow-hidden flex flex-col ' + (fullscreen ? 'max-w-5xl aspect-video bg-gradient-to-br from-[#1e3a5f] to-[#0d1b2a] rounded-2xl shadow-2xl' : 'bg-white rounded-2xl shadow-lg border border-[#e8eaed] min-h-[380px]')}>
              {!fullscreen && (
                <div className="px-6 py-3 border-b border-[#e8eaed] flex items-center justify-between bg-[#f8f9fa]">
                  <span className="font-medium text-[#202124] text-sm">{slide.title}</span>
                  <span className="text-xs text-[#80868b]">{slideIdx + 1} / {slides.length}</span>
                </div>
              )}
              <div className={'flex-1 p-8 overflow-auto ' + (fullscreen ? 'text-white' : 'text-[#202124]')}>
                {slide.imageUrls.length > 0 && (
                  <div className={'flex flex-wrap gap-3 mb-6 ' + (slide.imageUrls.length === 1 ? 'justify-center' : '')}>
                    {slide.imageUrls.map((src, ii) => (
                      <img key={ii} src={src} alt="" className={'rounded-lg object-contain ' + (fullscreen ? 'max-h-[40vh] max-w-full shadow-lg' : 'max-h-48 max-w-full border border-[#e8eaed]')} />
                    ))}
                  </div>
                )}
                <div className={'space-y-3 ' + (fullscreen ? 'text-center max-w-3xl mx-auto' : '')}>
                  {slide.paragraphs.map((p, pi) => (
                    <p key={pi} className={(pi === 0 ? 'text-xl font-medium leading-snug ' : 'text-[15px] leading-relaxed ') + (fullscreen ? (pi === 0 ? 'text-white text-2xl mb-4' : 'text-white/90') : '')}>{p}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button type="button" disabled={slideIdx === 0} onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                className={'h-10 px-4 rounded-full text-sm font-medium disabled:opacity-40 flex items-center gap-1 ' + (fullscreen ? 'bg-white/10 text-white hover:bg-white/20' : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]')}>
                <ChevronLeft size={16} /> Anterior
              </button>
              <button type="button" disabled={slideIdx >= slides.length - 1} onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))}
                className={'h-10 px-4 rounded-full text-sm font-medium disabled:opacity-40 flex items-center gap-1 ' + (fullscreen ? 'bg-white/10 text-white hover:bg-white/20' : 'border border-[#dadce0] bg-white text-[#5f6368] hover:bg-[#f1f3f4]')}>
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
        {!loading && !error && officeLegacy && (
          <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
            <p className="text-[#202124] font-medium mb-2">{file.name}</p>
            <button type="button" onClick={download} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium">Descargar</button>
          </div>
        )}
        {!loading && !error && !img && !pdf && !txt && !docx && !xlsx && !pptx && !officeLegacy && url && (
          <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
            <p className="text-[#202124] font-medium mb-2">{file.name}</p>
            <button type="button" onClick={download} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium">Descargar</button>
          </div>
        )}
      </div>
    </div>
  )
}
