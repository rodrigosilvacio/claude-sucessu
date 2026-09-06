import { supabase } from "./supabase"
import type { AuditLog } from "../types/auditLog"

const TABLE = "sucesu_audit_log"

export type AuditLogFilters = {
  tabela?: string
  operacao?: string
}

export async function listAuditLog(filters: AuditLogFilters = {}, limit = 200): Promise<AuditLog[]> {
  let query = supabase
    .from(TABLE)
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit)

  if (filters.tabela) query = query.eq("tabela", filters.tabela)
  if (filters.operacao) query = query.eq("operacao", filters.operacao)

  const { data, error } = await query
  if (error) throw error
  return data as AuditLog[]
}

export const TABELAS_AUDITADAS = [
  "sucesu_associados",
  "sucesu_voluntarios",
  "sucesu_eventos",
  "sucesu_fornecedores",
  "sucesu_conteudos",
  "sucesu_associacoes",
  "sucesu_produtos_servicos",
  "sucesu_formularios",
  "sucesu_contas_pagar",
  "sucesu_contas_receber",
  "sucesu_documentos",
] as const

export const OPERACOES_AUDITORIA = ["INSERT", "UPDATE", "DELETE"] as const
