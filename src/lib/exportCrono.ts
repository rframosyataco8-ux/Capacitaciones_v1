import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Capacitacion } from './db'

function safe(s: string) {
  return (s || '').replace(/[\x00-\x1f]/g, ' ').trim()
}

export function exportExcel(rows: Capacitacion[], year: number) {
  const data = rows.map((r) => ({
    Item: r.item,
    ID: r.codigo,
    Tema: safe(r.tema),
    'N\u00ba sesiones': r.sessions?.length || 0,
    Fechas: (r.sessions || []).map((s) => s.date).join(', '),
    Responsable: safe(r.responsable),
    Estado: r.estado,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Programa ${year}`)
  XLSX.writeFile(wb, `Programa_Formacion_ROMEX_${year}.xlsx`)
}

export function exportPDF(rows: Capacitacion[], year: number) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFontSize(11)
  doc.text('EXPORTADORA ROMEX S.A.', 14, 12)
  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text('Planta de cacao - Chincha  |  C\u00f3digo: HACCP 004', 14, 18)
  doc.setTextColor(0)
  doc.setFontSize(13)
  doc.text(`Programa Anual de Formaci\u00f3n ${year}`, 14, 26)

  autoTable(doc, {
    startY: 30,
    head: [['#', 'ID', 'Tema', 'Sesiones', 'Responsable']],
    body: rows.map((r) => [
      String(r.item),
      r.codigo,
      safe(r.tema).slice(0, 80),
      String(r.sessions?.length || 0),
      safe(r.responsable).slice(0, 40),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [11, 87, 208] },
  })

  doc.save(`Programa_Formacion_ROMEX_${year}.pdf`)
}

export function exportWord(rows: Capacitacion[], year: number) {
  const escape = (s: string) =>
    safe(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const trs = rows
    .map(
      (r) =>
        `<tr>
          <td>${r.item}</td>
          <td>${escape(r.codigo)}</td>
          <td>${escape(r.tema)}</td>
          <td>${r.sessions?.length || 0}</td>
          <td>${escape(r.responsable)}</td>
        </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Programa ${year}</title></head>
<body>
  <h2>EXPORTADORA ROMEX S.A.</h2>
  <p>Planta de cacao - Chincha | C\u00f3digo HACCP 004</p>
  <h3>Programa Anual de Formaci\u00f3n ${year}</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <thead><tr><th>#</th><th>ID</th><th>Tema</th><th>Sesiones</th><th>Responsable</th></tr></thead>
    <tbody>${trs}</tbody>
  </table>
  <p><small>Documento controlado \u00b7 Aseguramiento de Calidad</small></p>
</body></html>`

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Programa_Formacion_ROMEX_${year}.doc`
  a.click()
  URL.revokeObjectURL(a.href)
}
