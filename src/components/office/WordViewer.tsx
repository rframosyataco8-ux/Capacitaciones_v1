import { useState } from 'react'
import { FileText, Download, Printer, Search, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react'

interface WordViewerProps {
  fileName: string
  blob?: Blob
  onDownload?: () => void
}

export default function WordViewer({ fileName, blob, onDownload }: WordViewerProps) {
  const [activeTab, setActiveTab] = useState('Inicio')

  const sampleDoc = {
    title: 'PROCEDIMIENTO OPERATIVO ESTÁNDAR — POES 003',
    subtitle: 'LIMPIEZA Y DESINFECCIÓN DE LÍNEAS DE MOLIENDA Y PRENSADO DE CACAO',
    code: 'POES-ROMEX-003 · VERSIÓN 4.2',
    date: '2026-01-15',
    sections: [
      {
        heading: '1. OBJETIVO',
        content: 'Establecer los lineamientos y pasos estandarizados para la correcta limpieza y desinfección de los molinos de bolas, refinadoras y prensas hidráulicas de manteca y torta de cacao, previniendo la contaminación cruzada y acumulación de residuos grasos.',
      },
      {
        heading: '2. ALCANCE',
        content: 'Aplica a todo el personal de saneamiento y producción de la Planta de Cacao Chincha de EXPORTADORA ROMEX S.A.',
      },
      {
        heading: '3. RESPONSABILIDADES',
        content: 'El Jefe de Calidad e Inocuidad es responsable de auditar el cumplimiento del presente procedimiento. El Supervisor de Planta es responsable de autorizar el reinicio de operaciones tras la verificación pre-operacional.',
      },
      {
        heading: '4. MATERIALES Y QUÍMICOS PERMITIDOS',
        content: 'Detergente alcalino grado alimentario al 2% (pH 11.5 - 12.0), solución desinfectante de ácido peracético a 150-200 ppm, agua potable a 65°C a presión, paños estériles no tejidos de un solo uso.',
      },
    ],
  }

  const RIBBON_TABS = ['Archivo', 'Inicio', 'Insertar', 'Disposición', 'Referencias', 'Revisar', 'Vista', 'Ayuda']

  return (
    <div className="w-full h-full flex flex-col bg-[#f3f2f1] text-slate-900 font-sans select-none overflow-hidden">
      {/* 1. Header Azul Word Online */}
      <div className="h-10 bg-[#185abd] px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white text-[#185abd] flex items-center justify-center font-bold text-xs shadow-sm">
              W
            </div>
            <span className="font-semibold text-sm truncate max-w-xs">{fileName}</span>
            <span className="text-[10px] opacity-80 bg-[#103d80] px-2 py-0.5 rounded">Documento ROMEX</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-semibold"
            >
              <Download size={13} /> Descargar
            </button>
          )}
        </div>
      </div>

      {/* 2. Ribbon Tabs */}
      <div className="bg-[#f3f2f1] border-b border-slate-300 px-3 flex items-center gap-1 text-[12px] shrink-0">
        {RIBBON_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-[#185abd] text-[#185abd] font-semibold bg-white'
                : 'border-transparent text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Toolbar */}
      <div className="bg-[#f3f2f1] border-b border-slate-300 px-4 py-1.5 flex items-center gap-3 text-xs shrink-0">
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded font-bold"><Bold size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded italic"><Italic size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded underline"><Underline size={13} /></button>
        </div>
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded"><AlignLeft size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded"><AlignCenter size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded"><AlignRight size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded"><AlignJustify size={13} /></button>
        </div>
        <div className="text-[11px] text-slate-500">Vista de Documento Controlado</div>
      </div>

      {/* 4. Canvas de Página A4 */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-300">
        <div className="w-full max-w-3xl bg-white shadow-2xl rounded-sm p-12 text-slate-900 font-serif leading-relaxed border border-slate-300">
          {/* Encabezado Institucional */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-start">
            <div>
              <div className="font-sans font-bold text-xs tracking-widest text-[#185abd]">EXPORTADORA ROMEX S.A.</div>
              <h1 className="font-sans font-black text-base mt-1 text-slate-900">{sampleDoc.title}</h1>
              <p className="font-sans text-xs text-slate-600 font-semibold mt-0.5">{sampleDoc.subtitle}</p>
            </div>
            <div className="text-right font-sans text-[10px] text-slate-500 space-y-0.5">
              <div className="font-mono font-bold text-slate-700">{sampleDoc.code}</div>
              <div>Fecha: {sampleDoc.date}</div>
              <div className="text-emerald-700 font-semibold">Estado: APROBADO</div>
            </div>
          </div>

          {/* Cuerpo del documento */}
          <div className="space-y-6 text-sm text-slate-800">
            {sampleDoc.sections.map((s, idx) => (
              <div key={idx} className="space-y-1.5">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-[#185abd]">
                  {s.heading}
                </h3>
                <p className="text-justify leading-relaxed">
                  {s.content}
                </p>
              </div>
            ))}
          </div>

          {/* Pie de página */}
          <div className="mt-16 pt-4 border-t border-slate-300 flex justify-between items-center text-[10px] font-sans text-slate-500">
            <span>Sistema Integrado de Gestión · Planta Chincha</span>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Status Bar */}
      <div className="h-6 bg-[#f3f2f1] border-t border-slate-300 px-4 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
        <span>Página 1 de 1 · 184 palabras</span>
        <span>Español (Perú) · 100%</span>
      </div>
    </div>
  )
}

