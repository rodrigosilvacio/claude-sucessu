import { supabase } from "./supabase"
import type {
  Formulario,
  FormularioComRelacoes,
  FormularioPergunta,
  FormularioPublico,
  FormularioResposta,
} from "../types/formulario"
import type { FormularioFormOutput, PerguntaFormValues } from "../schemas/formulario"

const TABLE = "sucesu_formularios"
const PERGUNTAS_TABLE = "sucesu_formulario_perguntas"
const RESPOSTAS_TABLE = "sucesu_formulario_respostas"

const SELECT_WITH_RELACOES =
  "*, sucesu_vice_presidencias(id, nome), sucesu_formulario_respostas(count)"

export async function listFormularios(): Promise<FormularioComRelacoes[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_RELACOES)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as unknown as FormularioComRelacoes[]
}

export async function getFormulario(id: string): Promise<Formulario> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Formulario
}

export async function getPerguntas(formularioId: string): Promise<FormularioPergunta[]> {
  const { data, error } = await supabase
    .from(PERGUNTAS_TABLE)
    .select("*")
    .eq("formulario_id", formularioId)
    .order("ordem", { ascending: true })

  if (error) throw error
  return data as FormularioPergunta[]
}

async function syncPerguntas(formularioId: string, perguntas: PerguntaFormValues[]) {
  const existentes = await getPerguntas(formularioId)
  const idsRecebidos = new Set(perguntas.filter((p) => p.id).map((p) => p.id))

  const removidas = existentes.filter((p) => !idsRecebidos.has(p.id))
  if (removidas.length > 0) {
    const { error } = await supabase
      .from(PERGUNTAS_TABLE)
      .delete()
      .in("id", removidas.map((p) => p.id))
    if (error) throw error
  }

  for (let ordem = 0; ordem < perguntas.length; ordem++) {
    const p = perguntas[ordem]
    const row = {
      formulario_id: formularioId,
      ordem,
      tipo: p.tipo,
      texto: p.texto,
      obrigatoria: p.obrigatoria,
      opcoes: p.opcoes,
    }
    if (p.id) {
      const { error } = await supabase.from(PERGUNTAS_TABLE).update(row).eq("id", p.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from(PERGUNTAS_TABLE).insert(row)
      if (error) throw error
    }
  }
}

export async function createFormulario(values: FormularioFormOutput): Promise<Formulario> {
  const { perguntas, ...formularioValues } = values
  const { data, error } = await supabase
    .from(TABLE)
    .insert(formularioValues)
    .select("*")
    .single()
  if (error) throw error

  await syncPerguntas(data.id, perguntas)
  return data as Formulario
}

export async function updateFormulario(
  id: string,
  values: FormularioFormOutput,
): Promise<Formulario> {
  const { perguntas, ...formularioValues } = values
  const { data, error } = await supabase
    .from(TABLE)
    .update(formularioValues)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error

  await syncPerguntas(id, perguntas)
  return data as Formulario
}

export async function deleteFormulario(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}

export async function listRespostas(formularioId: string): Promise<FormularioResposta[]> {
  const { data, error } = await supabase
    .from(RESPOSTAS_TABLE)
    .select("*")
    .eq("formulario_id", formularioId)
    .order("data_resposta", { ascending: false })

  if (error) throw error
  return data as FormularioResposta[]
}

export async function getFormularioPublico(slug: string): Promise<FormularioPublico | null> {
  const { data, error } = await supabase.rpc("sucesu_formulario_publico", { p_slug: slug })
  if (error) throw error
  return (data?.[0] as FormularioPublico) ?? null
}

export async function responderFormulario(
  slug: string,
  nome: string,
  email: string | null,
  respostas: Record<string, string | string[]>,
): Promise<void> {
  const { error } = await supabase.rpc("sucesu_formulario_responder", {
    p_slug: slug,
    p_nome: nome,
    p_email: email,
    p_respostas: respostas,
  })
  if (error) throw error
}
