import { z } from "zod"
import { STATUS_FORMULARIO, TIPOS_PERGUNTA } from "../types/formulario"

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : null))

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? value : null))

export const perguntaSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(TIPOS_PERGUNTA),
  texto: z.string().trim().min(1, "Informe o texto da pergunta"),
  obrigatoria: z.boolean().default(true),
  opcoes: z.array(z.string()).default([]),
})

export const formularioSchema = z.object({
  associacao_id: z.string().min(1, "Selecione a associação"),
  vice_presidencia_id: optionalText,
  titulo: z.string().trim().min(1, "Informe o título do formulário"),
  descricao: optionalText,
  status: z.enum(STATUS_FORMULARIO).default("Rascunho"),
  data_encerramento: optionalDate,
  perguntas: z.array(perguntaSchema).min(1, "Adicione ao menos uma pergunta"),
})

export type PerguntaFormValues = z.infer<typeof perguntaSchema>
export type FormularioFormValues = z.input<typeof formularioSchema>
export type FormularioFormOutput = z.output<typeof formularioSchema>
