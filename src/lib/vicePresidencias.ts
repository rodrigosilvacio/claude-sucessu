import { supabase } from "./supabase"
import type { VicePresidencia } from "../types/vicePresidencia"

const TABLE = "sucesu_vice_presidencias"

export async function listVicePresidencias(associacaoId?: string): Promise<VicePresidencia[]> {
  let query = supabase.from(TABLE).select("*").order("nome", { ascending: true })
  if (associacaoId) query = query.eq("associacao_id", associacaoId)

  const { data, error } = await query
  if (error) throw error
  return data as VicePresidencia[]
}

export async function createVicePresidencia(
  associacaoId: string,
  nome: string,
): Promise<VicePresidencia> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ associacao_id: associacaoId, nome })
    .select("*")
    .single()

  if (error) throw error
  return data as VicePresidencia
}

export async function deleteVicePresidencia(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
