import { Plus, ClipboardList } from 'lucide-react'

export default function Examenes() {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[var(--border)] px-7 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-semibold text-[var(--text)] tracking-tight">Ex\u00e1menes</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
              Constructor de ex\u00e1menes enlazados a capacitaciones
            </p>
          </div>
          <button type="button" className="btn btn-primary">
            <Plus size={15} strokeWidth={2.2} />
            Nuevo examen
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-7">
        <div className="surface p-16 flex flex-col items-center justify-center text-center animate-in max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#f3f4f6] flex items-center justify-center mb-4">
            <ClipboardList size={26} className="text-[var(--text-muted)]" strokeWidth={1.6} />
          </div>
          <p className="text-[14px] font-medium text-[var(--text)] mb-1">Sin ex\u00e1menes a\u00fan</p>
          <p className="text-[13px] text-[var(--text-secondary)] max-w-xs leading-relaxed">
            Crea ex\u00e1menes con preguntas de opci\u00f3n m\u00faltiple, verdadero/falso y abiertas, y enl\u00e1zalos a cada capacitaci\u00f3n.
          </p>
        </div>
      </div>
    </div>
  )
}
