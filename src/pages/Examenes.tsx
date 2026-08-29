import { Plus, ClipboardList } from 'lucide-react'

export default function Examenes() {
  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-[#e8eaed] px-8 py-5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#202124]">Exámenes</h1>
            <p className="text-sm text-[#5f6368] mt-0.5">
              Constructor de exámenes (estilo Forms) enlazados a capacitaciones
            </p>
          </div>
          <button
            type="button"
            className="h-9 px-4 rounded-lg bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc] flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo examen
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-xl border border-[#e8eaed] shadow-sm p-16 flex flex-col items-center justify-center text-center">
          <ClipboardList size={48} className="text-[#dadce0] mb-4" />
          <p className="text-[#5f6368] text-sm max-w-md">
            Aquí crearás exámenes con preguntas de opción múltiple, verdadero/falso y abiertas,
            y los enlazarás a cada capacitación del cronograma.
          </p>
        </div>
      </div>
    </div>
  )
}
