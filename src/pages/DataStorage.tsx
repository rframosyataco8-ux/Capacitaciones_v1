import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FolderOpen, ChevronRight, ChevronDown, Upload, File, Trash2, Download,
  Star, Search, List, LayoutGrid, Plus, HardDrive, FolderPlus, Eye,
  Edit3, X, Info, FileText, Image as ImageIcon, Film, Music,
  FileSpreadsheet, Presentation, Users, BookOpen, Calendar, RefreshCw,
} from 'lucide-react'
import {
  seedIfEmpty, listFolders, listFiles, saveFile, saveFolder,
  toggleFavoriteFile, softDeleteFile, restoreFile, hardDeleteFile, emptyTrash,
  renameFile, listDeletedFiles, listFavoriteFiles,
  type MaterialFolder, type MaterialFile,
} from '../lib/db'
import { useToast } from '../lib/toast'
import { confirmar } from '../lib/confirm'
import FileViewerModal from '../components/FileViewerModal'

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

type Section = 'all' | 'favorites' | 'trash' | 'media'
type ViewMode = 'list' | 'grid'
type SortBy = 'name' | 'date' | 'size'

function fileIcon(name: string, type: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('sheet'))
    return <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#107c41' }}>X</div>
  if (['ppt', 'pptx'].includes(ext) || type.includes('presentation'))
    return <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#d83b01' }}>P</div>
  if (['doc', 'docx'].includes(ext) || type.includes('word'))
    return <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#185abd' }}>W</div>
  if (type.startsWith('image/') || ['jpg', 'png', 'gif', 'webp'].includes(ext))
    return <ImageIcon size={18} style={{ color: 'var(--primary)' }} />
  if (type.startsWith('video/') || ['mp4', 'webm'].includes(ext))
    return <Film size={18} style={{ color: '#7c3aed' }} />
  if (type.startsWith('audio/') || ['mp3', 'wav'].includes(ext))
    return <Music size={18} style={{ color: '#db2777' }} />
  if (ext === 'pdf') return <FileText size={18} style={{ color: 'var(--danger)' }} />
  return <File size={18} style={{ color: 'var(--text-muted)' }} />
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
      <path d="M2.5 5.5C2.5 4.4 3.4 3.5 4.5 3.5H9.1C9.6 3.5 10.1 3.7 10.5 4.1L12.4 6H19.5C20.6 6 21.5 6.9 21.5 8V18.5C21.5 19.6 20.6 20.5 19.5 20.5H4.5C3.4 20.5 2.5 19.6 2.5 18.5V5.5Z" fill="#ffb900" />
      <path d="M2.5 9H21.5V18.5C21.5 19.6 20.6 20.5 19.5 20.5H4.5C3.4 20.5 2.5 19.6 2.5 18.5V9Z" fill="#ffd335" />
    </svg>
  )
}

