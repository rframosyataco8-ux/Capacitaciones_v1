import type { Capacitacion } from './db'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** YYYYMMDD for all-day events */
function icsDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${y}${m}${d}`
}

function escapeIcs(text: string) {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/** Genera archivo .ics del programa (compatible Google Calendar / Outlook) */
export function exportIcs(rows: Capacitacion[], year: number) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ROMEX//Capacitaciones//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Programa Formación ROMEX ${year}`,
  ]

  for (const r of rows) {
    const sessions = r.sessions?.length
      ? r.sessions
      : (r.fechas || []).map((d) => ({ date: d, status: 'Programada' as const }))

    for (const s of sessions) {
      const start = icsDate(s.date)
      // all-day: DTEND = next day
      const [y, m, d] = s.date.split('-').map(Number)
      const next = new Date(y, m - 1, d + 1)
      const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`
      const uid = `${r.codigo}-${s.date}@romex-capacitaciones`

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escapeIcs(`[ROMEX] ${r.tema}`)}`,
        `DESCRIPTION:${escapeIcs(`Capacitación: ${r.tema}\nResponsable: ${r.responsable}\nCódigo: ${r.codigo}\nEstado: ${s.status}`)}`,
        `LOCATION:${escapeIcs('Planta de cacao - Chincha')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      )
    }
  }

  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Programa_ROMEX_${year}.ics`
  a.click()
  URL.revokeObjectURL(a.href)
}

/** Link para añadir UN evento a Google Calendar (abre en nueva pestaña) */
export function googleCalendarUrl(opts: {
  title: string
  date: string // YYYY-MM-DD
  details?: string
  location?: string
}) {
  const start = opts.date.replace(/-/g, '')
  const [y, m, d] = opts.date.split('-').map(Number)
  const next = new Date(y, m - 1, d + 1)
  const end = `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    dates: `${start}/${end}`,
    details: opts.details || '',
    location: opts.location || 'Planta de cacao - Chincha',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
