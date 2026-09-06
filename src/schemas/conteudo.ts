import { z } from "zod"
import { MEIOS_CONTEUDO, PRIORIDADES_CONTEUDO } from "../constants/conteudo-options"
import { STATUS_CONTEUDO } from "../types/conteudo"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? value : null))

export const conteudoSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  vice_presidencia_id: z.string().min(1, "Selecione a Vice-Presidência"),
  solicitante_id: z.string().min(1, "Selecione o solicitante"),

  titulo: z.string().trim().min(1, "Informe o conteúdo solicitado"),
  descricao: optionalText,
  meios: z.array(z.enum(MEIOS_CONTEUDO)).min(1, "Selecione ao menos um meio"),
  prioridade: z.enum(PRIORIDADES_CONTEUDO).default("Média"),
  status: z.enum(STATUS_CONTEUDO).default("A Fazer"),

  data_esperada_publicacao: optionalDate,
  link_publicado: optionalText,

  observacoes: optionalText,
})

export type ConteudoFormValues = z.input<typeof conteudoSchema>
export type ConteudoFormOutput = z.output<typeof conteudoSchema>
