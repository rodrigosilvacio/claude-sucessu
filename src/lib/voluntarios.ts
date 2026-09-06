import { supabase } from "./supabase"
import type { Voluntario, VoluntarioComAssociado, VoluntarioOption } from "../types/voluntario"
import type { VoluntarioFormOutput } from "../schemas/voluntario"

const TABLE = "sucesu_voluntarios"
const SELECT_WITH_ASSOCIADO =
  "*, sucesu_associados(id, numero_associado, nome_completo, foto_url, email, telefone, categoria_associado), sucesu_vice_presidencias(id, nome)"

export async function listVoluntarios(): Promise<VoluntarioComAssociado[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_ASSOCIADO)
    .order("data_inicio", { ascending: false })

  if (error) throw error
  return data as unknown as VoluntarioComAssociado[]
}

export async function countVoluntariosAtivos(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .or(`data_termino.is.null,data_termino.gte.${today}`)

  if (error) throw error
  return count ?? 0
}

/** Voluntários "ativos" (sem data de término, ou término no futuro) para uso como solicitantes de conteúdo. */
export async function listVoluntarioOptions(): Promise<VoluntarioOption[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, vice_presidencia_id, sucesu_associados(nome_completo, numero_associado)")
    .or(`data_termino.is.null,data_termino.gte.${new Date().toISOString().slice(0, 10)}`)

  if (error) throw error
  return (
    data as unknown as {
      id: string
      vice_presidencia_id: string
      sucesu_associados: { nome_completo: string; numero_associado: number } | null
    }[]
  ).map((v) => ({
    id: v.id,
    vice_presidencia_id: v.vice_presidencia_id,
    nome_completo: v.sucesu_associados?.nome_completo ?? "—",
    numero_associado: v.sucesu_associados?.numero_associado ?? 0,
  }))
}

export async function getVoluntario(id: string): Promise<Voluntario> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Voluntario
}

export async function createVoluntario(values: VoluntarioFormOutput): Promise<Voluntario> {
  const { data, error } = await supabase.from(TABLE).insert(values).select("*").single()
  if (error) throw error
  return data as Voluntario
}

export async function updateVoluntario(
  id: string,
  values: VoluntarioFormOutput,
): Promise<Voluntario> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Voluntario
}

export async function deleteVoluntario(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
