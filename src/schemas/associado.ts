import { z } from "zod"
import { isValidCPF, onlyDigits } from "../lib/format"
import {
  CATEGORIAS_ASSOCIADO,
  ORIGENS_ASSOCIADO,
  STATUS_ASSOCIADO,
  TIPOS_PESSOA,
  TIPOS_VINCULO,
} from "../constants/associado-options"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? value : null))

export const associadoSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  nome_completo: z.string().trim().min(1, "Informe o nome completo"),
  rg: optionalText,
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine((value) => isValidCPF(value), "CPF inválido")
    .transform((value) => onlyDigits(value)),
  data_nascimento: optionalDate,
  genero: optionalText,
  estado_civil: optionalText,
  nacionalidade: optionalText,

  telefone: z.string().trim().min(1, "Informe o telefone"),
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  instagram: optionalText,

  cep: optionalText,
  endereco: optionalText,
  numero_endereco: optionalText,
  complemento: optionalText,
  bairro: optionalText,
  cidade: optionalText,
  estado: optionalText,

  profissao: optionalText,
  empresa: optionalText,
  cargo: optionalText,
  formacao_academica: optionalText,

  tipo_pessoa: z.enum(TIPOS_PESSOA).default("Pessoa Física"),
  valor_associacao: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? Number(value.replace(",", ".")) : null))
    .refine((value) => value === null || !Number.isNaN(value), "Valor inválido"),

  categoria_associado: z.enum(CATEGORIAS_ASSOCIADO, {
    message: "Selecione a categoria do associado",
  }),
  tipo_vinculo: optionalText,
  origem_associado: optionalText,
  indicado_por_id: optionalText,

  data_entrada: optionalDate,
  data_aprovacao: optionalDate,
  status: z.enum(STATUS_ASSOCIADO),
  data_desligamento: optionalDate,
  motivo_inativacao: optionalText,

  areas_interesse: z.array(z.string()).default([]),
  receber_emails: z.boolean().default(true),
  receber_whatsapp: z.boolean().default(true),
  aceite_lgpd: z.boolean().default(false),
  observacoes: optionalText,
})

export type AssociadoFormValues = z.input<typeof associadoSchema>
export type AssociadoFormOutput = z.output<typeof associadoSchema>

export { CATEGORIAS_ASSOCIADO, TIPOS_VINCULO, ORIGENS_ASSOCIADO, STATUS_ASSOCIADO }
