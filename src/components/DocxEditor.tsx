import { useEffect, useRef, useState } from 'react'
import {
  Download, X, Save, Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Type, Highlighter
} from 'lucide-react'
import mammoth from 'mammoth'
import type { FileItem } from '../lib/db'
import * as db from '../lib/db'

type Props = {
  file: FileItem
  onClose: () => void
  onUpdated: () => void
}

export default function DocxEditor({ file, onClose, onUpdated }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const full = await db.getFile(file.id)
        if (!full?.blob) {
          setError('Sin contenido')
          setLoading(false)
          return
        }
        const name = full.name.toLowerCase()
        if (name.endsWith('.html') || name.endsWith('.htm') || full.type === 'text/html') {
          const html = await full.blob.text()
          if (editorRef.current) editorRef.current.innerHTML = html
        } else {
          const ab = await full.blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer: ab })
          if (editorRef.current) {
            editorRef.current.innerHTML = result.value || '<p></p>'
          }
        }
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [file.id])

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    setDirty(true)
  }

  async function save() {
    if (!editorRef.current) return
    setSaving(true)
    try {
      const html = editorRef.current.innerHTML
      const blob = new Blob(
        [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${file.name}</title></head><body>${html}</body></html>`],
        { type: 'text/html' }
      )
      const newName = file.name.replace(/\.docx?$/i, '') + '.html'
      await db.updateFile(file.id, {
        blob,
        size: blob.size,
        type: 'text/html',
        name: newName,
      })
      setDirty(false)
      onUpdated()
      alert('Documento guardado. Puedes seguir editandolo aqui.')
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function downloadHtml() {
    if (!editorRef.current) return
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${file.name}</title>
<style>body{font-family:Calibri,Arial,sans-serif;max-width:800px;margin:40px auto;line-height:1.5;color:#222}h1{font-size:22pt}h2{font-size:16pt}</style>
</head><body>${editorRef.current.innerHTML}</body></html>`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    a.download = file.name.replace(/\.docx?$/i, '') + '.html'
    a.click()
  }

  async function downloadOriginal() {
    const full = await db.getFile(file.id)
    if (!full?.blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(full.blob)
    a.download = full.name
    a.click()
  }

  const btn = 'h-8 w-8 rounded flex items-center justify-center text-[#444] hover:bg-[#e8e8e8]'
  const sep = 'w-px h-6 bg-[#dadce0] mx-1'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f3f3]">
      <div className="h-12 bg-white border-b border-[#e0e0e0] flex items-center px-3 gap-2 shrink-0">
        <div className="w-8 h-8 rounded bg-[#2b579a] text-white flex items-center justify-center text-xs font-bold">W</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#201f1e] truncate">{file.name}{dirty ? ' •' : ''}</div>
          <div className="text-[11px] text-[#605e5c]">Editor de documento · estilo Word Online</div>
        </div>
        <button type="button" disabled={saving} onClick={save}
          className="h-8 px-4 rounded text-sm font-medium bg-[#2b579a] text-white hover:bg-[#1e3f6f] disabled:opacity-50 flex items-center gap-1.5">
          <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={downloadHtml} className="h-8 px-3 rounded text-sm text-[#444] hover:bg-[#e8e8e8] flex items-center gap-1">
          <Download size={14} /> HTML
        </button>
        <button type="button" onClick={downloadOriginal} className="h-8 px-3 rounded text-sm text-[#444] hover:bg-[#e8e8e8] flex items-center gap-1">
          <Download size={14} /> Original
        </button>
        <button type="button" onClick={onClose} className="h-8 w-8 rounded flex items-center justify-center hover:bg-[#e8e8e8]">
          <X size={16} />
        </button>
      </div>

      <div className="bg-white border-b border-[#e0e0e0] px-3 py-1.5 flex flex-wrap items-center gap-0.5 shrink-0">
        <button type="button" className={btn} title="Negrita" onClick={() => exec('bold')}><Bold size={16} /></button>
        <button type="button" className={btn} title="Cursiva" onClick={() => exec('italic')}><Italic size={16} /></button>
        <button type="button" className={btn} title="Subrayado" onClick={() => exec('underline')}><Underline size={16} /></button>
        <div className={sep} />
        <button type="button" className={btn} title="Titulo" onClick={() => exec('formatBlock', 'h1')}><Heading1 size={16} /></button>
        <button type="button" className={btn} title="Subtitulo" onClick={() => exec('formatBlock', 'h2')}><Heading2 size={16} /></button>
        <button type="button" className={btn} title="Parrafo" onClick={() => exec('formatBlock', 'p')}><Type size={16} /></button>
        <div className={sep} />
        <button type="button" className={btn} title="Lista" onClick={() => exec('insertUnorderedList')}><List size={16} /></button>
        <button type="button" className={btn} title="Numerada" onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></button>
        <div className={sep} />
        <button type="button" className={btn} title="Izquierda" onClick={() => exec('justifyLeft')}><AlignLeft size={16} /></button>
        <button type="button" className={btn} title="Centro" onClick={() => exec('justifyCenter')}><AlignCenter size={16} /></button>
        <button type="button" className={btn} title="Derecha" onClick={() => exec('justifyRight')}><AlignRight size={16} /></button>
        <div className={sep} />
        <button type="button" className={btn} title="Resaltar" onClick={() => exec('hiliteColor', '#fff59d')}><Highlighter size={16} /></button>
        <input type="color" title="Color de texto" defaultValue="#202124"
          className="h-8 w-8 rounded cursor-pointer border-0 bg-transparent"
          onChange={e => exec('foreColor', e.target.value)} />
        <div className={sep} />
        <select className="h-8 text-sm border border-[#dadce0] rounded px-2 bg-white" defaultValue="3"
          onChange={e => exec('fontSize', e.target.value)} title="Tamano">
          <option value="1">Pequeno</option>
          <option value="2">Normal-</option>
          <option value="3">Normal</option>
          <option value="4">Mediano</option>
          <option value="5">Grande</option>
          <option value="6">Muy grande</option>
        </select>
        <select className="h-8 text-sm border border-[#dadce0] rounded px-2 bg-white ml-1" defaultValue="Arial"
          onChange={e => exec('fontName', e.target.value)} title="Fuente">
          <option>Arial</option>
          <option>Calibri</option>
          <option>Times New Roman</option>
          <option>Georgia</option>
          <option>Verdana</option>
          <option>Roboto</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
        {loading && <div className="text-sm text-[#605e5c]">Cargando documento...</div>}
        {error && <div className="text-sm text-red-600 bg-white px-4 py-2 rounded shadow">{error}</div>}
        <div
          ref={editorRef}
          contentEditable={!loading}
          suppressContentEditableWarning
          onInput={() => setDirty(true)}
          className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-lg rounded-sm outline-none px-[72px] py-[72px] text-[15px] leading-relaxed text-[#201f1e]"
          style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
        />
      </div>

      <div className="h-7 bg-white border-t border-[#e0e0e0] flex items-center px-3 text-[11px] text-[#605e5c] shrink-0">
        Edicion local CapaciHub · Guardar para conservar cambios
      </div>
    </div>
  )
}
