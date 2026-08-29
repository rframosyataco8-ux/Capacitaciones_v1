import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Capacitacion, Session } from './db'

function safe(s: string) {
  return (s || '').replace(/[\x00-\x1f]/g, ' ').trim()
}

function sessionsOf(r: Capacitacion): Session[] {
  if (r.sessions?.length) return r.sessions
  return (r.fechas || []).map((d) => ({ date: d, status: 'Programada' as const }))
}

export function exportExcel(rows: Capacitacion[], year: number) {
  const data = rows.map((r) => {
    const sess = sessionsOf(r)
    return {
      Item: r.item,
      ID: r.codigo,
      Tema: safe(r.tema),
      'Nº sesiones': sess.length,
      Fechas: sess.map((s) => s.date).join(', '),
      Responsable: safe(r.responsable),
      Estado: r.estado,
    }
  })

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
  doc.text('Planta de cacao - Chincha  |  Código: HACCP 004', 14, 18)
  doc.setTextColor(0)
  doc.setFontSize(13)
  doc.text(`Programa Anual de Formación ${year}`, 14, 26)

  autoTable(doc, {
    startY: 30,
    head: [['#', 'ID', 'Tema', 'Sesiones', 'Responsable']],
    body: rows.map((r) => [
      String(r.item),
      r.codigo,
      safe(r.tema).slice(0, 80),
      String(sessionsOf(r).length),
      safe(r.responsable).slice(0, 40),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 76, 129] },
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
          <td>${sessionsOf(r).length}</td>
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
  <p>Planta de cacao - Chincha | Código HACCP 004</p>
  <h3>Programa Anual de Formación ${year}</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <thead><tr><th>#</th><th>ID</th><th>Tema</th><th>Sesiones</th><th>Responsable</th></tr></thead>
    <tbody>${trs}</tbody>
  </table>
  <p><small>Documento controlado · Aseguramiento de Calidad</small></p>
</body></html>`

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Programa_Formacion_ROMEX_${year}.doc`
  a.click()
  URL.revokeObjectURL(a.href)
}
