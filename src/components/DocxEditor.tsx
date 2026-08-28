import { useEffect, useRef, useState } from 'react'
import {
  Download, X, Save, Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Type, Highlighter,
  Undo2, Redo2, Strikethrough, Indent, Outdent, Image as ImageIcon,
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
  const [tab, setTab] = useState<'inicio' | 'insertar'>('inicio')
  const [zoom, setZoom] = useState(100)

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
          let html = await full.blob.text()
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
          if (bodyMatch) html = bodyMatch[1]
          if (editorRef.current) editorRef.current.innerHTML = html || '<p><br></p>'
        } else {
          const ab = await full.blob.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer: ab })
          if (editorRef.current) {
            editorRef.current.innerHTML = result.value || '<p><br></p>'
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

  function insertImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const f = input.files?.[0]
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => {
        exec('insertImage', String(reader.result))
      }
      reader.readAsDataURL(f)
    }
    input.click()
  }

  const btn = 'h-8 w-8 rounded flex items-center justify-center text-[#444] hover:bg-[#e8e8e8] transition-colors'
  const sep = 'w-px h-6 bg-[#dadce0] mx-1'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f3f3f3]">
      <div className="h-12 bg-white border-b border-[#e0e0e0] flex items-center px-3 gap-2 shrink-0">
        <div className="w-8 h-8 rounded bg-[#185abd] text-white flex items-center justify-center text-xs font-bold shadow-sm">W</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#201f1e] truncate">
            {file.name}{dirty ? ' •' : ''}
          </div>
          <div className="text-[11px] text-[#605e5c]">CapaciHub · Editor de documento</div>
        </div>
        <button type="button" disabled={saving} onClick={save}
          className="h-8 px-4 rounded text-sm font-medium bg-[#185abd] text-white hover:bg-[#0f4a9e] disabled:opacity-50 flex items-center gap-1.5 shadow-sm">
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

      <div className="bg-white border-b border-[#e0e0e0] shrink-0">
        <div className="flex px-3 gap-1 pt-1">
          {(['inicio', 'insertar'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                'px-4 py-1.5 text-sm capitalize rounded-t ' +
                (tab === t ? 'bg-[#f3f3f3] text-[#185abd] font-medium border border-b-0 border-[#e0e0e0]' : 'text-[#444] hover:bg-[#f5f5f5]')
              }
            >
              {t === 'inicio' ? 'Inicio' : 'Insertar'}
            </button>
          ))}
        </div>
        <div className="bg-[#f3f3f3] border-t border-[#e0e0e0] px-3 py-1.5 flex flex-wrap items-center gap-0.5">
          {tab === 'inicio' && (
            <>
              <button type="button" className={btn} title="Deshacer" onClick={() => exec('undo')}><Undo2 size={16} /></button>
              <button type="button" className={btn} title="Rehacer" onClick={() => exec('redo')}><Redo2 size={16} /></button>
              <div className={sep} />
              <button type="button" className={btn} title="Negrita" onClick={() => exec('bold')}><Bold size={16} /></button>
              <button type="button" className={btn} title="Cursiva" onClick={() => exec('italic')}><Italic size={16} /></button>
              <button type="button" className={btn} title="Subrayado" onClick={() => exec('underline')}><Underline size={16} /></button>
              <button type="button" className={btn} title="Tachado" onClick={() => exec('strikeThrough')}><Strikethrough size={16} /></button>
              <div className={sep} />
              <button type="button" className={btn} title="Titulo" onClick={() => exec('formatBlock', 'h1')}><Heading1 size={16} /></button>
              <button type="button" className={btn} title="Subtitulo" onClick={() => exec('formatBlock', 'h2')}><Heading2 size={16} /></button>
              <button type="button" className={btn} title="Parrafo" onClick={() => exec('formatBlock', 'p')}><Type size={16} /></button>
              <div className={sep} />
              <button type="button" className={btn} title="Lista" onClick={() => exec('insertUnorderedList')}><List size={16} /></button>
              <button type="button" className={btn} title="Numerada" onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></button>
              <button type="button" className={btn} title="Aumentar sangria" onClick={() => exec('indent')}><Indent size={16} /></button>
              <button type="button" className={btn} title="Reducir sangria" onClick={() => exec('outdent')}><Outdent size={16} /></button>
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
              <select className="h-8 text-sm border border-[#dadce0] rounded px-2 bg-white ml-1" defaultValue="Calibri"
                onChange={e => exec('fontName', e.target.value)} title="Fuente">
                <option>Calibri</option>
                <option>Arial</option>
                <option>Times New Roman</option>
                <option>Georgia</option>
                <option>Verdana</option>
                <option>Roboto</option>
              </select>
            </>
          )}
          {tab === 'insertar' && (
            <>
              <button type="button" className={btn + ' w-auto px-3 gap-1.5'} title="Imagen" onClick={insertImage}>
                <ImageIcon size={16} /> Imagen
              </button>
              <button type="button" className={btn + ' w-auto px-3 gap-1.5'} title="Enlace" onClick={() => {
                const url = prompt('URL del enlace:')
                if (url) exec('createLink', url)
              }}>
                Enlace
              </button>
              <button type="button" className={btn + ' w-auto px-3 gap-1.5'} title="Linea horizontal" onClick={() => exec('insertHorizontalRule')}>
                Linea
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
        {loading && <div className="text-sm text-[#605e5c]">Cargando documento...</div>}
        {error && <div className="text-sm text-red-600 bg-white px-4 py-2 rounded shadow">{error}</div>}
        <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }} className="transition-transform">
          <div
            ref={editorRef}
            contentEditable={!loading}
            suppressContentEditableWarning
            onInput={() => setDirty(true)}
            className="w-[816px] min-h-[1056px] bg-white shadow-lg rounded-sm outline-none px-[72px] py-[72px] text-[15px] leading-relaxed text-[#201f1e]"
            style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
          />
        </div>
      </div>

      <div className="h-8 bg-white border-t border-[#e0e0e0] flex items-center px-3 text-[11px] text-[#605e5c] shrink-0 gap-4">
        <span>Listo</span>
        <span className="flex-1" />
        <button type="button" className="px-2 hover:bg-[#f0f0f0] rounded" onClick={() => setZoom(z => Math.max(50, z - 10))}>−</button>
        <span className="w-12 text-center">{zoom}%</span>
        <button type="button" className="px-2 hover:bg-[#f0f0f0] rounded" onClick={() => setZoom(z => Math.min(200, z + 10))}>+</button>
        <button type="button" className="px-2 hover:bg-[#f0f0f0] rounded" onClick={() => setZoom(100)}>100%</button>
      </div>
    </div>
  )
}
