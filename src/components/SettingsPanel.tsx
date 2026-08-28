import { Moon, Sun } from 'lucide-react'
import type { Note, Event, FileItem, Exam } from '../lib/db'

type Props = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  notes: Note[]
  events: Event[]
  files: FileItem[]
  exams: Exam[]
}

export default function SettingsPanel({ theme, onToggleTheme, notes, events, files, exams }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 max-w-2xl">
      <h1 className="text-[28px] font-normal mb-1">Configuracion</h1>
      <p className="text-sm text-[#5f6368] mb-8">Preferencias de Capacitaciones</p>
      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-[#e8eaed] p-6">
          <h2 className="text-base font-medium mb-4">Apariencia</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Tema</div>
              <div className="text-xs text-[#5f6368]">Claro u oscuro</div>
            </div>
            <button type="button" onClick={onToggleTheme}
              className="h-10 px-4 rounded-full border border-[#dadce0] flex items-center gap-2 text-sm font-medium hover:bg-[#f1f3f4]">
              {theme === 'dark' ? <><Sun size={16} /> Claro</> : <><Moon size={16} /> Oscuro</>}
            </button>
          </div>
        </section>
        <section className="bg-white rounded-2xl border border-[#e8eaed] p-6">
          <h2 className="text-base font-medium mb-4">Datos locales</h2>
          <p className="text-sm text-[#5f6368] mb-4">Todo se guarda en este navegador (IndexedDB).</p>
          <button type="button" onClick={() => {
            const data = { notes, events, files: files.map(({ blob, ...r }) => r), exams, exportedAt: new Date().toISOString() }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'capacitaciones-backup.json'; a.click()
          }} className="h-10 px-5 rounded-full bg-[#1a73e8] text-white text-sm font-medium hover:bg-[#1765cc]">Exportar backup JSON</button>
        </section>
        <section className="bg-white rounded-2xl border border-[#e8eaed] p-6">
          <h2 className="text-base font-medium mb-4">Acerca de</h2>
          <p className="text-sm text-[#5f6368] leading-relaxed">
            <strong className="text-[#202124]">Capacitaciones</strong> — vault, archivos, cronograma, examenes y grafo.
            Diseno Material + Obsidian.
          </p>
          <p className="text-xs text-[#80868b] mt-3">Version 1.5 · Local-first</p>
        </section>
        <section className="bg-white rounded-2xl border border-[#e8eaed] p-6">
          <h2 className="text-base font-medium mb-2">OnlyOffice (opcional)</h2>
          <p className="text-sm text-[#5f6368] mb-3">Para edicion Word/Excel/PPT casi Office Online:</p>
          <code className="block text-xs bg-[#f1f3f4] p-3 rounded-lg">docker compose up -d</code>
          <p className="text-xs text-[#80868b] mt-2">Luego http://localhost:8080</p>
        </section>
      </div>
    </div>
  )
}
