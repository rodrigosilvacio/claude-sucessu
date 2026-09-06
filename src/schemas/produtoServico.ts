import { z } from "zod"
import { TIPOS_PRODUTO_SERVICO } from "../constants/cadastro-options"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

export const produtoServicoSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  fornecedor_id: optionalText,

  nome: z.string().trim().min(1, "Informe o nome"),
  descricao: optionalText,
  tipo: z.enum(TIPOS_PRODUTO_SERVICO, { message: "Selecione o tipo" }),
  categoria: optionalText,
  unidade_medida: optionalText,
  custo: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? Number(value.replace(",", ".")) : null))
    .refine((value) => value === null || !Number.isNaN(value), "Custo inválido"),

  ativo: z.boolean().default(true),
  observacoes: optionalText,
})

export type ProdutoServicoFormValues = z.input<typeof produtoServicoSchema>
export type ProdutoServicoFormOutput = z.output<typeof produtoServicoSchema>
