import { useState, useEffect } from 'react'
import {
  Film, Play, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Download, Search, Plus, Layout, Presentation, Sparkles, MessageSquare
} from 'lucide-react'

interface SlideItem {
  id: number
  title: string
  subtitle?: string
  bullets?: string[]
  themeColor?: string
  bgPattern?: string
}

interface PowerPointViewerProps {
  fileName: string
  blob?: Blob
  onDownload?: () => void
}

export default function PowerPointViewer({ fileName, blob, onDownload }: PowerPointViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('Inicio')
  const [showNotes, setShowNotes] = useState(false)

  // Diapositivas generadas basadas en el archivo de Romex (estilo la captura de análisis microbiológico)
  const slides: SlideItem[] = [
    {
      id: 1,
      title: 'MANUAL DE PREPARACIÓN DE MEDIOS DE CULTIVO',
      subtitle: 'PROGRAMA DE ASEGURAMIENTO DE LA CALIDAD · PLANTA DE CACAO CHINCHA',
      bullets: [
        'Manual de preparación de soluciones',
        'Manual de métodos de análisis microbiológico',
        'Procedimientos estandarizados y resultados reproducibles',
      ],
      themeColor: '#0f4c81',
    },
    {
      id: 2,
      title: 'SOLUCIÓN DILUYENTE PARA MUESTREO',
      subtitle: 'AGUA PEPTONADA 0.1% Y BUFFER FOSFATO',
      bullets: [
        'Pesaje riguroso en balanza analítica calibrada (±0.01g)',
        'Disolución completa en agua destilada a 45°C',
        'Esterilización en autoclave a 121°C por 15 minutos',
        'Control de pH final: 7.0 ± 0.2 a 25°C',
      ],
      themeColor: '#1a6bb0',
    },
    {
      id: 3,
      title: 'MÉTODO DE RECUENTO EN PLACA (AGAR PCA)',
      subtitle: 'DETERMINACIÓN DE AEROBIOS MESÓFILOS VIABLES',
      bullets: [
        'Inoculación por siembra en profundidad con 1 mL de muestra',
        'Homogeneización suave en cruz (8 movimientos)',
        'Incubación a 35°C ± 1°C durante 48 ± 2 horas',
        'Conteo de colonias entre 30 y 300 UFC/g',
      ],
      themeColor: '#047857',
    },
    {
      id: 4,
      title: 'DETECCIÓN Y CONTROL DE SALMONELLA SPP.',
      subtitle: 'CRITERIO DE INOCUIDAD MICROBIOLÓGICA CRÍTICO (PCC)',
      bullets: [
        'Pre-enriquecimiento en Agua Peptonada Tamponada (BPW)',
        'Enriquecimiento selectivo en caldos RVS y TT',
        'Aislamiento en placas de Agar XLD y Hektoen',
        'Confirmación bioquímica y serológica obligatoria',
      ],
      themeColor: '#b91c1c',
    },
    {
      id: 5,
      title: 'VERIFICACIÓN DE LÍMITES Y ACCIONES CORRECTIVAS',
      subtitle: 'PLAN HACCP 004 · REGISTRO Y TRAZABILIDAD',
      bullets: [
        'Límite Aceptable: Ausencia de Salmonella en 25g de licor y manteca',
        'Retención inmediata de lote ante presunto positivo',
        'Investigación de causa raíz y sanitización profunda de línea',
      ],
      themeColor: '#c4a35a',
    },
  ]

  // Teclado para avanzar diapositivas
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => Math.max(0, prev - 1))
      } else if (e.key === 'Escape') {
        setIsFullscreen(false)
      } else if (e.key === 'F5') {
        e.preventDefault()
        setIsFullscreen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length])

  const slide = slides[currentSlide]

  const RIBBON_TABS = ['Archivo', 'Inicio', 'Insertar', 'Dibujo', 'Diseño', 'Transiciones', 'Animaciones', 'Presentación con diapositivas', 'Revisar', 'Vista', 'Ayuda']

  return (
    <div className="w-full h-full flex flex-col bg-[#f3f2f1] text-slate-900 font-sans select-none overflow-hidden">
      {/* 1. Header Rojo/Naranja PowerPoint Online */}
      <div className="h-10 bg-[#d83b01] px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white text-[#d83b01] flex items-center justify-center font-bold text-xs shadow-sm">
              P
            </div>
            <span className="font-semibold text-sm truncate max-w-xs">{fileName}</span>
            <span className="text-[10px] opacity-80 bg-[#a62d00] px-2 py-0.5 rounded">Presentación ROMEX</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1.5 bg-white text-[#d83b01] px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-slate-100 transition-colors"
          >
            <Play size={12} fill="currentColor" /> Presentar (F5)
          </button>
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
                ? 'border-[#d83b01] text-[#d83b01] font-semibold bg-white'
                : 'border-transparent text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Main Workspace: Thumbnails sidebar + Slide Canvas */}
      <div className="flex-1 flex min-h-0 bg-slate-200">
        {/* Thumbnails Sidebar */}
        <div className="w-52 border-r border-slate-300 bg-[#f3f2f1] p-3 overflow-y-auto space-y-3 shrink-0">
          {slides.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className="flex items-start gap-2 cursor-pointer group"
            >
              <span className={`text-[11px] font-bold w-4 text-right pt-2 ${currentSlide === idx ? 'text-[#d83b01]' : 'text-slate-500'}`}>
                {idx + 1}
              </span>
              <div
                className={`flex-1 aspect-[16/9] rounded-md p-2 flex flex-col justify-between shadow-xs transition-all border-2 bg-white ${
                  currentSlide === idx
                    ? 'border-[#d83b01] shadow-md ring-2 ring-[#d83b01]/20'
                    : 'border-slate-300 group-hover:border-slate-400'
                }`}
              >
                <div className="h-2 w-12 rounded-full" style={{ background: s.themeColor }} />
                <div className="text-[8px] font-bold line-clamp-2 text-slate-800 leading-tight">
                  {s.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 p-6 flex items-center justify-center overflow-auto relative">
          <div className="w-full max-w-4xl aspect-[16/9] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col justify-between p-8 border border-slate-300 relative">
            {/* Header decorativo de la diapositiva */}
            <div className="flex items-center justify-between pb-4 border-b-2" style={{ borderColor: slide.themeColor }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: slide.themeColor }}>
                  {currentSlide + 1}
                </div>
                <div>
                  <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900 leading-tight">
                    {slide.title}
                  </h2>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 mt-0.5">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                EXPORTADORA ROMEX S.A.
              </div>
            </div>

            {/* Cuerpo de la Diapositiva */}
            <div className="flex-1 py-6 flex flex-col justify-center">
              <div className="space-y-3.5 max-w-2xl">
                {slide.bullets?.map((bullet, bIdx) => (
                  <div key={bIdx} className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: slide.themeColor }} />
                    <span className="text-[14px] font-medium text-slate-800 leading-relaxed">
                      {bullet}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer de la Diapositiva */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
              <span>Aseguramiento de la Calidad e Inocuidad</span>
              <span>Planta Chincha · Código HACCP 004</span>
              <span className="font-bold text-slate-700">Pág. {currentSlide + 1} / {slides.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Presentation Controls Bar */}
      <div className="h-8 bg-[#f3f2f1] border-t border-slate-300 px-4 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
            disabled={currentSlide === 0}
            className="p-1 hover:bg-slate-300 rounded disabled:opacity-30"
            title="Diapositiva anterior"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-semibold text-slate-700 text-[11px]">
            Diapositiva {currentSlide + 1} de {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-1 hover:bg-slate-300 rounded disabled:opacity-30"
            title="Siguiente diapositiva"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-300 text-[11px] font-semibold text-slate-700"
          >
            <Maximize2 size={12} /> Pantalla completa
          </button>
        </div>
      </div>

      {/* 5. MODO PRESENTACIÓN PANTALLA COMPLETA (F5) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col justify-between p-8 text-white animate-in">
          {/* Header Presentación */}
          <div className="flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
            <span className="font-bold text-sm tracking-wider uppercase text-amber-400">
              {slide.subtitle}
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-white/20 rounded-full text-white"
              title="Salir (Esc)"
            >
              <Minimize2 size={20} />
            </button>
          </div>

          {/* Contenido Diapositiva Fullscreen */}
          <div className="max-w-4xl mx-auto w-full space-y-8">
            <h1 className="text-[36px] font-black leading-tight text-white border-b-2 pb-4 border-amber-500">
              {slide.title}
            </h1>
            <div className="space-y-5">
              {slide.bullets?.map((b, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <span className="w-3 h-3 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <span className="text-[20px] font-medium text-slate-100 leading-snug">{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Barra de control inferior en presentación */}
          <div className="flex items-center justify-between text-xs opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold"
              >
                ◀ Anterior
              </button>
              <button
                type="button"
                onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold"
              >
                Siguiente ▶
              </button>
            </div>
            <span className="font-mono text-sm">
              {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

