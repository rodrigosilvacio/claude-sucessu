export const STATUS_FORMULARIO = ["Rascunho", "Publicado", "Encerrado"] as const
export const TIPOS_PERGUNTA = [
  "Texto Curto",
  "Texto Longo",
  "Múltipla Escolha",
  "Múltiplas Seleções",
  "Escala (1-5)",
] as const

export type Formulario = {
  id: string
  associacao_id: string | null
  vice_presidencia_id: string | null
  titulo: string
  descricao: string | null
  status: string
  slug: string
  data_criacao: string
  data_encerramento: string | null
  created_at: string
  updated_at: string
}

export type FormularioComRelacoes = Formulario & {
  sucesu_vice_presidencias: { id: string; nome: string } | null
  sucesu_formulario_respostas: { count: number }[]
}

export type FormularioPergunta = {
  id: string
  formulario_id: string
  ordem: number
  tipo: (typeof TIPOS_PERGUNTA)[number]
  texto: string
  obrigatoria: boolean
  opcoes: string[]
}

export type FormularioPerguntaPublica = Omit<FormularioPergunta, "formulario_id">

export type FormularioPublico = {
  id: string
  titulo: string
  descricao: string | null
  status: string
  perguntas: FormularioPerguntaPublica[]
}

export type FormularioResposta = {
  id: string
  formulario_id: string
  respondente_nome: string
  respondente_email: string | null
  respostas: Record<string, string | string[]>
  data_resposta: string
}
