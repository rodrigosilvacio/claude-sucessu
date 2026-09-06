export type ProdutoServico = {
  id: string
  associacao_id: string | null
  fornecedor_id: string | null

  nome: string
  descricao: string | null
  tipo: string
  categoria: string | null
  unidade_medida: string | null
  custo: number | null

  ativo: boolean
  observacoes: string | null

  created_at: string
  updated_at: string
}

export type ProdutoServicoComFornecedor = ProdutoServico & {
  sucesu_fornecedores: { id: string; razao_social: string; nome_fantasia: string | null } | null
}
