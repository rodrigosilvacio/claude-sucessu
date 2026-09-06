export type Associacao = {
  id: string

  cnpj: string | null
  nome: string
  logo_url: string | null

  cep: string | null
  endereco: string | null
  numero_endereco: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null

  telefone: string | null
  email: string | null

  presidente_id: string | null
  vp_financeiro_id: string | null
  vp_operacoes_id: string | null

  banco: string | null
  agencia: string | null
  conta_corrente: string | null

  valor_pessoa_fisica: number
  valor_pessoa_juridica: number

  created_at: string
  updated_at: string
}

export type AssociacaoOption = Pick<Associacao, "id" | "nome">
