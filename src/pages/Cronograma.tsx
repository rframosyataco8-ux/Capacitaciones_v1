import { useState } from 'react'
import {
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Save,
  FileSpreadsheet,
  FileText,
  FileType,
} from 'lucide-react'

// Datos de ejemplo mientras se conecta IndexedDB
const DEMO = [
  {
    id: 'CAP-2026-001',
    tema: 'Inducción Seguridad Industrial',
    fecha: '2026-02-10 / 2026-02-12',
    responsable: 'Ing. María Torres',
  },
  {
    id: 'CAP-2026-002',
    tema: 'Buenas Prácticas de Manufactura',
    fecha: '2026-03-05',
    responsable: 'Lic. Carlos Ruiz',
  },
  {
    id: 'CAP-2026-003',
    tema: 'Manejo de Residuos Sólidos',
    fecha: '2026-04-15 / 2026-04-16',
    responsable: 'Ing. Ana Paredes',
  },
]

export default function Cronograma() {
  const [year, setYear] = useState(2026)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[#e8eaed] px-8 py-5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal text-[#202124]">Cronograma</h1>
            <p className="text-sm text-[#5f6368] mt-0.5">
              Plan anual de capacitaciones · Tabla profesional
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#dadce0] text-sm outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#e8f0fe] bg-white"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="h-9 px-4 rounded-lg bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2"
            >
              <Plus size={16} />
              Nueva capacitación
            </button>
            <div className="h-6 w-px bg-[#dadce0] mx-1" />
            <button
              type="button"
              className="h-9 px-3 rounded-lg border border-[#dadce0] text-[#5f6368] text-sm font-medium hover:bg-[#f1f3f4] flex items-center gap-1.5"
              title="Exportar Excel"
            >
              <FileSpreadsheet size={15} />
              Excel
            </button>
            <button
              type="button"
              className="h-9 px-3 rounded-lg border border-[#dadce0] text-[#5f6368] text-sm font-medium hover:bg-[#f1f3f4] flex items-center gap-1.5"
              title="Exportar Word"
            >
              <FileText size={15} />
              Word
            </button>
            <button
              type="button"
              className="h-9 px-3 rounded-lg border border-[#dadce0] text-[#5f6368] text-sm font-medium hover:bg-[#f1f3f4] flex items-center gap-1.5"
              title="Exportar PDF"
            >
              <FileType size={15} />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-[#e8eaed] text-left">
                <th className="px-5 py-3.5 font-medium text-[#5f6368] w-[140px]">ID</th>
                <th className="px-5 py-3.5 font-medium text-[#5f6368]">TEMA</th>
                <th className="px-5 py-3.5 font-medium text-[#5f6368] w-[200px]">FECHA O PERIODO</th>
                <th className="px-5 py-3.5 font-medium text-[#5f6368] w-[180px]">RESPONSABLE</th>
                <th className="px-5 py-3.5 font-medium text-[#5f6368] w-[160px] text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {DEMO.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#e8eaed] last:border-0 hover:bg-[#f8f9fa] transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-[#5f6368]">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-[#202124]">{row.tema}</td>
                  <td className="px-5 py-3.5 text-[#5f6368]">{row.fecha}</td>
                  <td className="px-5 py-3.5 text-[#5f6368]">{row.responsable}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Visualizar"
                        onClick={() => setSelected(row.id)}
                        className="p-1.5 rounded-full text-[#1967d2] hover:bg-[#e8f0fe]"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        title="Editar"
                        className="p-1.5 rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        title="Guardar"
                        className="p-1.5 rounded-full text-[#188038] hover:bg-[#e6f4ea]"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        className="p-1.5 rounded-full text-[#d93025] hover:bg-[#fce8e6]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {DEMO.length === 0 && (
            <div className="p-16 text-center text-[#80868b] text-sm">
              No hay capacitaciones para {year}. Crea la primera o genera la plantilla anual.
            </div>
          )}
        </div>
      </div>

      {/* Modal Visualizar (placeholder) */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/40 backdrop-blur-[2px]"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8eaed]">
              <h2 className="text-lg font-medium">Detalle de capacitación</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <p className="text-[#5f6368]">ID: <span className="text-[#202124] font-mono">{selected}</span></p>
              <p className="text-[#80868b]">Aquí se mostrarán todos los datos + enlaces a examen, PPTX, Word, video, etc.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
