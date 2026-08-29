/** Diálogos de confirmación en español */

export function confirmar(mensaje: string): boolean {
  return window.confirm(mensaje)
}

export const mensajes = {
  eliminarTema: '¿Eliminar este tema del programa anual? Esta acción no se puede deshacer.',
  eliminarArchivo: '¿Eliminar este archivo? Esta acción no se puede deshacer.',
  eliminarExamen: '¿Eliminar este examen? Esta acción no se puede deshacer.',
  reemplazarPrograma: (year: number, n: number) =>
    `Ya existe un programa para ${year} con ${n} tema${n === 1 ? '' : 's'}. ¿Desea reemplazarlo por completo?`,
} as const
