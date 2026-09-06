export type EntidadeDocumento = "associado" | "fornecedor" | "evento"

export type Documento = {
  id: string
  associacao_id: string | null
  entidade_tipo: EntidadeDocumento
  entidade_id: string
  nome_arquivo: string
  storage_path: string
  tamanho: number | null
  tipo_mime: string | null
  created_at: string
  created_by: string | null
}
