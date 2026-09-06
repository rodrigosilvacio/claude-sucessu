export type Associado = {
  id: string
  numero_associado: number
  associacao_id: string | null

  foto_url: string | null
  nome_completo: string
  rg: string | null
  cpf: string
  data_nascimento: string | null
  genero: string | null
  estado_civil: string | null
  nacionalidade: string | null

  telefone: string
  email: string
  instagram: string | null

  cep: string | null
  endereco: string | null
  numero_endereco: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null

  profissao: string | null
  empresa: string | null
  cargo: string | null
  formacao_academica: string | null

  tipo_pessoa: string
  valor_associacao: number | null

  categoria_associado: string | null
  tipo_vinculo: string | null
  origem_associado: string | null
  indicado_por_id: string | null

  data_entrada: string | null
  data_aprovacao: string | null
  status: string
  data_desligamento: string | null
  motivo_inativacao: string | null

  areas_interesse: string[]
  receber_emails: boolean
  receber_whatsapp: boolean
  aceite_lgpd: boolean
  observacoes: string | null

  created_at: string
  updated_at: string
  created_by: string | null
}

export type AssociadoOption = Pick<Associado, "id" | "numero_associado" | "nome_completo">
