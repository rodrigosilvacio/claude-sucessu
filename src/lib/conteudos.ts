import { supabase } from "./supabase"
import type { Conteudo, ConteudoComRelacoes, StatusConteudo } from "../types/conteudo"
import type { ConteudoFormOutput } from "../schemas/conteudo"

const TABLE = "sucesu_conteudos"
const SELECT_WITH_RELACOES =
  "*, sucesu_vice_presidencias(id, nome), sucesu_voluntarios(id, sucesu_associados(nome_completo, foto_url))"

export async function listConteudos(): Promise<ConteudoComRelacoes[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_RELACOES)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as ConteudoComRelacoes[]
}

export async function getConteudo(id: string): Promise<Conteudo> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Conteudo
}

export async function createConteudo(values: ConteudoFormOutput): Promise<Conteudo> {
  const { data, error } = await supabase.from(TABLE).insert(values).select("*").single()
  if (error) throw error
  return data as Conteudo
}

export async function updateConteudo(id: string, values: ConteudoFormOutput): Promise<Conteudo> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Conteudo
}

export async function updateConteudoStatus(id: string, status: StatusConteudo): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ status }).eq("id", id)
  if (error) throw error
}

export async function deleteConteudo(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
