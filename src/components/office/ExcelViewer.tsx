import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  FileSpreadsheet, Search, Plus, Check, ChevronDown, Download,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Filter,
  Calculator, Table as TableIcon, HelpCircle, Share2, Printer
} from 'lucide-react'

interface ExcelViewerProps {
  blob?: Blob
  fileName: string
  onDownload?: () => void
}

function getColumnLabel(index: number): string {
  let label = ''
  let num = index
  while (num >= 0) {
    label = String.fromCharCode((num % 26) + 65) + label
    num = Math.floor(num / 26) - 1
  }
  return label
}

export default function ExcelViewer({ blob, fileName, onDownload }: ExcelViewerProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [sheetData, setSheetData] = useState<any[][]>([])
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 })
  const [formulaValue, setFormulaValue] = useState<string>('')
  const [activeRibbonTab, setActiveRibbonTab] = useState<string>('Inicio')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  // Cargar libro desde Blob
  useEffect(() => {
    if (!blob) {
      // Datos demo estilo la captura de Romex si no hay blob
      const demoData = [
        ['', '', '', '', 'Torta Tipo 2', '', '', '', '', ''],
        ['', '57260822', 'MANUCHAR', '', '', '', '', '', '', 'Torta Alcalina'],
        ['TORTA NATURAL', '97260520_ 15 BOLSAS', '', '', '', '', '', '', '', '1.- Prender vapor para caldera'],
        ['TORTA ALCALINA', '', '', '', '', '', '', '', '', '2.- Incorporación de torta alcalina y grasa'],
        ['Cocoa en polvo', '', '', '', '', '', '', '', '', '3.- Preparación de solución alcalinizante'],
        ['CARBONATO POTASIO', 'M242811 KG CARBONATO: 6,5', '', '', '', '', '', '', '', '4.- Ingredientes'],
      ]
      setSheetNames(['TRAZABILIDAD', 'Hoja1', 'Sheet2'])
      setActiveSheet('TRAZABILIDAD')
      setSheetData(demoData)
      setLoading(false)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        setWorkbook(wb)
        setSheetNames(wb.SheetNames)
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0]
          setActiveSheet(firstSheet)
          loadSheetData(wb, firstSheet)
        }
      } catch (err) {
        console.error('Error al leer Excel:', err)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(blob)
  }, [blob])

  function loadSheetData(wb: XLSX.WorkBook, sheetName: string) {
    const ws = wb.Sheets[sheetName]
    if (!ws) {
      setSheetData([])
      return
    }
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][]
    setSheetData(rawData)
  }

  function handleSelectSheet(name: string) {
    setActiveSheet(name)
    if (workbook) {
      loadSheetData(workbook, name)
    }
    setSelectedCell({ row: 0, col: 0 })
  }

  // Celda seleccionada
  const cellAddress = useMemo(() => {
    return `${getColumnLabel(selectedCell.col)}${selectedCell.row + 1}`
  }, [selectedCell])

  const currentCellValue = useMemo(() => {
    if (sheetData[selectedCell.row] && sheetData[selectedCell.row][selectedCell.col] !== undefined) {
      return String(sheetData[selectedCell.row][selectedCell.col])
    }
    return ''
  }, [sheetData, selectedCell])

  useEffect(() => {
    setFormulaValue(currentCellValue)
  }, [currentCellValue])

  function handleCellChange(row: number, col: number, value: string) {
    const next = [...sheetData]
    while (next.length <= row) next.push([])
    while (next[row].length <= col) next[row].push('')
    next[row][col] = value
    setSheetData(next)
  }

  // Dimensiones de la cuadrícula
  const rowCount = Math.max(sheetData.length + 15, 45)
  const colCount = Math.max(Math.max(...sheetData.map((r) => r.length), 0) + 10, 26)

  const RIBBON_TABS = ['Archivo', 'Inicio', 'Insertar', 'Compartir', 'Diseño de página', 'Fórmulas', 'Datos', 'Revisar', 'Vista', 'Automatizar', 'Ayuda']

  return (
    <div className="w-full h-full flex flex-col bg-white text-slate-900 font-sans select-none overflow-hidden">
      {/* 1. Barra Superior Verde Oficial Excel Online */}
      <div className="h-10 bg-[#107c41] px-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-white text-[#107c41] flex items-center justify-center font-bold text-xs shadow-sm">
              X
            </div>
            <span className="font-semibold text-sm truncate max-w-xs">{fileName}</span>
            <span className="text-[10px] opacity-80 bg-[#0b5a2f] px-2 py-0.5 rounded">Guardado en ROMEX Drive</span>
          </div>
        </div>

        {/* Buscador central estilo SharePoint */}
        <div className="hidden md:flex items-center gap-2 bg-[#0b5a2f] px-3 py-1 rounded-md text-xs w-96 max-w-md">
          <Search size={13} className="opacity-80" />
          <input
            className="bg-transparent border-0 text-white placeholder:text-white/60 focus:outline-none w-full text-xs"
            placeholder="Buscar herramientas, ayuda y mucho más (Alt + Q)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-xs font-semibold transition-colors"
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
            onClick={() => setActiveRibbonTab(tab)}
            className={`px-3 py-1.5 font-medium transition-colors border-b-2 ${
              activeRibbonTab === tab
                ? 'border-[#107c41] text-[#107c41] font-semibold bg-white'
                : 'border-transparent text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Ribbon Tools Toolbar */}
      <div className="bg-[#f3f2f1] border-b border-slate-300 px-4 py-1.5 flex items-center gap-4 text-xs shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded font-bold" title="Negrita"><Bold size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded italic" title="Cursiva"><Italic size={13} /></button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded" title="Alinear a la izquierda"><AlignLeft size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded" title="Centrar"><AlignCenter size={13} /></button>
          <button type="button" className="p-1.5 hover:bg-slate-200 rounded" title="Alinear a la derecha"><AlignRight size={13} /></button>
        </div>

        <div className="flex items-center gap-2 border-r border-slate-300 pr-3">
          <button type="button" className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs">
            <Calculator size={13} className="text-[#107c41]" />
            <span>Autosuma</span>
          </button>
          <button type="button" className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-2xs">
            <Filter size={13} className="text-slate-600" />
            <span>Filtro</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Modo Edición Rápida · Cambios sincronizados
        </div>
      </div>

      {/* 4. Formula Bar */}
      <div className="bg-white border-b border-slate-300 px-3 py-1 flex items-center gap-2 text-xs shrink-0">
        {/* Name Box (ej. A1, AB5844) */}
        <div className="w-20 px-2 py-0.5 border border-slate-300 rounded bg-slate-50 font-mono text-center font-semibold text-slate-700">
          {cellAddress}
        </div>

        <div className="text-slate-400 font-serif italic text-sm font-bold px-1 select-none">
          fx
        </div>

        {/* Formula Input */}
        <input
          className="flex-1 px-2 py-0.5 border border-transparent hover:border-slate-300 focus:border-[#107c41] rounded focus:outline-none font-mono text-xs text-slate-800"
          value={formulaValue}
          onChange={(e) => {
            setFormulaValue(e.target.value)
            handleCellChange(selectedCell.row, selectedCell.col, e.target.value)
          }}
          placeholder="Escribe un valor o fórmula…"
        />
      </div>

      {/* 5. Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-slate-100 relative">
        <table className="border-collapse table-fixed text-xs bg-white min-w-full">
          <thead>
            <tr className="bg-[#f3f2f1] sticky top-0 z-10">
              <th className="w-12 h-6 border border-slate-300 bg-[#e1dfdd] text-[10px] font-semibold text-slate-600 text-center select-none sticky left-0 z-20" />
              {Array.from({ length: colCount }).map((_, colIdx) => (
                <th
                  key={colIdx}
                  className={`w-28 h-6 border border-slate-300 text-[11px] font-medium text-slate-700 text-center select-none ${
                    selectedCell.col === colIdx ? 'bg-[#c8e6c9] font-bold text-[#107c41]' : 'bg-[#f3f2f1]'
                  }`}
                >
                  {getColumnLabel(colIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {/* Row Number */}
                <td
                  className={`w-12 h-6 border border-slate-300 text-[10px] font-medium text-center select-none sticky left-0 z-10 ${
                    selectedCell.row === rowIdx ? 'bg-[#c8e6c9] font-bold text-[#107c41]' : 'bg-[#f3f2f1] text-slate-600'
                  }`}
                >
                  {rowIdx + 1}
                </td>

                {/* Cells */}
                {Array.from({ length: colCount }).map((_, colIdx) => {
                  const cellVal = sheetData[rowIdx] && sheetData[rowIdx][colIdx] !== undefined ? String(sheetData[rowIdx][colIdx]) : ''
                  const isSelected = selectedCell.row === rowIdx && selectedCell.col === colIdx

                  return (
                    <td
                      key={colIdx}
                      onClick={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                      className={`h-6 border border-slate-200 px-2 py-0.5 truncate text-[11px] font-normal transition-colors cursor-cell relative ${
                        isSelected
                          ? 'ring-2 ring-[#107c41] bg-[#e8f5e9] z-5 font-semibold text-[#107c41]'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {cellVal}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. Bottom Sheet Tabs Bar (estilo Excel Online) */}
      <div className="h-8 bg-[#f3f2f1] border-t border-slate-300 px-3 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-1 overflow-x-auto">
          {sheetNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelectSheet(name)}
              className={`px-3 py-1 text-[11px] font-medium border-t-2 transition-all ${
                activeSheet === name
                  ? 'bg-white border-[#107c41] text-[#107c41] font-bold shadow-xs'
                  : 'bg-transparent border-transparent text-slate-700 hover:bg-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const newName = `Hoja ${sheetNames.length + 1}`
              setSheetNames((prev) => [...prev, newName])
              handleSelectSheet(newName)
            }}
            className="p-1 hover:bg-slate-300 rounded text-slate-600 ml-1"
            title="Nueva hoja"
          >
            <Plus size={13} />
          </button>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
          <span>{sheetNames.length} hojas</span>
          <span className="hidden sm:inline">Listo</span>
        </div>
      </div>
    </div>
  )
}

