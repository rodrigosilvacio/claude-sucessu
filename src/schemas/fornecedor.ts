import { z } from "zod"
import { isValidCNPJ, onlyDigits } from "../lib/format"
import { STATUS_FORNECEDOR } from "../constants/cadastro-options"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

export const fornecedorSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),

  razao_social: z.string().trim().min(1, "Informe a razão social"),
  nome_fantasia: optionalText,
  cnpj: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? onlyDigits(value) : null))
    .refine((value) => !value || isValidCNPJ(value), "CNPJ inválido"),

  telefone: optionalText,
  email: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : null))
    .refine((value) => !value || z.string().email().safeParse(value).success, "E-mail inválido"),
  site: optionalText,

  nome_contato: optionalText,
  cargo_contato: optionalText,
  ramo_atividade: optionalText,

  cep: optionalText,
  endereco: optionalText,
  numero_endereco: optionalText,
  complemento: optionalText,
  bairro: optionalText,
  cidade: optionalText,
  estado: optionalText,

  banco: optionalText,
  agencia: optionalText,
  conta_corrente: optionalText,
  chave_pix: optionalText,

  status: z.enum(STATUS_FORNECEDOR),
  observacoes: optionalText,
})

export type FornecedorFormValues = z.input<typeof fornecedorSchema>
export type FornecedorFormOutput = z.output<typeof fornecedorSchema>
