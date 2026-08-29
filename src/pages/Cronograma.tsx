import { useState } from 'react'
import {
  Plus,
  Eye,
  Pencil,
  Trash2,
  Save,
  FileSpreadsheet,
  FileText,
  FileType,
  X,
} from 'lucide-react'

const DEMO = [
  {
    id: 'CAP-2026-001',
    tema: 'Inducci\u00f3n Seguridad Industrial',
    fecha: '10–12 Feb 2026',
    responsable: 'Ing. Mar\u00eda Torres',
  },
  {
    id: 'CAP-2026-002',
    tema: 'Buenas Pr\u00e1cticas de Manufactura',
    fecha: '05 Mar 2026',
    responsable: 'Lic. Carlos Ruiz',
  },
  {
    id: 'CAP-2026-003',
    tema: 'Manejo de Residuos S\u00f3lidos',
    fecha: '15–16 Abr 2026',
    responsable: 'Ing. Ana Paredes',
  },
  {
    id: 'CAP-2026-004',
    tema: 'Calidad e Inocuidad Alimentaria',
    fecha: '20 May 2026',
    responsable: 'Q.F. Luis Mendoza',
  },
]

export default function Cronograma() {
  const [year, setYear] = useState(2026)
  const [selected, setSelected] = useState<(typeof DEMO)[0] | null>(null)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[var(--border)] px-7 py-5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Cronograma</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Plan anual de capacitaciones
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(+e.target.value)}
              className="input w-[100px]"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button type="button" className="btn btn-primary">
              <Plus size={15} strokeWidth={2.2} />
              Nueva capacitaci\u00f3n
            </button>
            <div className="h-5 w-px bg-[var(--border)] mx-0.5" />
            <button type="button" className="btn btn-ghost" title="Exportar Excel">
              <FileSpreadsheet size={14} />
              Excel
            </button>
            <button type="button" className="btn btn-ghost" title="Exportar Word">
              <FileText size={14} />
              Word
            </button>
            <button type="button" className="btn btn-ghost" title="Exportar PDF">
              <FileType size={14} />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="table-wrap animate-in">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#f9fafb] border-b border-[var(--border)] text-left">
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[130px]">ID</th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]">Tema</th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[160px]">Fecha o periodo</th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[170px]">Responsable</th>
                <th className="px-5 py-3.5 font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)] w-[150px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {DEMO.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[#f9fafb] transition-colors duration-150 group"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <td className="px-5 py-3.5 font-mono text-[12px] text-[var(--text-secondary)]">{row.id}</td>
                  <td className="px-5 py-3.5 font-medium text-[var(--text)]">{row.tema}</td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{row.fecha}</td>
                  <td className="px-5 py-3.5 text-[var(--text-secondary)]">{row.responsable}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Visualizar"
                        onClick={() => setSelected(row)}
                        className="btn-icon text-[var(--primary)] hover:bg-[var(--primary-soft)]"
                      >
                        <Eye size={15} />
                      </button>
                      <button type="button" title="Editar" className="btn-icon text-[var(--text-secondary)] hover:bg-[#f3f4f6]">
                        <Pencil size={15} />
                      </button>
                      <button type="button" title="Guardar" className="btn-icon text-[var(--success)] hover:bg-[var(--success-soft)]">
                        <Save size={15} />
                      </button>
                      <button type="button" title="Eliminar" className="btn-icon text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Visualizar */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <h2 className="text-[15px] font-semibold text-[var(--text)]">Detalle de capacitaci\u00f3n</h2>
              <button type="button" onClick={() => setSelected(null)} className="btn-icon text-[var(--text-secondary)]">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">ID</div>
                  <div className="font-mono text-[var(--text)]">{selected.id}</div>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Fecha / Periodo</div>
                  <div className="text-[var(--text)]">{selected.fecha}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Tema</div>
                  <div className="font-medium text-[var(--text)]">{selected.tema}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Responsable</div>
                  <div className="text-[var(--text)]">{selected.responsable}</div>
                </div>
              </div>
              <div className="pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Accesos directos</div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)]">Examen</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)]">PPTX</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)]">Word</span>
                  <span className="px-2.5 py-1 rounded-md bg-[#f3f4f6] text-[12px] text-[var(--text-secondary)]">Video</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
