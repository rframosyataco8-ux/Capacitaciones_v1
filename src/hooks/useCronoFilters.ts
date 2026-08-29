import { useMemo } from 'react'
import type { Capacitacion, Session } from '../lib/db'

export type FilterKey = 'todos' | 'refuerzos' | 'pendientes' | 'completados'
export type ViewMode = 'lista' | 'meses'

export function sessionsOf(c: Capacitacion): Session[] {
  if (c.sessions?.length) return c.sessions
  return (c.fechas || []).map((d) => ({ date: d, status: 'Programada' as const }))
}

export function useCronoFilters(
  rows: Capacitacion[],
  search: string,
  filter: FilterKey
) {
  return useMemo(() => {
    let list = rows

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.tema.toLowerCase().includes(q) ||
          r.responsable.toLowerCase().includes(q) ||
          r.codigo.toLowerCase().includes(q)
      )
    }

    if (filter === 'refuerzos') {
      list = list.filter((r) => sessionsOf(r).length > 1)
    } else if (filter === 'pendientes') {
      list = list.filter((r) => sessionsOf(r).some((s) => s.status !== 'Realizada'))
    } else if (filter === 'completados') {
      list = list.filter((r) => {
        const s = sessionsOf(r)
        return s.length > 0 && s.every((x) => x.status === 'Realizada')
      })
    }

    const totalSesiones = list.reduce((acc, r) => acc + sessionsOf(r).length, 0)
    return { filtered: list, totalSesiones }
  }, [rows, search, filter])
}
