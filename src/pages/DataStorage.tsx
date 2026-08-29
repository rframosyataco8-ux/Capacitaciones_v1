import { useEffect, useState, useCallback, useRef } from 'react'
import {
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Upload,
  File,
  Trash2,
  Download,
} from 'lucide-react'
import {
  seedIfEmpty,
  listFolders,
  listFiles,
  saveFile,
  deleteFile,
  type MaterialFolder,
  type MaterialFile,
} from '../lib/db'

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function DataStorage() {
  const [folders, setFolders] = useState<MaterialFolder[]>([])
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({ '2026': true })
  const [selected, setSelected] = useState<MaterialFolder | null>(null)
  const [files, setFiles] = useState<MaterialFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const refreshFolders = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    setFolders(await listFolders())
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshFolders()
  }, [refreshFolders])

  useEffect(() => {
    if (!selected) {
      setFiles([])
      return
    }
    listFiles(selected.path).then(setFiles)
  }, [selected])

  const byYear: Record<string, MaterialFolder[]> = {}
  folders.forEach((f) => {
    const key = String(f.year)
    if (!byYear[key]) byYear[key] = []
    byYear[key].push(f)
  })

  async function handleUpload(fileList: FileList | null) {
    if (!selected || !fileList?.length) return
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        await saveFile({
          folderPath: selected.path,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
        })
      }
      setFiles(await listFiles(selected.path))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este archivo?')) return
    await deleteFile(id)
    if (selected) setFiles(await listFiles(selected.path))
  }

  async function handleDownload(f: MaterialFile) {
    if (!f.blob) return
    const url = URL.createObjectURL(f.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[var(--border)] px-7 py-5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">Data Storage</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Materiales por año y tema · Máx. 25 MB por archivo
            </p>
          </div>
          <label className={`btn btn-primary ${!selected || uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
            <Upload size={15} />
            {uploading ? 'Subiendo…' : 'Subir archivo'}
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              disabled={!selected || uploading}
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.mov,.png,.jpg,.jpeg,.zip,.txt"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
        </div>
        {error && (
          <p className="mt-2 text-[13px] text-[var(--danger)]">{error}</p>
        )}
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-[320px] bg-white border-r border-[var(--border)] overflow-y-auto p-3">
          {loading ? (
            <div className="p-4 text-sm text-[var(--text-muted)]">Cargando…</div>
          ) : Object.keys(byYear).length === 0 ? (
            <div className="p-4 text-sm text-[var(--text-muted)]">Sin carpetas. Crea el programa en Cronograma.</div>
          ) : (
            Object.entries(byYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, temas]) => (
                <div key={year} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setOpenYears((p) => ({ ...p, [year]: !p[year] }))}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium hover:bg-[#f3f4f6] text-left"
                  >
                    {openYears[year] ? <ChevronDown size={15} className="text-[var(--text-muted)]" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                    <FolderOpen size={15} className="text-[var(--primary)]" />
                    <span className="truncate">Cronograma · {year}</span>
                  </button>
                  {openYears[year] && (
                    <div className="ml-3 mt-0.5 space-y-0.5">
                      {temas.map((t) => (
                        <button
                          key={t.id ?? t.path}
                          type="button"
                          onClick={() => setSelected(t)}
                          className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12.5px] text-left transition-colors ${
                            selected?.path === t.path
                              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)] font-medium'
                              : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6]'
                          }`}
                        >
                          <FolderOpen size={13} className="opacity-60 shrink-0" />
                          <span className="truncate">{t.tema}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {selected ? (
            <div className="animate-in">
              <h2 className="text-[16px] font-semibold mb-0.5">{selected.tema}</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mb-5">{selected.path}</p>

              <div
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center bg-white mb-4 hover:border-[var(--primary)] transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleUpload(e.dataTransfer.files)
                }}
              >
                <File size={20} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-[13px] text-[var(--text-secondary)]">Arrastra archivos aquí o usa Subir archivo</p>
              </div>

              <div className="bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
                {files.length === 0 ? (
                  <div className="p-10 text-center text-[13px] text-[var(--text-muted)]">Carpeta vacía</div>
                ) : (
                  files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[#f8f9fa]"
                    >
                      <File size={16} className="text-[var(--text-muted)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">{f.name}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">{formatSize(f.size)}</div>
                      </div>
                      <button type="button" className="btn-icon text-[var(--primary)]" title="Descargar" onClick={() => handleDownload(f)}>
                        <Download size={15} />
                      </button>
                      <button type="button" className="btn-icon text-[var(--danger)]" title="Eliminar" onClick={() => f.id && handleDelete(f.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[13px] text-[var(--text-secondary)]">
              Selecciona un tema para ver o subir materiales
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
