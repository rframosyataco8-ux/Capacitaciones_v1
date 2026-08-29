import { z } from 'zod'

export const temaSchema = z.object({
  tema: z
    .string()
    .trim()
    .min(3, 'El tema debe tener al menos 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  responsable: z
    .string()
    .trim()
    .min(2, 'Indique el responsable')
    .max(120, 'Máximo 120 caracteres'),
  fechas: z
    .string()
    .trim()
    .optional()
    .refine(
      (v) => {
        if (!v) return true
        const parts = v.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
        return parts.every((p) => {
          if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return true
          if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(p)) return true
          return false
        })
      },
      { message: 'Fechas inválidas. Use AAAA-MM-DD o DD/MM/AAAA separadas por coma' }
    ),
})

export const examenSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  preguntas: z
    .array(
      z.object({
        texto: z.string().trim().min(1, 'Escriba el enunciado'),
      })
    )
    .min(1, 'Agregue al menos una pregunta con enunciado'),
})

export const programaAnualSchema = z.object({
  newYear: z
    .number()
    .int()
    .min(2020, 'Año mínimo 2020')
    .max(2040, 'Año máximo 2040'),
  copyFrom: z.number().int().min(2020).max(2040),
})

export type TemaForm = z.infer<typeof temaSchema>
export type ExamenForm = z.infer<typeof examenSchema>

export function fieldErrors<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { ok: true; data: z.infer<T> } | { ok: false; errors: Record<string, string> } {
  const r = schema.safeParse(data)
  if (r.success) return { ok: true, data: r.data }
  const errors: Record<string, string> = {}
  for (const issue of r.error.issues) {
    const key = issue.path.join('.') || '_form'
    if (!errors[key]) errors[key] = issue.message
  }
  return { ok: false, errors }
}
