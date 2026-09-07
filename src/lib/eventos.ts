import { supabase } from "./supabase"
import type { Evento, EventoComRelacoes, EventoPublico, EventoPublicoResumo } from "../types/evento"
import type { EventoFormOutput } from "../schemas/evento"
import type { EventoInscricaoFormOutput } from "../schemas/eventoInscricao"

const TABLE = "sucesu_eventos"
const SELECT_WITH_RELACOES =
  "*, sucesu_vice_presidencias(id, nome), sucesu_voluntarios(id, sucesu_associados(nome_completo)), sucesu_evento_inscricoes(count)"

export async function listEventos(): Promise<EventoComRelacoes[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_RELACOES)
    .order("data_evento", { ascending: false })

  if (error) throw error
  return data as unknown as EventoComRelacoes[]
}

export async function getEvento(id: string): Promise<Evento> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Evento
}

export async function createEvento(values: EventoFormOutput): Promise<Evento> {
  const { data, error } = await supabase.from(TABLE).insert(values).select("*").single()
  if (error) throw error
  return data as Evento
}

export async function updateEvento(id: string, values: EventoFormOutput): Promise<Evento> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Evento
}

export async function deleteEvento(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}

export async function getEventoPublico(slug: string): Promise<EventoPublico | null> {
  const { data, error } = await supabase.rpc("sucesu_evento_publico", { p_slug: slug })
  if (error) throw error
  return (data?.[0] as EventoPublico) ?? null
}

export async function listEventosPublicos(): Promise<EventoPublicoResumo[]> {
  const { data, error } = await supabase.rpc("sucesu_eventos_publicos")
  if (error) throw error
  return data as EventoPublicoResumo[]
}

export async function inscreverEmEvento(
  slug: string,
  values: EventoInscricaoFormOutput,
): Promise<void> {
  const { error } = await supabase.rpc("sucesu_evento_inscrever", {
    p_slug: slug,
    p_nome: values.nome_completo,
    p_email: values.email,
    p_telefone: values.telefone,
    p_empresa: values.empresa,
  })
  if (error) throw error
}
