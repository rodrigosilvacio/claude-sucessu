export const STATUS_EVENTO = ["Planejado", "Realizado", "Cancelado"] as const
export const MODALIDADES_EVENTO = ["Presencial", "Online", "Híbrido"] as const

export type Evento = {
  id: string
  associacao_id: string | null
  vice_presidencia_id: string
  responsavel_id: string

  nome: string
  descricao: string | null

  data_evento: string
  hora_inicio: string | null
  hora_termino: string | null

  modalidade: string
  local_ou_link: string | null

  vagas_limite: number | null
  custo_evento: number | null
  valor_inscricao: number | null

  status: string
  slug: string

  data_cadastro: string
  observacoes: string | null

  created_at: string
  updated_at: string
}

export type EventoComRelacoes = Evento & {
  sucesu_vice_presidencias: { id: string; nome: string } | null
  sucesu_voluntarios: {
    id: string
    sucesu_associados: { nome_completo: string } | null
  } | null
  sucesu_evento_inscricoes: { count: number }[]
}

export type EventoPublico = {
  id: string
  nome: string
  descricao: string | null
  data_evento: string
  hora_inicio: string | null
  hora_termino: string | null
  modalidade: string
  local_ou_link: string | null
  valor_inscricao: number | null
  vagas_limite: number | null
  vagas_ocupadas: number
  status: string
}
