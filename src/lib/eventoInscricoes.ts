import { supabase } from "./supabase"
import type { EventoInscricao } from "../types/eventoInscricao"

const TABLE = "sucesu_evento_inscricoes"

export async function listInscricoes(eventoId: string): Promise<EventoInscricao[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("evento_id", eventoId)
    .order("data_inscricao", { ascending: true })

  if (error) throw error
  return data as EventoInscricao[]
}

export async function togglePresenca(id: string, presente: boolean): Promise<void> {
  const { error } = await supabase.from(TABLE).update({ presente }).eq("id", id)
  if (error) throw error
}

export async function deleteInscricao(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
