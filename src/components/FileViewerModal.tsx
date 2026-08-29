import { useState, useEffect } from 'react'
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Image as ImageIcon,
  Film, Music, FileSpreadsheet, FileArchive, Info, Presentation
} from 'lucide-react'
import type { MaterialFile } from '../lib/db'
import ExcelViewer from './office/ExcelViewer'
import PowerPointViewer from './office/PowerPointViewer'
import WordViewer from './office/WordViewer'

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function getFileCategory(type: string, name: string): 'excel' | 'powerpoint' | 'word' | 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('sheet') || type.includes('excel')) return 'excel'
  if (['ppt', 'pptx'].includes(ext) || type.includes('presentation') || type.includes('powerpoint')) return 'powerpoint'
  if (['doc', 'docx'].includes(ext) || type.includes('word') || type.includes('document')) return 'word'
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (type.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video'
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return 'audio'
  if (type.startsWith('text/') || ['txt', 'md', 'json', 'js', 'ts', 'html', 'css'].includes(ext)) return 'text'
  return 'other'
}

export default function FileViewerModal({
  file,
  onClose,
}: {
  file: MaterialFile
  onClose: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showInfo, setShowInfo] = useState(false)

  const category = getFileCategory(file.type, file.name)

  useEffect(() => {
    if (!file.blob) return
    const url = URL.createObjectURL(file.blob)
    setBlobUrl(url)

    if (category === 'text') {
      file.blob.text().then(setTextContent).catch(() => setTextContent('No se pudo leer el contenido de texto.'))
    }

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file, category])

  function handleDownload() {
    if (blobUrl) {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = file.name
      a.click()
    } else if (file.blob) {
      const url = URL.createObjectURL(file.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // 1. Si es Excel, abrir la suite de Microsoft Excel Online
  if (category === 'excel') {
    return (
      <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in">
        <div className="w-full h-full max-w-7xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-400 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            title="Cerrar Excel Online"
          >
            <X size={15} />
          </button>
          <ExcelViewer blob={file.blob} fileName={file.name} onDownload={handleDownload} />
        </div>
      </div>
    )
  }

  // 2. Si es PowerPoint, abrir la suite de Microsoft PowerPoint Online
  if (category === 'powerpoint') {
    return (
      <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in">
        <div className="w-full h-full max-w-7xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-400 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            title="Cerrar PowerPoint Online"
          >
            <X size={15} />
          </button>
          <PowerPointViewer fileName={file.name} blob={file.blob} onDownload={handleDownload} />
        </div>
      </div>
    )
  }

  // 3. Si es Word, abrir la suite de Microsoft Word Online
  if (category === 'word') {
    return (
      <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in">
        <div className="w-full h-full max-w-6xl max-h-[94vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-400 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            title="Cerrar Word Online"
          >
            <X size={15} />
          </button>
          <WordViewer fileName={file.name} blob={file.blob} onDownload={handleDownload} />
        </div>
      </div>
    )
  }

  // 4. Otros formatos (Imágenes, PDF, Video, Audio, Texto)
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-panel max-w-5xl h-[88vh] flex flex-col shadow-2xl animate-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--surface)' }}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b flex items-center justify-between gap-4 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
              {category === 'image' && <ImageIcon size={16} />}
              {category === 'pdf' && <FileText size={16} />}
              {category === 'video' && <Film size={16} />}
              {category === 'audio' && <Music size={16} />}
              {category === 'other' && <FileArchive size={16} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold truncate">{file.name}</h3>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {formatSize(file.size)} · Subido el {new Date(file.createdAt).toLocaleDateString('es-PE')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {category === 'image' && (
              <>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
                  title="Alejar"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[11px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                  title="Acercar"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotar 90°"
                >
                  <RotateCw size={16} />
                </button>
              </>
            )}

            <button
              type="button"
              className={`btn-icon ${showInfo ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : ''}`}
              onClick={() => setShowInfo(!showInfo)}
              title="Ver detalles"
            >
              <Info size={16} />
            </button>
            <button
              type="button"
              className="btn btn-primary h-8 px-3 text-[12px]"
              onClick={handleDownload}
            >
              <Download size={14} /> Descargar
            </button>
            <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex min-h-0 relative bg-[var(--surface-2)]">
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
            {/* IMAGEN */}
            {category === 'image' && blobUrl && (
              <div className="max-w-full max-h-full flex items-center justify-center overflow-hidden">
                <img
                  src={blobUrl}
                  alt={file.name}
                  className="transition-transform duration-200 rounded-lg shadow-md max-w-full max-h-[70vh] object-contain"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                />
              </div>
            )}

            {/* PDF */}
            {category === 'pdf' && blobUrl && (
              <iframe
                src={`${blobUrl}#toolbar=1`}
                className="w-full h-full rounded-lg border shadow-sm bg-white"
                style={{ borderColor: 'var(--border)' }}
                title={file.name}
              />
            )}

            {/* VIDEO */}
            {category === 'video' && blobUrl && (
              <div className="max-w-4xl w-full">
                <video
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] rounded-xl shadow-lg bg-black"
                  src={blobUrl}
                >
                  Tu navegador no soporta reproducción de video.
                </video>
              </div>
            )}

            {/* AUDIO */}
            {category === 'audio' && blobUrl && (
              <div className="card p-8 max-w-md w-full text-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                  <Music size={32} />
                </div>
                <h4 className="font-bold text-[15px] mb-4 truncate">{file.name}</h4>
                <audio controls className="w-full" src={blobUrl}>
                  Tu navegador no soporta audio.
                </audio>
              </div>
            )}

            {/* TEXTO */}
            {category === 'text' && (
              <div className="w-full h-full card p-5 overflow-auto font-mono text-[12px] bg-[var(--surface)] text-[var(--text)]">
                <pre className="whitespace-pre-wrap leading-relaxed">{textContent || 'Cargando contenido…'}</pre>
              </div>
            )}

            {/* OTROS */}
            {category === 'other' && (
              <div className="card p-10 max-w-md text-center shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                  <FileArchive size={32} />
                </div>
                <h4 className="font-bold text-[16px] mb-1 truncate">{file.name}</h4>
                <p className="text-[12px] text-[var(--text-secondary)] mb-6">
                  Archivo binario. Descárgalo para abrirlo en tu aplicación local.
                </p>
                <button type="button" className="btn btn-primary mx-auto" onClick={handleDownload}>
                  <Download size={15} /> Descargar archivo ({formatSize(file.size)})
                </button>
              </div>
            )}
          </div>

          {/* Panel Lateral de Detalles */}
          {showInfo && (
            <div
              className="w-72 border-l p-5 bg-[var(--surface)] overflow-y-auto shrink-0 animate-in text-[13px] space-y-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <h4 className="font-bold text-[14px] pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                Detalles del Archivo
              </h4>
              <div>
                <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Nombre</span>
                <div className="font-medium break-words">{file.name}</div>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Tamaño</span>
                <div className="font-medium">{formatSize(file.size)} ({file.size.toLocaleString()} bytes)</div>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Tipo MIME</span>
                <div className="font-mono text-[11px] text-[var(--text-secondary)] break-words">{file.type || 'Desconocido'}</div>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Ubicación</span>
                <div className="text-[11px] text-[var(--text-secondary)] break-words">{file.folderPath}</div>
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-[var(--text-muted)]">Fecha de Carga</span>
                <div className="text-[12px]">{new Date(file.createdAt).toLocaleString('es-PE')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