export default function DataStorage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [section, setSection] = useState<Section>('all')
  const [year, setYear] = useState(2026)
  const [selectedFolder, setSelectedFolder] = useState<MaterialFolder | null>(null)
  const [folders, setFolders] = useState<MaterialFolder[]>([])
  const [files, setFiles] = useState<MaterialFile[]>([])
  const [allFilesCount, setAllFilesCount] = useState({ count: 0, bytes: 0 })
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const [previewFile, setPreviewFile] = useState<MaterialFile | null>(null)
  const [newFolderModal, setNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameModal, setRenameModal] = useState<MaterialFile | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [activeFile, setActiveFile] = useState<MaterialFile | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [yearsOpen, setYearsOpen] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)
  const createRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) setCreateOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await seedIfEmpty()
      const allFolders = await listFolders(year, false)
      setFolders(allFolders.sort((a, b) => a.tema.localeCompare(b.tema)))

      let list: MaterialFile[] = []
      if (section === 'favorites') {
        list = await listFavoriteFiles()
      } else if (section === 'trash') {
        list = await listDeletedFiles()
      } else if (section === 'media') {
        const all = await listFiles()
        list = all.filter(
          (f) =>
            !f.isDeleted &&
            (f.type.startsWith('image/') ||
              f.type.startsWith('video/') ||
              f.type.startsWith('audio/') ||
              /\.(jpg|jpeg|png|gif|webp|mp4|webm|mp3|wav)$/i.test(f.name))
        )
      } else if (selectedFolder) {
        list = await listFiles(selectedFolder.path)
      } else {
        // Vista raíz: no listar todos los archivos; solo carpetas
        list = []
      }
      setFiles(list)

      // Stats globales (sin eliminados)
      const every = await listFiles()
      const active = every.filter((f) => !f.isDeleted)
      setAllFilesCount({
        count: active.length,
        bytes: active.reduce((s, f) => s + (f.size || 0), 0),
      })
    } catch (e) {
      console.error(e)
      toast('Error al cargar archivos', 'error')
    } finally {
      setLoading(false)
    }
  }, [year, section, selectedFolder, toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Sync search from URL once
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
  }, [searchParams])

  const filteredFiles = useMemo(() => {
    let list = files
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (f) => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      else cmp = a.size - b.size
      return sortAsc ? cmp : -cmp
    })
  }, [files, search, sortBy, sortAsc])

  const filteredFolders = useMemo(() => {
    if (section !== 'all' || selectedFolder) return []
    if (!search.trim()) return folders
    const q = search.toLowerCase()
    return folders.filter((f) => f.tema.toLowerCase().includes(q))
  }, [folders, section, selectedFolder, search])

  /* ─── Actions ─── */

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return
    const target =
      selectedFolder?.path ||
      `Cronograma de Capacitaciones - ${year}/Documentos generales`

    // Auto-create default folder if uploading at root without selection
    if (!selectedFolder) {
      const existing = folders.find((f) => f.path === target)
      if (!existing) {
        await saveFolder({
          year,
          tema: 'Documentos generales',
          path: target,
        })
      }
    }

    setUploading(true)
    try {
      let ok = 0
      for (const file of Array.from(fileList)) {
        await saveFile({
          folderPath: target,
          folderId: selectedFolder?.id ?? null,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          blob: file,
        })
        ok++
      }
      toast(ok === 1 ? 'Archivo subido' : `${ok} archivos subidos`, 'success')
      if (!selectedFolder) {
        // Enter the general folder after upload at root
        const all = await listFolders(year, false)
        setFolders(all)
        const fol = all.find((f) => f.path === target)
        if (fol) setSelectedFolder(fol)
      }
      await refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al subir', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim()
    if (!name) {
      toast('Escribe un nombre de carpeta', 'error')
      return
    }
    const path = `Cronograma de Capacitaciones - ${year}/${name}`
    const exists = folders.some((f) => f.path === path || f.tema.toLowerCase() === name.toLowerCase())
    if (exists) {
      toast('Ya existe una carpeta con ese nombre', 'error')
      return
    }
    await saveFolder({ year, tema: name, path })
    setNewFolderName('')
    setNewFolderModal(false)
    toast('Carpeta creada', 'success')
    await refresh()
  }

  async function handleCreateOffice(kind: 'excel' | 'word' | 'powerpoint') {
    setCreateOpen(false)
    const names = {
      excel: 'Libro nuevo.xlsx',
      word: 'Documento nuevo.docx',
      powerpoint: 'Presentación nueva.pptx',
    }
    const mimes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      powerpoint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }
    const target =
      selectedFolder?.path ||
      `Cronograma de Capacitaciones - ${year}/Documentos generales`
    if (!selectedFolder) {
      const exists = folders.find((f) => f.path === target)
      if (!exists) await saveFolder({ year, tema: 'Documentos generales', path: target })
    }
    await saveFile({
      folderPath: target,
      folderId: selectedFolder?.id ?? null,
      name: names[kind],
      type: mimes[kind],
      size: 1024,
      blob: new Blob([''], { type: mimes[kind] }),
    })
    toast(`${names[kind]} creado`, 'success')
    await refresh()
  }

  async function onToggleFavorite(f: MaterialFile) {
    if (!f.id) return
    await toggleFavoriteFile(f.id, !!f.isFavorite)
    toast(f.isFavorite ? 'Quitado de favoritos' : 'Añadido a favoritos', 'info')
    await refresh()
  }

  async function onSoftDelete(f: MaterialFile) {
    if (!f.id) return
    await softDeleteFile(f.id)
    toast('Movido a la papelera', 'info')
    setActiveFile(null)
    await refresh()
  }

  async function onRestore(f: MaterialFile) {
    if (!f.id) return
    await restoreFile(f.id)
    toast('Archivo restaurado', 'success')
    await refresh()
  }

  async function onHardDelete(f: MaterialFile) {
    if (!f.id) return
    if (!confirmar('¿Eliminar permanentemente? No se puede deshacer.')) return
    await hardDeleteFile(f.id)
    toast('Eliminado permanentemente', 'success')
    setActiveFile(null)
    await refresh()
  }

  async function onEmptyTrash() {
    if (!confirmar('¿Vaciar toda la papelera?')) return
    await emptyTrash()
    toast('Papelera vaciada', 'success')
    await refresh()
  }

  async function onRename() {
    if (!renameModal?.id || !renameValue.trim()) return
    await renameFile(renameModal.id, renameValue.trim())
    setRenameModal(null)
    toast('Renombrado', 'success')
    await refresh()
  }

  function onDownload(f: MaterialFile) {
    if (!f.blob) {
      toast('No hay datos del archivo para descargar', 'error')
      return
    }
    const url = URL.createObjectURL(f.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    URL.revokeObjectURL(url)
  }

  function openSection(sec: Section) {
    setSection(sec)
    setSelectedFolder(null)
    setActiveFile(null)
    setSearch('')
    setSearchParams({})
  }

  function openFolder(f: MaterialFolder) {
    setSection('all')
    setSelectedFolder(f)
    setActiveFile(null)
  }

  function goRoot() {
    setSelectedFolder(null)
    setSection('all')
  }

  /* ─── Drag & drop ─── */
  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (section === 'trash') return
    handleUpload(e.dataTransfer.files)
  }

  const title =
    section === 'favorites'
      ? 'Favoritos'
      : section === 'trash'
      ? 'Papelera de reciclaje'
      : section === 'media'
      ? 'Elementos multimedia'
      : selectedFolder
      ? selectedFolder.tema
      : 'Mis archivos'

  const storagePct = Math.min(100, (allFilesCount.bytes / (1024 * 1024 * 100)) * 100) // scale vs 100 MB soft quota visual

  return (
    <div className="h-full flex min-h-0" style={{ background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-[240px] shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="p-3">
          <div className="relative" ref={createRef}>
            <button
              type="button"
              onClick={() => setCreateOpen(!createOpen)}
              className="w-full h-9 rounded-full text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm"
              style={{ background: '#0078d4' }}
            >
              <Plus size={16} strokeWidth={2.5} /> Crear o cargar
            </button>
            {createOpen && (
              <div
                className="absolute top-11 left-0 right-0 z-30 rounded-xl shadow-lg py-1.5 text-[13px] animate-scale"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--row-hover)] text-left font-medium" onClick={() => { setCreateOpen(false); setNewFolderModal(true) }}>
                  <FolderPlus size={15} style={{ color: '#ffb900' }} /> Carpeta
                </button>
                <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--row-hover)] text-left font-medium" onClick={() => handleCreateOffice('excel')}>
                  <FileSpreadsheet size={15} style={{ color: '#107c41' }} /> Libro de Excel
                </button>
                <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--row-hover)] text-left font-medium" onClick={() => handleCreateOffice('powerpoint')}>
                  <Presentation size={15} style={{ color: '#d83b01' }} /> PowerPoint
                </button>
                <button type="button" className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--row-hover)] text-left font-medium" onClick={() => handleCreateOffice('word')}>
                  <FileText size={15} style={{ color: '#185abd' }} /> Documento Word
                </button>
                <div className="h-px my-1" style={{ background: 'var(--border)' }} />
                <label className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--row-hover)] text-left font-medium cursor-pointer">
                  <Upload size={15} style={{ color: '#0078d4' }} /> Cargar archivos
                  <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { setCreateOpen(false); handleUpload(e.target.files) }} />
                </label>
              </div>
            )}
          </div>
        </div>

        <nav className="px-2 space-y-0.5 text-[13px]">
          {(
            [
              { id: 'all' as const, label: 'Mis archivos', icon: FolderOpen },
              { id: 'favorites' as const, label: 'Favoritos', icon: Star },
              { id: 'media' as const, label: 'Multimedia', icon: ImageIcon },
              { id: 'trash' as const, label: 'Papelera', icon: Trash2 },
            ] as const
          ).map((item) => {
            const active = section === item.id && !selectedFolder
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openSection(item.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left relative transition-colors"
                style={{
                  background: active ? 'var(--primary-soft)' : 'transparent',
                  color: active ? 'var(--primary-text)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 500,
                }}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r" style={{ background: 'var(--primary)' }} />}
                <item.icon size={16} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Year / program tree */}
        <div className="mt-4 px-2">
          <button
            type="button"
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setYearsOpen((o) => !o)}
          >
            {yearsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Programa {year}
          </button>
          {yearsOpen && (
            <div className="mt-1 space-y-0.5 max-h-[280px] overflow-y-auto">
              <div className="flex gap-1 px-2 mb-1">
                {[2025, 2026, 2027].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setYear(y); setSelectedFolder(null); setSection('all') }}
                    className="flex-1 text-[11px] font-semibold py-1 rounded-md"
                    style={{
                      background: year === y ? 'var(--primary-soft)' : 'var(--surface-2)',
                      color: year === y ? 'var(--primary-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
              {folders.slice(0, 40).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => openFolder(f)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-[12px] truncate"
                  style={{
                    background: selectedFolder?.id === f.id ? 'var(--primary-soft)' : 'transparent',
                    color: selectedFolder?.id === f.id ? 'var(--primary-text)' : 'var(--text-secondary)',
                    fontWeight: selectedFolder?.id === f.id ? 600 : 400,
                  }}
                  title={f.tema}
                >
                  <FolderIcon />
                  <span className="truncate">{f.tema}</span>
                </button>
              ))}
              {!folders.length && (
                <p className="px-3 py-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  Sin carpetas. Crea el programa en Cronograma.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-auto p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[11px] font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>Almacenamiento local</div>
          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, storagePct)}%`, background: '#0078d4' }} />
          </div>
          <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {formatSize(allFilesCount.bytes)} · {allFilesCount.count} archivos
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Toolbar */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-3 border-b shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--header-bg)' }}>
          <div className="flex items-center gap-1 text-[13px] min-w-0">
            <button type="button" className="font-semibold hover:underline" style={{ color: 'var(--primary-text)' }} onClick={goRoot}>
              Mis archivos
            </button>
            {selectedFolder && (
              <>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="font-semibold truncate" style={{ color: 'var(--text)' }}>{selectedFolder.tema}</span>
              </>
            )}
            {(section === 'favorites' || section === 'trash' || section === 'media') && !selectedFolder && (
              <>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="font-semibold">{title}</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              className="input w-full pl-9 text-[12px]"
              placeholder="Buscar en archivos…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button type="button" className="btn-icon" title="Actualizar" onClick={() => refresh()}>
            <RefreshCw size={15} />
          </button>
          <button type="button" className="btn-icon" title={viewMode === 'list' ? 'Cuadrícula' : 'Lista'} onClick={() => setViewMode((v) => (v === 'list' ? 'grid' : 'list'))}>
            {viewMode === 'list' ? <LayoutGrid size={15} /> : <List size={15} />}
          </button>
          <button type="button" className="btn-icon" title="Detalles" onClick={() => setShowDetails((d) => !d)} style={showDetails ? { background: 'var(--primary-soft)', color: 'var(--primary-text)' } : undefined}>
            <Info size={15} />
          </button>

          {section === 'trash' && (
            <button type="button" className="btn btn-ghost text-[12px] h-8" onClick={onEmptyTrash}>
              <Trash2 size={14} /> Vaciar papelera
            </button>
          )}
        </div>

        {/* Content + drop zone */}
        <div
          className="flex-1 flex min-h-0"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex-1 overflow-auto p-5 relative">
            {isDragOver && section !== 'trash' && (
              <div
                className="absolute inset-3 z-20 rounded-xl border-2 border-dashed flex items-center justify-center text-[15px] font-semibold"
                style={{ borderColor: '#0078d4', background: 'rgba(0,120,212,0.08)', color: '#0078d4' }}
              >
                Suelta los archivos para subirlos aquí
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-[20px] font-semibold tracking-tight">{title}</h1>
              <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                <button type="button" className="hover:underline" onClick={() => { setSortBy('name'); setSortAsc((a) => !a) }}>Nombre</button>
                <span>·</span>
                <button type="button" className="hover:underline" onClick={() => { setSortBy('date'); setSortAsc((a) => !a) }}>Fecha</button>
                <span>·</span>
                <button type="button" className="hover:underline" onClick={() => { setSortBy('size'); setSortAsc((a) => !a) }}>Tamaño</button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cargando…</p>
            ) : uploading ? (
              <p className="text-sm" style={{ color: 'var(--primary-text)' }}>Subiendo archivos…</p>
            ) : viewMode === 'list' ? (
              <div className="table-wrap">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="th-row text-left">
                      <th className="px-3 py-2.5 w-10" />
                      <th className="px-3 py-2.5 font-semibold">Nombre</th>
                      <th className="px-3 py-2.5 font-semibold w-32">Modificado</th>
                      <th className="px-3 py-2.5 font-semibold w-28">Tamaño</th>
                      <th className="px-3 py-2.5 font-semibold w-36 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFolders.map((f) => (
                      <tr
                        key={f.id}
                        className="border-b tr-hover cursor-pointer"
                        style={{ borderColor: 'var(--border)' }}
                        onDoubleClick={() => openFolder(f)}
                        onClick={() => openFolder(f)}
                      >
                        <td className="px-3 py-2.5"><FolderIcon /></td>
                        <td className="px-3 py-2.5 font-medium">{f.tema}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{formatDate(f.createdAt)}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>—</td>
                        <td className="px-3 py-2.5 text-right">
                          <button type="button" className="btn-icon" onClick={(e) => { e.stopPropagation(); openFolder(f) }} title="Abrir">
                            <FolderOpen size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredFiles.map((file) => (
                      <tr
                        key={file.id}
                        className="border-b tr-hover cursor-pointer group"
                        style={{
                          borderColor: 'var(--border)',
                          background: activeFile?.id === file.id ? 'var(--primary-soft)' : undefined,
                        }}
                        onClick={() => { setActiveFile(file); setShowDetails(true) }}
                        onDoubleClick={() => setPreviewFile(file)}
                      >
                        <td className="px-3 py-2.5">{fileIcon(file.name, file.type)}</td>
                        <td className="px-3 py-2.5 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            {file.name}
                            {file.isFavorite && <Star size={12} fill="var(--accent)" style={{ color: 'var(--accent)' }} />}
                          </span>
                        </td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{formatDate(file.createdAt)}</td>
                        <td className="px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{formatSize(file.size)}</td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {section === 'trash' ? (
                              <>
                                <button type="button" className="btn-icon" title="Restaurar" onClick={(e) => { e.stopPropagation(); onRestore(file) }}><RefreshCw size={14} /></button>
                                <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} title="Eliminar permanente" onClick={(e) => { e.stopPropagation(); onHardDelete(file) }}><Trash2 size={14} /></button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="btn-icon" title="Abrir" onClick={(e) => { e.stopPropagation(); setPreviewFile(file) }}><Eye size={14} /></button>
                                <button type="button" className="btn-icon" title="Descargar" onClick={(e) => { e.stopPropagation(); onDownload(file) }}><Download size={14} /></button>
                                <button type="button" className="btn-icon" title="Favorito" onClick={(e) => { e.stopPropagation(); onToggleFavorite(file) }}><Star size={14} fill={file.isFavorite ? 'var(--accent)' : 'none'} style={{ color: file.isFavorite ? 'var(--accent)' : undefined }} /></button>
                                <button type="button" className="btn-icon" title="Renombrar" onClick={(e) => { e.stopPropagation(); setRenameModal(file); setRenameValue(file.name) }}><Edit3 size={14} /></button>
                                <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} title="Papelera" onClick={(e) => { e.stopPropagation(); onSoftDelete(file) }}><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredFolders.length && !filteredFiles.length && (
                  <div className="p-14 text-center">
                    <HardDrive size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-[14px] font-medium">Vacío</p>
                    <p className="text-[12px] mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {section === 'trash'
                        ? 'La papelera está vacía'
                        : section === 'favorites'
                        ? 'Marca archivos con la estrella para verlos aquí'
                        : 'Arrastra archivos o usa «Crear o cargar»'}
                    </p>
                    {section === 'all' && (
                      <label className="btn btn-primary cursor-pointer inline-flex">
                        <Upload size={14} /> Subir archivos
                        <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-in">
                {filteredFolders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onDoubleClick={() => openFolder(f)}
                    onClick={() => openFolder(f)}
                    className="card card-hover p-4 text-left flex flex-col items-start gap-2"
                  >
                    <FolderIcon />
                    <span className="text-[12px] font-medium line-clamp-2">{f.tema}</span>
                  </button>
                ))}
                {filteredFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => { setActiveFile(file); setShowDetails(true) }}
                    onDoubleClick={() => setPreviewFile(file)}
                    className="card card-hover p-4 text-left flex flex-col items-start gap-2"
                  >
                    {fileIcon(file.name, file.type)}
                    <span className="text-[12px] font-medium line-clamp-2">{file.name}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatSize(file.size)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details panel */}
          {showDetails && (
            <aside
              className="w-72 shrink-0 border-l overflow-y-auto p-4 animate-in"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-[14px]">Detalles</span>
                <button type="button" className="btn-icon" onClick={() => setShowDetails(false)}><X size={15} /></button>
              </div>
              {activeFile ? (
                <div className="space-y-4 text-[12px]">
                  <div className="h-24 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    {fileIcon(activeFile.name, activeFile.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-[13px] break-words">{activeFile.name}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{formatSize(activeFile.size)}</div>
                  </div>
                  <button type="button" className="btn btn-primary w-full h-8 text-[12px]" onClick={() => setPreviewFile(activeFile)}>
                    <Eye size={13} /> Abrir
                  </button>
                  <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Ubicación</div>
                      <div className="break-words" style={{ color: 'var(--text-secondary)' }}>{activeFile.folderPath}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Fecha</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{new Date(activeFile.createdAt).toLocaleString('es-PE')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Tipo</div>
                      <div className="font-mono text-[11px]" style={{ color: 'var(--text-secondary)' }}>{activeFile.type || '—'}</div>
                    </div>
                  </div>
                  {section !== 'trash' && (
                    <div className="flex gap-1 pt-2">
                      <button type="button" className="btn-icon" title="Descargar" onClick={() => onDownload(activeFile)}><Download size={14} /></button>
                      <button type="button" className="btn-icon" title="Favorito" onClick={() => onToggleFavorite(activeFile)}><Star size={14} /></button>
                      <button type="button" className="btn-icon" title="Renombrar" onClick={() => { setRenameModal(activeFile); setRenameValue(activeFile.name) }}><Edit3 size={14} /></button>
                      <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} title="Papelera" onClick={() => onSoftDelete(activeFile)}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  Selecciona un archivo para ver detalles
                </p>
              )}
            </aside>
          )}
        </div>
      </div>

      {previewFile && <FileViewerModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      {newFolderModal && (
        <div className="modal-backdrop" onClick={() => setNewFolderModal(false)}>
          <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-[14px]">Nueva carpeta</h3>
              <button type="button" className="btn-icon" onClick={() => setNewFolderModal(false)}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input className="input w-full" placeholder="Nombre…" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} />
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Se creará dentro del programa {year}</p>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setNewFolderModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={handleCreateFolder}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renameModal && (
        <div className="modal-backdrop" onClick={() => setRenameModal(null)}>
          <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-[14px]">Renombrar</h3>
              <button type="button" className="btn-icon" onClick={() => setRenameModal(null)}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <input className="input w-full" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && onRename()} />
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setRenameModal(null)}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1" onClick={onRename}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
