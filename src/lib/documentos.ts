import { supabase } from "./supabase"
import type { Documento, EntidadeDocumento } from "../types/documento"

const TABLE = "sucesu_documentos"
const BUCKET = "sucesu-documentos"

export async function listDocumentos(
  entidadeTipo: EntidadeDocumento,
  entidadeId: string,
): Promise<Documento[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("entidade_tipo", entidadeTipo)
    .eq("entidade_id", entidadeId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Documento[]
}

export async function uploadDocumento(
  entidadeTipo: EntidadeDocumento,
  entidadeId: string,
  associacaoId: string,
  file: File,
): Promise<Documento> {
  const extension = file.name.split(".").pop()
  const path = `${entidadeTipo}/${entidadeId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { data: userData } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      associacao_id: associacaoId,
      entidade_tipo: entidadeTipo,
      entidade_id: entidadeId,
      nome_arquivo: file.name,
      storage_path: path,
      tamanho: file.size,
      tipo_mime: file.type || null,
      created_by: userData.user?.id ?? null,
    })
    .select("*")
    .single()

  if (error) throw error
  return data as Documento
}

export async function getDocumentoUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 5)
  if (error) return null
  return data.signedUrl
}

export async function deleteDocumento(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath])
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
