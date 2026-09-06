import { supabase } from "./supabase"
import type { ContaPagar, ContaReceber } from "../types/financeiro"
import type { ContaPagarFormOutput, ContaReceberFormOutput } from "../schemas/financeiro"

const TABLE_PAGAR = "sucesu_contas_pagar"
const TABLE_RECEBER = "sucesu_contas_receber"

export async function listContasPagar(): Promise<ContaPagar[]> {
  const { data, error } = await supabase
    .from(TABLE_PAGAR)
    .select("*")
    .order("data_vencimento", { ascending: true })

  if (error) throw error
  return data as ContaPagar[]
}

export async function getContaPagar(id: string): Promise<ContaPagar> {
  const { data, error } = await supabase.from(TABLE_PAGAR).select("*").eq("id", id).single()
  if (error) throw error
  return data as ContaPagar
}

export async function createContaPagar(values: ContaPagarFormOutput): Promise<ContaPagar> {
  const { data, error } = await supabase.from(TABLE_PAGAR).insert(values).select("*").single()
  if (error) throw error
  return data as ContaPagar
}

export async function updateContaPagar(
  id: string,
  values: ContaPagarFormOutput,
): Promise<ContaPagar> {
  const { data, error } = await supabase
    .from(TABLE_PAGAR)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as ContaPagar
}

export async function deleteContaPagar(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_PAGAR).delete().eq("id", id)
  if (error) throw error
}

export async function listContasReceber(): Promise<ContaReceber[]> {
  const { data, error } = await supabase
    .from(TABLE_RECEBER)
    .select("*")
    .order("data_vencimento", { ascending: true })

  if (error) throw error
  return data as ContaReceber[]
}

export async function getContaReceber(id: string): Promise<ContaReceber> {
  const { data, error } = await supabase.from(TABLE_RECEBER).select("*").eq("id", id).single()
  if (error) throw error
  return data as ContaReceber
}

export async function createContaReceber(values: ContaReceberFormOutput): Promise<ContaReceber> {
  const { data, error } = await supabase.from(TABLE_RECEBER).insert(values).select("*").single()
  if (error) throw error
  return data as ContaReceber
}

export async function updateContaReceber(
  id: string,
  values: ContaReceberFormOutput,
): Promise<ContaReceber> {
  const { data, error } = await supabase
    .from(TABLE_RECEBER)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as ContaReceber
}

export async function deleteContaReceber(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE_RECEBER).delete().eq("id", id)
  if (error) throw error
}
