import { z } from "zod"
import { isValidCPF, onlyDigits } from "../lib/format"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

export const preCadastroSchema = z.object({
  nome_completo: z.string().trim().min(1, "Informe o nome completo"),
  cpf: z
    .string()
    .min(1, "Informe o CPF")
    .refine((value) => isValidCPF(value), "CPF inválido")
    .transform((value) => onlyDigits(value)),
  email: z.string().trim().min(1, "Informe o e-mail").email("E-mail inválido"),
  telefone: z.string().trim().min(1, "Informe o telefone"),
  data_nascimento: z
    .string()
    .optional()
    .transform((value) => (value ? value : null)),
  empresa: optionalText,
  profissao: optionalText,
  cidade: optionalText,
  estado: optionalText,
  instagram: optionalText,
  aceite_lgpd: z.boolean().refine((value) => value, "É necessário aceitar os termos"),
})

export type PreCadastroFormValues = z.input<typeof preCadastroSchema>
export type PreCadastroFormOutput = z.output<typeof preCadastroSchema>
