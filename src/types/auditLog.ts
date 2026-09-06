export type AuditLog = {
  id: string
  tabela: string
  registro_id: string | null
  operacao: string
  dados_antigos: Record<string, unknown> | null
  dados_novos: Record<string, unknown> | null
  usuario_id: string | null
  criado_em: string
}
