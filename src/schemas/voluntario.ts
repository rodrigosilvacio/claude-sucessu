import { z } from "zod"
import { PREFERENCIAS_CONTATO } from "../constants/associado-options"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? value : null))

export const voluntarioSchema = z
  .object({
    associacao_id: z.string().min(1, "Selecione a associação"),
    associado_id: z.string().min(1, "Selecione o associado"),
    vice_presidencia_id: z.string().min(1, "Selecione a Vice-Presidência"),
    data_inicio: z.string().min(1, "Informe a data de início"),
    data_termino: optionalDate,
    preferencia_contato: z.enum(PREFERENCIAS_CONTATO, {
      message: "Selecione a preferência de contato",
    }),
    observacoes: optionalText,
  })
  .refine((data) => !data.data_termino || data.data_termino >= data.data_inicio, {
    message: "Data de término não pode ser anterior à data de início",
    path: ["data_termino"],
  })

export type VoluntarioFormValues = z.input<typeof voluntarioSchema>
export type VoluntarioFormOutput = z.output<typeof voluntarioSchema>
