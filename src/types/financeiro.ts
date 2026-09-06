export type ContaPagar = {
  id: string
  associacao_id: string | null
  fornecedor_id: string | null
  descricao: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type ContaReceber = {
  id: string
  associacao_id: string | null
  associado_id: string | null
  descricao: string
  valor: number
  data_vencimento: string
  data_recebimento: string | null
  status: string
  observacoes: string | null
  created_at: string
  updated_at: string
}
