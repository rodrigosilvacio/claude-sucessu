export const STATUS_CONTEUDO = ["A Fazer", "Em Andamento", "Concluído", "Arquivado"] as const
export type StatusConteudo = (typeof STATUS_CONTEUDO)[number]

export type Conteudo = {
  id: string
  associacao_id: string | null
  vice_presidencia_id: string
  solicitante_id: string

  titulo: string
  descricao: string | null
  meios: string[]
  prioridade: string

  data_solicitacao: string
  data_esperada_publicacao: string | null
  link_publicado: string | null

  status: StatusConteudo
  data_movido_done: string | null

  observacoes: string | null

  created_at: string
  updated_at: string
}

export type ConteudoComRelacoes = Conteudo & {
  sucesu_vice_presidencias: { id: string; nome: string } | null
  sucesu_voluntarios: {
    id: string
    sucesu_associados: { nome_completo: string; foto_url: string | null } | null
  } | null
}
