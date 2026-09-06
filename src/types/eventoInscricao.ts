export type EventoInscricao = {
  id: string
  evento_id: string
  nome_completo: string
  email: string
  telefone: string | null
  empresa: string | null
  presente: boolean
  observacoes: string | null
  data_inscricao: string
}
