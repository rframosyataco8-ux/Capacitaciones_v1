import { useState } from 'react'
import { FolderOpen, ChevronRight, ChevronDown, Upload } from 'lucide-react'

// Estructura demo que se creará automáticamente al generar el cronograma
const DEMO_TREE = {
  'Cronograma de Capacitaciones - 2026': [
    'Inducción Seguridad Industrial',
    'Buenas Prácticas de Manufactura',
    'Manejo de Residuos Sólidos',
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
      <div className="bg-white border-b border-[#e8eaed] px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#202124]">Data Storage</h1>
            <p className="text-sm text-[#5f6368] mt-0.5">
              Carpetas por año y tema · Se crean automáticamente con el cronograma
            </p>
          </div>
          <label className="h-9 px-4 rounded-lg bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2 cursor-pointer">
            <Upload size={16} />
            Subir archivo
            <input type="file" multiple className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi,.png,.jpg,.jpeg,.zip" />
          </label>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Árbol de carpetas */}
        <div className="w-80 bg-white border-r border-[#e8eaed] overflow-y-auto p-3">
          {Object.entries(DEMO_TREE).map(([year, temas]) => (
            <div key={year} className="mb-1">
              <button
                type="button"
                onClick={() => toggleYear(year)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#202124] hover:bg-[#f1f3f4] text-left"
              >
                {openYears[year] ? (
                  <ChevronDown size={16} className="text-[#5f6368] shrink-0" />
                ) : (
                  <ChevronRight size={16} className="text-[#5f6368] shrink-0" />
                )}
                <FolderOpen size={16} className="text-[#1a73e8] shrink-0" />
                <span className="truncate">{year}</span>
              </button>
              {openYears[year] && (
                <div className="ml-4 mt-0.5">
                  {temas.map((tema) => (
                    <button
                      key={tema}
                      type="button"
                      onClick={() => setSelectedTema(tema)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left ${
                        selectedTema === tema
                          ? 'bg-[#e8f0fe] text-[#1967d2] font-medium'
                          : 'text-[#5f6368] hover:bg-[#f1f3f4]'
                      }`}
                    >
                      <FolderOpen size={14} className="shrink-0 opacity-70" />
                      <span className="truncate">{tema}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contenido de la carpeta seleccionada */}
        <div className="flex-1 overflow-auto p-6">
          {selectedTema ? (
            <div>
              <h2 className="text-lg font-medium text-[#202124] mb-1">{selectedTema}</h2>
              <p className="text-sm text-[#5f6368] mb-6">Materiales de la capacitación</p>
              <div
                className="border-2 border-dashed border-[#dadce0] rounded-xl p-12 text-center text-sm text-[#80868b] bg-white"
                onDragOver={(e) => e.preventDefault()}
              >
                Arrastra aquí archivos (PPTX, Word, Excel, videos, PDF…)
                <br />
                o usa el botón “Subir archivo”
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#80868b] text-sm">
              Selecciona un tema para ver o subir materiales
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
