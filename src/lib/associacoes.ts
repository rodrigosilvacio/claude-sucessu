import { supabase } from "./supabase"
import type { Associacao, AssociacaoOption } from "../types/associacao"
import type { AssociacaoFormOutput } from "../schemas/associacao"

const TABLE = "sucesu_associacoes"
const LOGO_BUCKET = "sucesu-logos"

export async function getPrimaryAssociacao(): Promise<Associacao | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as Associacao | null
}

export async function getAssociacao(id: string): Promise<Associacao> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Associacao
}

export async function listAssociacaoOptions(): Promise<AssociacaoOption[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, nome")
    .order("nome", { ascending: true })

  if (error) throw error
  return data as AssociacaoOption[]
}

export async function createAssociacao(values: AssociacaoFormOutput): Promise<Associacao> {
  const { data, error } = await supabase.from(TABLE).insert(values).select("*").single()
  if (error) throw error
  return data as Associacao
}

export async function uploadLogoAssociacao(file: File): Promise<string> {
  const extension = file.name.split(".").pop()
  const path = `logo-${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true })
  if (error) throw error

  return path
}

export function getLogoPublicUrl(path: string): string {
  return supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl
}

export async function updateAssociacao(
  id: string,
  values: AssociacaoFormOutput,
): Promise<Associacao> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Associacao
}
