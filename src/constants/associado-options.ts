export const GENEROS = ["Feminino", "Masculino", "Não binário", "Prefiro não informar"] as const

export const ESTADOS_CIVIS = [
  "Solteiro(a)",
  "Casado(a)",
  "Divorciado(a)",
  "Viúvo(a)",
  "União estável",
] as const

export const CATEGORIAS_ASSOCIADO = [
  "Fundador",
  "Efetivo",
  "Contribuinte",
  "Honorário",
  "Estudante",
  "Corporativo",
] as const

export const TIPOS_VINCULO = [
  "Titular",
  "Dependente",
  "Diretoria",
  "Conselho Fiscal",
  "Conselho Consultivo",
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

// As Vice-Presidências deixaram de ser uma lista fixa: agora são cadastráveis por
// associação (tabela sucesu_vice_presidencias, gerenciada em Configuração > Associação)
// e carregadas dinamicamente via src/lib/vicePresidencias.ts.

export const PREFERENCIAS_CONTATO = ["Email", "Celular", "Ambos"] as const

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const
