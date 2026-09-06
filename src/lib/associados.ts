import { supabase } from "./supabase"
import type { Associado, AssociadoOption } from "../types/associado"
import type { AssociadoFormOutput } from "../schemas/associado"

const TABLE = "sucesu_associados"
const BUCKET = "sucesu-fotos"

export async function listAssociados(): Promise<Associado[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("numero_associado", { ascending: false })

  if (error) throw error
  return data as Associado[]
}

export async function countAssociadosAtivos(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("status", "Ativo")

  if (error) throw error
  return count ?? 0
}

export async function getAssociado(id: string): Promise<Associado> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Associado
}

export async function listAssociadoOptions(excludeId?: string): Promise<AssociadoOption[]> {
  let query = supabase
    .from(TABLE)
    .select("id, numero_associado, nome_completo")
    .order("nome_completo", { ascending: true })

  if (excludeId) query = query.neq("id", excludeId)

  const { data, error } = await query
  if (error) throw error
  return data as AssociadoOption[]
}

export async function uploadFotoAssociado(file: File): Promise<string> {
  const extension = file.name.split(".").pop()
  const path = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw error

  return path
}

export async function getFotoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (error) return null
  return data.signedUrl
}

export async function createAssociado(values: AssociadoFormOutput): Promise<Associado> {
  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...values, created_by: userData.user?.id ?? null })
    .select("*")
    .single()

  if (error) throw error
  return data as Associado
}

export async function updateAssociado(
  id: string,
  values: AssociadoFormOutput,
): Promise<Associado> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Associado
}

export async function deleteAssociado(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}

export async function approveAssociado(id: string): Promise<Associado> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: "Ativo", data_aprovacao: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Associado
}

export type PreCadastroValues = {
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  data_nascimento: string | null
  empresa: string | null
  profissao: string | null
  cidade: string | null
  estado: string | null
  instagram: string | null
}

export async function submitPreCadastro(values: PreCadastroValues): Promise<void> {
  const { error } = await supabase.rpc("sucesu_public_signup", {
    p_nome_completo: values.nome_completo,
    p_cpf: values.cpf,
    p_email: values.email,
    p_telefone: values.telefone,
    p_data_nascimento: values.data_nascimento,
    p_empresa: values.empresa,
    p_profissao: values.profissao,
    p_cidade: values.cidade,
    p_estado: values.estado,
    p_instagram: values.instagram,
  })

  if (error) throw error
}

export async function updateFotoAssociado(id: string, fotoPath: string): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ foto_url: fotoPath }).eq("id", id)
  if (error) throw error
}
