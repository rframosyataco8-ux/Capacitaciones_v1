import { useState } from 'react'
import { FolderOpen, ChevronRight, ChevronDown, Upload, File } from 'lucide-react'

const DEMO_TREE: Record<string, string[]> = {
  'Cronograma de Capacitaciones - 2026': [
    'Inducci\u00f3n Seguridad Industrial',
    'Buenas Pr\u00e1cticas de Manufactura',
    'Manejo de Residuos S\u00f3lidos',
    'Calidad e Inocuidad',
    'Primeros Auxilios',
  ],
}

export default function DataStorage() {
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({
    'Cronograma de Capacitaciones - 2026': true,
  })
  const [selectedTema, setSelectedTema] = useState<string | null>(null)

  function toggleYear(year: string) {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[var(--border)] px-7 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Data Storage</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Carpetas por a\u00f1o y tema · Se crean autom\u00e1ticamente con el cronograma
            </p>
          </div>
          <label className="btn btn-primary cursor-pointer">
            <Upload size={15} strokeWidth={2.2} />
            Subir archivo
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi,.png,.jpg,.jpeg,.zip"
            />
          </label>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Tree */}
        <div className="w-[300px] bg-white border-r border-[var(--border)] overflow-y-auto p-3">
          {Object.entries(DEMO_TREE).map(([year, temas]) => (
            <div key={year} className="mb-1">
              <button
                type="button"
                onClick={() => toggleYear(year)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium text-[var(--text)] hover:bg-[#f3f4f6] text-left transition-colors"
              >
                {openYears[year] ? (
                  <ChevronDown size={15} className="text-[var(--text-muted)] shrink-0" />
                ) : (
                  <ChevronRight size={15} className="text-[var(--text-muted)] shrink-0" />
                )}
                <FolderOpen size={15} className="text-[var(--primary)] shrink-0" />
                <span className="truncate">{year}</span>
              </button>
              {openYears[year] && (
                <div className="ml-3 mt-0.5 space-y-0.5 animate-in">
                  {temas.map((tema) => (
                    <button
                      key={tema}
                      type="button"
                      onClick={() => setSelectedTema(tema)}
                      className={`w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12.5px] text-left transition-all duration-150 ${
                        selectedTema === tema
                          ? 'bg-[var(--primary-soft)] text-[var(--primary-text)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[#f3f4f6] hover:text-[var(--text)]'
                      }`}
                    >
                      <FolderOpen size={13} className="shrink-0 opacity-60" />
                      <span className="truncate">{tema}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedTema ? (
            <div className="animate-in">
              <h2 className="text-[16px] font-semibold text-[var(--text)] mb-0.5">{selectedTema}</h2>
              <p className="text-[13px] text-[var(--text-secondary)] mb-5">Materiales de la capacitaci\u00f3n</p>
              <div
                className="border-2 border-dashed border-[var(--border)] rounded-xl p-14 text-center bg-white transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]/30"
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="w-11 h-11 rounded-xl bg-[#f3f4f6] flex items-center justify-center mx-auto mb-3">
                  <File size={20} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                  Arrastra archivos aqu\u00ed
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1">
                  PPTX, Word, Excel, videos, PDF…
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#f3f4f6] flex items-center justify-center mx-auto mb-3">
                  <FolderOpen size={22} className="text-[var(--text-muted)]" />
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">
                  Selecciona un tema para ver o subir materiales
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
