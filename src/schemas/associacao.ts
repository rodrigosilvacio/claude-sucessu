import { z } from "zod"
import { isValidCNPJ, onlyDigits } from "../lib/format"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

export const associacaoSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da associação"),
  cnpj: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? onlyDigits(value) : null))
    .refine((value) => !value || isValidCNPJ(value), "CNPJ inválido"),

  cep: optionalText,
  endereco: optionalText,
  numero_endereco: optionalText,
  complemento: optionalText,
  bairro: optionalText,
  cidade: optionalText,
  estado: optionalText,

  telefone: optionalText,
  email: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : null))
    .refine((value) => !value || z.string().email().safeParse(value).success, "E-mail inválido"),

  presidente_id: optionalText,
  vp_financeiro_id: optionalText,
  vp_operacoes_id: optionalText,

  banco: optionalText,
  agencia: optionalText,
  conta_corrente: optionalText,

  valor_pessoa_fisica: z
    .string()
    .min(1, "Informe o valor")
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => !Number.isNaN(value) && value >= 0, "Valor inválido"),
  valor_pessoa_juridica: z
    .string()
    .min(1, "Informe o valor")
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => !Number.isNaN(value) && value >= 0, "Valor inválido"),
})

export type AssociacaoFormValues = z.input<typeof associacaoSchema>
export type AssociacaoFormOutput = z.output<typeof associacaoSchema>
