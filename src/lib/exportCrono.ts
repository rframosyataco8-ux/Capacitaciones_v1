import type { Event } from './db'

export function exportCronogramaWord(events: Event[], year: number) {
  const rows = [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      e =>
        `<tr>
          <td style="border:1px solid #dadce0;padding:8px">${e.date}</td>
          <td style="border:1px solid #dadce0;padding:8px">${e.time}</td>
          <td style="border:1px solid #dadce0;padding:8px">${escapeHtml(e.title)}</td>
          <td style="border:1px solid #dadce0;padding:8px">${escapeHtml(e.tipo)}</td>
          <td style="border:1px solid #dadce0;padding:8px">${escapeHtml(e.estado)}</td>
          <td style="border:1px solid #dadce0;padding:8px">${e.cupo}</td>
        </tr>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>Cronograma ${year}</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;color:#202124;margin:40px}
  h1{color:#1a73e8;font-weight:400;font-size:28px}
  table{border-collapse:collapse;width:100%;margin-top:24px}
  th{background:#e8f0fe;color:#1967d2;border:1px solid #dadce0;padding:10px;text-align:left}
</style></head>
<body>
  <h1>Cronograma de Capacitaciones ${year}</h1>
  <p>Generado desde CapaciHub · ${new Date().toLocaleDateString('es')}</p>
  <table>
    <thead><tr>
      <th>Fecha</th><th>Hora</th><th>Capacitacion</th><th>Tipo</th><th>Estado</th><th>Cupo</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6">Sin eventos</td></tr>'}</tbody>
  </table>
</body></html>`

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' })
  downloadBlob(blob, `Cronograma-${year}.doc`)
}

export async function exportCronogramaPDF(events: Event[], year: number) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  doc.setFontSize(18)
  doc.setTextColor(26, 115, 232)
  doc.text(`Cronograma de Capacitaciones ${year}`, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(95, 99, 104)
  doc.text(`CapaciHub · ${new Date().toLocaleDateString('es')}`, 14, 26)

  const headers = ['Fecha', 'Hora', 'Capacitacion', 'Tipo', 'Estado', 'Cupo']
  const colW = [28, 18, 100, 30, 30, 18]
  let x = 14
  let y = 36
  doc.setFillColor(232, 240, 254)
  doc.rect(14, y - 5, colW.reduce((a, b) => a + b, 0), 8, 'F')
  doc.setTextColor(25, 103, 210)
  doc.setFontSize(9)
  headers.forEach((h, i) => {
    doc.text(h, x + 1, y)
    x += colW[i]
  })
  y += 8
  doc.setTextColor(32, 33, 36)

  sorted.forEach((e, idx) => {
    if (y > 190) {
      doc.addPage()
      y = 20
    }
    if (idx % 2 === 0) {
      doc.setFillColor(248, 249, 250)
      doc.rect(14, y - 4, colW.reduce((a, b) => a + b, 0), 7, 'F')
    }
    x = 14
    const cells = [e.date, e.time, e.title.slice(0, 55), e.tipo, e.estado, String(e.cupo)]
    cells.forEach((c, i) => {
      doc.text(c, x + 1, y)
      x += colW[i]
    })
    y += 7
  })

  doc.save(`Cronograma-${year}.pdf`)
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>')
}

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function yearTemplate(year: number, titles: string[]): { title: string; date: string; time: string; tipo: string; estado: string }[] {
  const out: { title: string; date: string; time: string; tipo: string; estado: string }[] = []
  const defaults = titles.length
    ? titles
    : [
        'Induccion SST',
        'NR-12 Seguridad',
        'Primeros auxilios',
        'Riesgos psicosociales',
        'ISO 45001',
        'Brigadas de emergencia',
        'Ergonomia',
        'Quimicos y MSDS',
        'Trabajo en altura',
        'Espacios confinados',
        'Liderazgo y seguridad',
        'Cierre anual SST',
      ]
  defaults.forEach((title, i) => {
    const month = String(i + 1).padStart(2, '0')
    out.push({
      title,
      date: `${year}-${month}-15`,
      time: '09:00',
      tipo: i % 3 === 0 ? 'Virtual' : 'Presencial',
      estado: 'Borrador',
    })
  })
  return out
}
