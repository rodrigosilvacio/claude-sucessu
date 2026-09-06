import { z } from "zod"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

export const eventoInscricaoSchema = z.object({
  nome_completo: z.string().trim().min(1, "Informe seu nome completo"),
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido"),
  telefone: optionalText,
  empresa: optionalText,
})

export type EventoInscricaoFormValues = z.input<typeof eventoInscricaoSchema>
export type EventoInscricaoFormOutput = z.output<typeof eventoInscricaoSchema>
