import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  FolderOpen, ChevronRight, ChevronDown, Upload, File, Trash2, Download,
  Star, Search, Grid, List, Plus, HardDrive, RefreshCw, FolderPlus, Eye,
  MoreVertical, Edit3, ArrowUpDown, Move, AlertCircle, FileText, Image as ImageIcon,
  Film, Music, FileSpreadsheet, FileArchive, Check, CornerUpLeft, ShieldAlert,
  X, Info, Sparkles, CheckSquare, Square, Share2, Copy, Users, BookOpen,
  Calendar, Layers, UserCheck, CheckCircle2
} from 'lucide-react'
import {
  seedIfEmpty, listFolders, listFiles, saveFile, saveFolder,
  toggleFavoriteFile, softDeleteFile, restoreFile, hardDeleteFile, emptyTrash,
  renameFile, moveFile, listDeletedFiles, listFavoriteFiles,
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

type StorageSection = 'inicio' | 'all' | 'shared' | 'favorites' | 'libraries' | 'trash' | 'multimedia'
type ViewMode = 'list' | 'grid'
type SortBy = 'name' | 'date' | 'size'

const ONEDRIVE_DEFAULT_FOLDERS = [
  { tema: 'Sap Modulos', date: '03/11/2025', count: '5 elementos', shared: 'Privado' },
  { tema: 'Reuniones', date: '10 de febrero', count: '0 elementos', shared: 'Compartido' },
  { tema: 'Microsoft Teams Chat Files', date: '01/10/2025', count: '2 elementos', shared: 'Privado' },
  { tema: 'Imágenes', date: '22/11/2024', count: '3 elementos', shared: 'Privado' },
  { tema: 'HACCP 2025', date: '02/04/2025', count: '0 elementos', shared: 'Privado' },
  { tema: 'GRANO 2024', date: '12/09/2024', count: '1 elemento', shared: 'Privado' },
  { tema: 'FISICO QUIMICO 2024', date: '04/10/2024', count: '3 elementos', shared: 'Privado' },
  { tema: 'FAY N 1- PROCEDIMIENTOS DE ANALISIS FISICO Q...', date: '08/01/2025', count: '14 elementos', shared: 'Privado' },
  { tema: 'Escritorio_1', date: '09/06/2025', count: '82 elementos', shared: 'Privado' },
  { tema: 'Escritorio', date: '4 de agosto', count: '1 elemento', shared: 'Privado' },
  { tema: 'Documentos_1', date: '09/06/2025', count: '8 elementos', shared: 'Privado' },
  { tema: 'Documentos', date: '22/10/2025', count: '9 elementos', shared: 'Privado' },
  { tema: 'DC', date: '14/03/2023', count: '2 elementos', shared: 'Privado' },
]

export default function DataStorage() {
  const { toast } = useToast()

  // Navigation & View state
  const [section, setSection] = useState<StorageSection>('all')
  const [selectedFolder, setSelectedFolder] = useState<MaterialFolder | null>(null)
  const [folders, setFolders] = useState<MaterialFolder[]>([])
  const [files, setFiles] = useState<MaterialFile[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [search, setSearch] = useState('')
  const [showBanner, setShowBanner] = useState(true)

  // Selected files for batch operations
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([])

  // Modals & Active actions
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<MaterialFile | null>(null)
  const [newFolderModal, setNewFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renameModal, setRenameModal] = useState<MaterialFile | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showSideDetails, setShowSideDetails] = useState(false)
  const [activeSideFile, setActiveSideFile] = useState<MaterialFile | null>(null)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const createMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /* ================= DATA LOADING ================= */

  const refreshData = useCallback(async () => {
    setLoading(true)
    await seedIfEmpty()
    const allFolders = await listFolders(undefined, false)

    // Si aún no existen las carpetas de SharePoint, agregarlas
    if (allFolders.length <= 1) {
      for (const df of ONEDRIVE_DEFAULT_FOLDERS) {
        await saveFolder({
          year: 2026,
          tema: df.tema,
          path: `Cronograma de Capacitaciones - 2026/${df.tema}`,
        })
      }
      const updated = await listFolders(undefined, false)
      setFolders(updated)
    } else {
      setFolders(allFolders)
    }

    if (section === 'favorites') {
      setFiles(await listFavoriteFiles())
    } else if (section === 'trash') {
      setFiles(await listDeletedFiles())
    } else {
      if (selectedFolder) {
        setFiles(await listFiles(selectedFolder.path))
      } else {
        const allFiles = await listFiles()
        setFiles(allFiles)
      }
    }

    setSelectedFileIds([])
    setLoading(false)
  }, [section, selectedFolder])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  async function handleSelectSection(sec: StorageSection) {
    setSection(sec)
    setSearch('')
    setSelectedFileIds([])
    setSelectedFolder(null)
    if (sec === 'favorites') {
      setFiles(await listFavoriteFiles())
    } else if (sec === 'trash') {
      setFiles(await listDeletedFiles())
    } else {
      setFiles(await listFiles())
    }
  }

  function handleSelectFolder(f: MaterialFolder) {
    setSection('all')
    setSelectedFolder(f)
    setSelectedFileIds([])
  }

  /* ================= FILE OPERATIONS ================= */

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return
    const targetPath = selectedFolder?.path || 'Cronograma de Capacitaciones - 2026/Documentos'
    setUploading(true)
    try {
      const count = fileList.length
      for (const file of Array.from(fileList)) {
        await saveFile({
          folderPath: targetPath,
          folderId: selectedFolder?.id || null,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
        })
      }
      setFiles(selectedFolder ? await listFiles(selectedFolder.path) : await listFiles())
      toast(count === 1 ? 'Archivo cargado en OneDrive' : `${count} archivos cargados con éxito`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Error al subir archivo', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleCreateNewOfficeDoc(type: 'excel' | 'powerpoint' | 'word') {
    const targetPath = selectedFolder?.path || 'Cronograma de Capacitaciones - 2026/Documentos'
    setCreateMenuOpen(false)

    const titles = {
      excel: 'Trazabilidad torta alcalina.xlsx',
      powerpoint: 'Analisis-Microbiologico-del-Cacao.pptx',
      word: 'Procedimiento de Limpieza POES.docx',
    }

    const mimes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      powerpoint: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }

    const emptyBlob = new Blob([''], { type: mimes[type] })
    await saveFile({
      folderPath: targetPath,
      folderId: selectedFolder?.id || null,
      name: titles[type],
      type: mimes[type],
      size: 52000,
      blob: emptyBlob,
    })

    await refreshData()
    toast(`Nuevo documento de ${type.toUpperCase()} creado en OneDrive`, 'success')
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      toast('Ingresa un nombre para la carpeta', 'error')
      return
    }
    const currentYear = selectedFolder?.year || 2026
    const path = `Cronograma de Capacitaciones - ${currentYear}/${newFolderName.trim()}`
    await saveFolder({
      year: currentYear,
      tema: newFolderName.trim(),
      path,
      parentId: selectedFolder?.id || null,
    })
    setNewFolderName('')
    setNewFolderModal(false)
    await refreshData()
    toast('Carpeta creada con éxito', 'success')
  }

  async function handleToggleFavorite(f: MaterialFile) {
    if (!f.id) return
    await toggleFavoriteFile(f.id, !!f.isFavorite)
    await refreshData()
    toast(f.isFavorite ? 'Quitado de favoritos' : 'Añadido a favoritos ⭐', 'info')
  }

  async function handleSoftDelete(f: MaterialFile) {
    if (!f.id) return
    await softDeleteFile(f.id)
    await refreshData()
    toast('Archivo movido a la papelera 🗑️', 'info')
  }

  async function handleRestore(f: MaterialFile) {
    if (!f.id) return
    await restoreFile(f.id)
    await refreshData()
    toast('Archivo restaurado con éxito', 'success')
  }

  async function handleHardDelete(f: MaterialFile) {
    if (!f.id) return
    if (!confirmar('¿Eliminar permanentemente este archivo? Esta acción no se puede deshacer.')) return
    await hardDeleteFile(f.id)
    await refreshData()
    toast('Archivo eliminado permanentemente', 'success')
  }

  async function handleEmptyTrash() {
    if (!confirmar('¿Vaciar toda la papelera de reciclaje? Se eliminarán todos los archivos permanentemente.')) return
    await emptyTrash()
    await refreshData()
    toast('Papelera vaciada', 'success')
  }

  async function handleRenameSubmit() {
    if (!renameModal?.id || !renameValue.trim()) return
    await renameFile(renameModal.id, renameValue.trim())
    setRenameModal(null)
    await refreshData()
    toast('Archivo renombrado con éxito', 'success')
  }

  function handleDownload(f: MaterialFile) {
    if (!f.blob) return
    const url = URL.createObjectURL(f.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = f.name
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredFiles = useMemo(() => {
    let list = files
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((f) => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'date') cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      else if (sortBy === 'size') cmp = b.size - a.size
      return sortAsc ? cmp : -cmp
    })
  }, [files, search, sortBy, sortAsc])

  // Helper para icono oficial de Carpeta Amarilla Dorada de Microsoft 365 (Idéntico a la imagen)
  function renderYellowFolderIcon() {
    return (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
        <path d="M2.5 5.5C2.5 4.39543 3.39543 3.5 4.5 3.5H9.08579C9.61623 3.5 10.1249 3.71071 10.5 4.08579L12.4142 6H19.5C20.6046 6 21.5 6.89543 21.5 8V18.5C21.5 19.6046 20.6046 20.5 19.5 20.5H4.5C3.39543 20.5 2.5 19.6046 2.5 18.5V5.5Z" fill="#ffb900" />
        <path d="M2.5 9H21.5V18.5C21.5 19.6046 20.6046 20.5 19.5 20.5H4.5C3.39543 20.5 2.5 19.6046 2.5 18.5V9Z" fill="#ffd335" />
      </svg>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#fdfdfd] dark:bg-[#0b1220] select-none text-slate-900 dark:text-slate-100 font-sans">
      {/* 1. BANNER FINO DE NOTIFICACIÓN ONEDRIVE (Idéntico a la imagen) */}
      {showBanner && (
        <div className="bg-[#f0f6ff] dark:bg-[#121e33] border-b border-[#cfe0f9] dark:border-[#1e3458] px-6 py-2 flex items-center justify-between text-xs text-[#0f4c81] dark:text-[#7eb6e8] shrink-0">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-[#0078d4] shrink-0" />
            <span>
              Mantenga OneDrive completamente optimizado. Seleccionar Permitir para conectarse a dispositivos locales para que todo siga funcionando con rapidez.{' '}
              <a href="#info" className="underline font-semibold text-[#0078d4]">Más información</a>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setShowBanner(false); toast('OneDrive optimizado', 'success') }}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs"
            >
              Permitir
            </button>
            <button type="button" onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-slate-700">
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* 2. CUERPO DIVIDIDO: SIDEBAR COMPLETO ONEDRIVE + WORKSPACE */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar Izquierdo OneDrive (Idéntico a la imagen) */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-[#fdfdfd] dark:bg-[#0b1220] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            {/* Botón Azul Grande "+ Crear o cargar" (Idéntico a la imagen) */}
            <div className="relative" ref={createMenuRef}>
              <button
                type="button"
                onClick={() => setCreateMenuOpen(!createMenuOpen)}
                className="w-full bg-[#0078d4] hover:bg-[#006cbd] text-white font-bold text-[13px] py-2 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Plus size={16} strokeWidth={2.5} /> Crear o cargar
              </button>

              {/* Dropdown del botón Crear o Cargar */}
              {createMenuOpen && (
                <div className="absolute top-11 left-0 w-64 bg-white dark:bg-[#1a2536] text-slate-800 dark:text-slate-200 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crear nuevo</div>
                  <button
                    type="button"
                    onClick={() => { setCreateMenuOpen(false); setNewFolderModal(true) }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold"
                  >
                    <FolderPlus size={16} className="text-amber-500" /> Carpeta
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateNewOfficeDoc('excel')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold"
                  >
                    <div className="w-5 h-5 rounded bg-[#107c41] text-white flex items-center justify-center text-[10px] font-bold">X</div>
                    Libro de Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateNewOfficeDoc('powerpoint')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold"
                  >
                    <div className="w-5 h-5 rounded bg-[#d83b01] text-white flex items-center justify-center text-[10px] font-bold">P</div>
                    Presentación de PowerPoint
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateNewOfficeDoc('word')}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold"
                  >
                    <div className="w-5 h-5 rounded bg-[#185abd] text-white flex items-center justify-center text-[10px] font-bold">W</div>
                    Documento de Word
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cargar existente</div>
                  <label className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-semibold cursor-pointer">
                    <Upload size={16} className="text-[#0078d4]" /> Cargar archivos
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        setCreateMenuOpen(false)
                        handleUpload(e.target.files)
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Nombre del Usuario (Idéntico a la imagen: Nereyda Huachua Flores) */}
            <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 px-2 pt-1">
              Nereyda Huachua Flores
            </div>

            {/* Menú Principal OneDrive */}
            <nav className="space-y-0.5 text-[13px]">
              <button
                type="button"
                onClick={() => handleSelectSection('inicio')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  section === 'inicio' ? 'text-[#0078d4] font-bold bg-slate-100 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <HardDrive size={16} className="text-slate-500" /> Inicio
              </button>

              <button
                type="button"
                onClick={() => handleSelectSection('all')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left relative transition-colors ${
                  section === 'all' && !selectedFolder ? 'text-[#0078d4] font-bold bg-[#edf5fd] dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {section === 'all' && !selectedFolder && (
                  <span className="absolute left-0 top-1 bottom-1 w-1 bg-[#0078d4] rounded-r" />
                )}
                <FolderOpen size={16} className={section === 'all' && !selectedFolder ? 'text-[#0078d4]' : 'text-slate-500'} />
                <span>Mis archivos</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSection('shared')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-left transition-colors"
              >
                <Users size={16} className="text-slate-500" /> Compartido
              </button>

              <button
                type="button"
                onClick={() => handleSelectSection('favorites')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  section === 'favorites' ? 'text-[#0078d4] font-bold bg-slate-100 dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Star size={16} className="text-slate-500" /> Favoritos
              </button>

              <button
                type="button"
                onClick={() => handleSelectSection('libraries')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 text-left transition-colors"
              >
                <BookOpen size={16} className="text-slate-500" /> Bibliotecas
              </button>

              <button
                type="button"
                onClick={() => handleSelectSection('trash')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  section === 'trash' ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <Trash2 size={16} className="text-slate-500" /> Papelera de reciclaje
              </button>
            </nav>

            {/* Sección: Examinar archivos por (Idéntico a la imagen) */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-3 pb-1">
                Examinar archivos por
              </div>
              <nav className="space-y-0.5 text-[12.5px] text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <UserCheck size={15} /> Contactos
                </div>
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer">
                  <Calendar size={15} /> Reuniones
                </div>
                <div
                  onClick={() => handleSelectSection('multimedia')}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <ImageIcon size={15} /> Elementos multimedia
                </div>
              </nav>
            </div>

            {/* Sección: Acceso rápido (Idéntico a la imagen) */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-3 pb-1">
                Acceso rápido
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer text-[12px] text-slate-700 dark:text-slate-300 font-medium">
                <div className="w-4 h-4 rounded bg-slate-500 text-white text-[8px] flex items-center justify-center font-bold">
                  PC
                </div>
                <span className="truncate">Proyecto desarrollos Choc...</span>
              </div>
            </div>
          </div>

          {/* Widget Almacenamiento Inferior (Idéntico a la imagen: 131.7 GB En uso: 14 de 1 TB) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Almacenamiento
            </div>
            <div className="h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-1.5">
              <div className="h-full bg-[#0078d4]" style={{ width: '13.1%' }} />
            </div>
            <div className="text-[11px] text-[#0078d4] font-semibold hover:underline cursor-pointer">
              131.7 GB <span className="text-slate-500 font-normal">En uso: 14 de 1 TB</span>
            </div>
          </div>
        </div>

        {/* Workspace Central (Tabla Idéntica a SharePoint) */}
        <div className="flex-1 overflow-auto p-6 flex flex-col">
          {/* Header de la Vista: Título "Mis archivos" + Botones Ordenar / Detalles */}
          <div className="flex items-center justify-between pb-4">
            <h1 className="text-[20px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {section === 'all' && !selectedFolder
                ? 'Mis archivos'
                : selectedFolder
                ? selectedFolder.tema
                : section === 'favorites'
                ? 'Favoritos'
                : 'Papelera de reciclaje'}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <button
                type="button"
                onClick={() => setSortAsc(!sortAsc)}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
              >
                <ArrowUpDown size={14} /> Ordenar <ChevronDown size={12} />
              </button>

              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
              >
                <List size={14} /> <ChevronDown size={12} />
              </button>

              <button
                type="button"
                onClick={() => setShowSideDetails(!showSideDetails)}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
              >
                <Info size={14} /> Detalles
              </button>
            </div>
          </div>

          {/* Tabla de Carpetas y Archivos estilo SharePoint */}
          <div className="flex-1 bg-white dark:bg-[#121a28] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col">
            <table className="w-full text-[12.5px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-left select-none">
                  <th className="w-10 px-4 py-2.5">
                    <File className="w-4 h-4 text-slate-400" />
                  </th>
                  <th className="px-3 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1 cursor-pointer">
                      Nombre <ChevronDown size={13} />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 w-36">
                    <span className="inline-flex items-center gap-1 cursor-pointer">
                      Modificado <ChevronDown size={13} />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 w-52">
                    <span className="inline-flex items-center gap-1 cursor-pointer">
                      Modificado por <ChevronDown size={13} />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 w-32">
                    <span className="inline-flex items-center gap-1 cursor-pointer">
                      Tamaño... <ChevronDown size={13} />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 w-32">
                    <span className="inline-flex items-center gap-1 cursor-pointer">
                      Compar... <ChevronDown size={13} />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 w-28">
                    Actividad
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Render de Carpetas (Idéntico a la imagen de SharePoint) */}
                {folders.map((folder, fIdx) => (
                  <tr
                    key={folder.id ?? fIdx}
                    onClick={() => handleSelectFolder(folder)}
                    onDoubleClick={() => handleSelectFolder(folder)}
                    className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-2">
                      {renderYellowFolderIcon()}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-100">
                      <span className="hover:underline">{folder.tema}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {ONEDRIVE_DEFAULT_FOLDERS[fIdx % ONEDRIVE_DEFAULT_FOLDERS.length]?.date || '03/11/2025'}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      Nereyda Huachua Flores
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {ONEDRIVE_DEFAULT_FOLDERS[fIdx % ONEDRIVE_DEFAULT_FOLDERS.length]?.count || '3 elementos'}
                    </td>
                    <td className="px-4 py-2 text-slate-500">
                      {ONEDRIVE_DEFAULT_FOLDERS[fIdx % ONEDRIVE_DEFAULT_FOLDERS.length]?.shared || 'Privado'}
                    </td>
                    <td className="px-4 py-2 text-slate-400 text-xs">
                      —
                    </td>
                  </tr>
                ))}

                {/* 2. Render de Archivos Subidos */}
                {filteredFiles.map((file) => {
                  const ext = file.name.split('.').pop()?.toLowerCase() || ''
                  return (
                    <tr
                      key={file.id}
                      onClick={() => setActiveSideFile(file)}
                      onDoubleClick={() => setPreviewFile(file)}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-sky-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-2">
                        {['xls', 'xlsx', 'csv'].includes(ext) ? (
                          <div className="w-5 h-5 rounded bg-[#107c41] text-white flex items-center justify-center text-[10px] font-bold">X</div>
                        ) : ['ppt', 'pptx'].includes(ext) ? (
                          <div className="w-5 h-5 rounded bg-[#d83b01] text-white flex items-center justify-center text-[10px] font-bold">P</div>
                        ) : ['doc', 'docx'].includes(ext) ? (
                          <div className="w-5 h-5 rounded bg-[#185abd] text-white flex items-center justify-center text-[10px] font-bold">W</div>
                        ) : (
                          <FileText size={18} className="text-rose-500" />
                        )}
                      </td>
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                        <span className="hover:text-[#0078d4] hover:underline">{file.name}</span>
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {new Date(file.createdAt).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                        Nereyda Huachua Flores
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        {formatSize(file.size)}
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        Privado
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setPreviewFile(file) }}
                            className="btn-icon h-6 w-6 text-[#0078d4]"
                            title="Abrir en Microsoft 365"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDownload(file) }}
                            className="btn-icon h-6 w-6"
                            title="Descargar"
                          >
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Lateral de Detalles y Metadatos */}
        {showSideDetails && (
          <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-[#fdfdfd] dark:bg-[#0b1220] p-5 shrink-0 overflow-y-auto space-y-4 animate-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Detalles</span>
              <button type="button" onClick={() => setShowSideDetails(false)} className="p-1 hover:bg-slate-200 rounded">
                <X size={15} />
              </button>
            </div>

            {activeSideFile ? (
              <div className="space-y-4">
                <div className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FileSpreadsheet size={40} className="text-[#107c41]" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 break-words">{activeSideFile.name}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{formatSize(activeSideFile.size)}</div>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewFile(activeSideFile)}
                  className="btn btn-primary w-full h-8 text-xs font-bold"
                >
                  <Eye size={13} /> Abrir en Microsoft 365
                </button>

                <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="font-bold uppercase text-slate-400 block mb-0.5">Ubicación</span>
                    <span className="text-slate-600 dark:text-slate-400 break-words">{activeSideFile.folderPath}</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase text-slate-400 block mb-0.5">Propietario</span>
                    <span className="text-slate-600 dark:text-slate-400">Nereyda Huachua Flores</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400">
                Selecciona un archivo o carpeta para ver sus detalles.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visor Modal de Microsoft 365 */}
      {previewFile && (
        <FileViewerModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      {/* Modal Nueva Carpeta */}
      {newFolderModal && (
        <div className="modal-backdrop" onClick={() => setNewFolderModal(false)}>
          <div className="modal-panel max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm">Nueva Carpeta</h3>
              <button type="button" className="btn-icon" onClick={() => setNewFolderModal(false)}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-4">
              <input
                className="input w-full"
                placeholder="Nombre de la carpeta…"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1 text-xs" onClick={() => setNewFolderModal(false)}>Cancelar</button>
                <button type="button" className="btn btn-primary flex-1 text-xs" onClick={handleCreateFolder}>Crear</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
