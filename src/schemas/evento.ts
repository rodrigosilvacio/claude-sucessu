import { z } from "zod"
import { STATUS_EVENTO, MODALIDADES_EVENTO } from "../types/evento"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

const optionalTime = z
  .string()
  .optional()
  .transform((value) => (value ? value : null))

const optionalMoney = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? Number(value.replace(",", ".")) : null))
  .refine((value) => value === null || !Number.isNaN(value), "Valor inválido")

const optionalInt = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? Number(value) : null))
  .refine((value) => value === null || (Number.isInteger(value) && value > 0), "Deve ser um número inteiro maior que zero")

export const eventoSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  vice_presidencia_id: z.string().min(1, "Selecione a Vice-Presidência"),
  responsavel_id: z.string().min(1, "Selecione o voluntário responsável"),

  nome: z.string().trim().min(1, "Informe o nome do evento"),
  descricao: optionalText,

  data_evento: z.string().min(1, "Informe a data do evento"),
  hora_inicio: optionalTime,
  hora_termino: optionalTime,

  modalidade: z.enum(MODALIDADES_EVENTO),
  local_ou_link: optionalText,

  vagas_limite: optionalInt,
  custo_evento: optionalMoney,
  valor_inscricao: optionalMoney,

  status: z.enum(STATUS_EVENTO).default("Planejado"),
  observacoes: optionalText,
})

export type EventoFormValues = z.input<typeof eventoSchema>
export type EventoFormOutput = z.output<typeof eventoSchema>
