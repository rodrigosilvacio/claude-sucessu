export type Voluntario = {
  id: string
  associado_id: string
  associacao_id: string | null

  vice_presidencia_id: string
  data_inicio: string
  data_termino: string | null

  preferencia_contato: string
  observacoes: string | null

  created_at: string
  updated_at: string
}

export type VoluntarioAssociadoResumo = {
  id: string
  numero_associado: number
  nome_completo: string
  foto_url: string | null
  email: string
  telefone: string
  categoria_associado: string | null
}

export type VoluntarioComAssociado = Voluntario & {
  sucesu_associados: VoluntarioAssociadoResumo | null
  sucesu_vice_presidencias: { id: string; nome: string } | null
}

export type VoluntarioOption = {
  id: string
  vice_presidencia_id: string
  nome_completo: string
  numero_associado: number
}
