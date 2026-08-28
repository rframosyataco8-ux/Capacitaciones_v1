import { useEffect, useState } from 'react'
import { Download, X, Save, Pencil } from 'lucide-react'
import type { FileItem } from '../lib/db'
import * as db from '../lib/db'

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
function isOffice(name: string) {
  return /\.(docx?|xlsx?|pptx?)$/i.test(name)
}

type Props = {
  file: FileItem
  onClose: () => void
  onUpdated: () => void
}

export default function FilePreview({ file, onClose, onUpdated }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let objectUrl: string | null = null
    setError('')
    setText('')
    setEditing(false)
    ;(async () => {
      const full = await db.getFile(file.id)
      if (!full?.blob) {
        setError('No hay contenido guardado para este archivo.')
        return
      }
      objectUrl = URL.createObjectURL(full.blob)
      setUrl(objectUrl)
      if (isText(full.name, full.type)) {
        try {
          setText(await full.blob.text())
        } catch {
          setError('No se pudo leer el texto.')
        }
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
  const office = isOffice(file.name)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-[#e8eaed] shrink-0">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#202124] truncate">{file.name}</div>
          <div className="text-xs text-[#80868b]">
            {file.folder} · {(file.size / 1024).toFixed(1)} KB · {file.type || 'archivo'}
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
        {error && <div className="text-[#d93025] text-sm bg-white px-6 py-4 rounded-xl shadow">{error}</div>}
        {!error && img && url && (
          <img src={url} alt={file.name} className="max-w-full max-h-full object-contain rounded-lg shadow-lg bg-white" />
        )}
        {!error && pdf && url && (
          <iframe title={file.name} src={url} className="w-full h-full max-w-5xl bg-white rounded-lg shadow-lg border border-[#dadce0]" />
        )}
        {!error && txt && (
          editing ? (
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full h-full max-w-4xl bg-white rounded-xl shadow border border-[#dadce0] p-6 font-mono text-sm text-[#202124] outline-none focus:border-[#1a73e8] resize-none"
            />
          ) : (
            <pre className="w-full h-full max-w-4xl bg-white rounded-xl shadow border border-[#dadce0] p-6 font-mono text-sm text-[#202124] overflow-auto whitespace-pre-wrap">
              {text || '(vacio)'}
            </pre>
          )
        )}
        {!error && office && (
          <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-[#202124] font-medium mb-2">{file.name}</p>
            <p className="text-sm text-[#5f6368] mb-6">
              Word, Excel y PowerPoint no se editan en el navegador. Descargalo para abrirlo en Office o LibreOffice.
            </p>
            <button type="button" onClick={download} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">
              Descargar archivo
            </button>
          </div>
        )}
        {!error && !img && !pdf && !txt && !office && url && (
          <div className="bg-white rounded-xl shadow p-10 max-w-md text-center">
            <div className="text-4xl mb-4">📎</div>
            <p className="text-[#202124] font-medium mb-2">{file.name}</p>
            <p className="text-sm text-[#5f6368] mb-6">Vista previa no disponible para este tipo. Puedes descargarlo.</p>
            <button type="button" onClick={download} className="h-10 px-6 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">
              Descargar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
