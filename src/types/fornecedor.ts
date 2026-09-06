export type Fornecedor = {
  id: string
  associacao_id: string | null

  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null

  telefone: string | null
  email: string | null
  site: string | null

  nome_contato: string | null
  cargo_contato: string | null
  ramo_atividade: string | null

  cep: string | null
  endereco: string | null
  numero_endereco: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null

  banco: string | null
  agencia: string | null
  conta_corrente: string | null
  chave_pix: string | null

  status: string
  observacoes: string | null

  created_at: string
  updated_at: string
}

export type FornecedorOption = {
  id: string
  razao_social: string
  nome_fantasia: string | null
}
