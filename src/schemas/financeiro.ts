import { z } from "zod"
import { STATUS_CONTA_PAGAR, STATUS_CONTA_RECEBER } from "../constants/cadastro-options"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

export const contaPagarSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  fornecedor_id: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : null)),
  descricao: z.string().trim().min(1, "Informe a descrição"),
  valor: z
    .string()
    .min(1, "Informe o valor")
    .transform((value) => Number(value))
    .refine((value) => !Number.isNaN(value) && value >= 0, "Valor inválido"),
  data_vencimento: z.string().min(1, "Informe a data de vencimento"),
  data_pagamento: optionalDate,
  status: z.enum(STATUS_CONTA_PAGAR),
  observacoes: optionalText,
})

export type ContaPagarFormValues = z.input<typeof contaPagarSchema>
export type ContaPagarFormOutput = z.output<typeof contaPagarSchema>

export const contaReceberSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  associado_id: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : null)),
  descricao: z.string().trim().min(1, "Informe a descrição"),
  valor: z
    .string()
    .min(1, "Informe o valor")
    .transform((value) => Number(value))
    .refine((value) => !Number.isNaN(value) && value >= 0, "Valor inválido"),
  data_vencimento: z.string().min(1, "Informe a data de vencimento"),
  data_recebimento: optionalDate,
  status: z.enum(STATUS_CONTA_RECEBER),
  observacoes: optionalText,
})

export type ContaReceberFormValues = z.input<typeof contaReceberSchema>
export type ContaReceberFormOutput = z.output<typeof contaReceberSchema>
