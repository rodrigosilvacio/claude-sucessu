export const GENEROS = ["Feminino", "Masculino", "Não binário", "Prefiro não informar"] as const

export const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "União estável",
] as const

export const CATEGORIAS_ASSOCIADO = [
  "Pessoa Física",
  "Startup até 20 colaboradores",
  "Startup acima de 20 colaboradores",
  "Pessoa Jurídica com 1 representante",
  "Pessoa Jurídica com 2 representantes",
  "Pessoa Jurídica com 3 representantes",
] as const

export const TIPOS_VINCULO = [
  "Associado",
  "Representante",
  "Diretoria",
  "Conselho de CIOs",
  "Conselho Consultivo",
  "Conselho Fiscal",
] as const

export const ORIGENS_ASSOCIADO = [
  "Indicação",
  "Site",
  "Evento",
  "Redes Sociais",
  "Prospecção Ativa",
  "Outro",
] as const

export const STATUS_ASSOCIADO = ["Pendente de Aprovação", "Ativo", "Inativo", "Suspenso"] as const

export const TIPOS_PESSOA = ["Pessoa Física", "Pessoa Jurídica"] as const

export const FORMAS_PAGAMENTO = ["Pix", "Cartão", "Boleto"] as const

// As Vice-Presidências deixaram de ser uma lista fixa: agora são cadastráveis por
// associação (tabela sucesu_vice_presidencias, gerenciada em Configuração > Associação)
// e carregadas dinamicamente via src/lib/vicePresidencias.ts.

export const PREFERENCIAS_CONTATO = ["Email", "Celular", "Ambos"] as const

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const
