import { supabase } from "./supabase"
import type { Fornecedor, FornecedorOption } from "../types/fornecedor"
import type { FornecedorFormOutput } from "../schemas/fornecedor"

const TABLE = "sucesu_fornecedores"

export async function listFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("razao_social", { ascending: true })

  if (error) throw error
  return data as Fornecedor[]
}

export async function getFornecedor(id: string): Promise<Fornecedor> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as Fornecedor
}

export async function listFornecedorOptions(): Promise<FornecedorOption[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, razao_social, nome_fantasia")
    .eq("status", "Ativo")
    .order("razao_social", { ascending: true })

  if (error) throw error
  return data as FornecedorOption[]
}

export async function createFornecedor(values: FornecedorFormOutput): Promise<Fornecedor> {
  const { data, error } = await supabase.from(TABLE).insert(values).select("*").single()
  if (error) throw error
  return data as Fornecedor
}

export async function updateFornecedor(
  id: string,
  values: FornecedorFormOutput,
): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as Fornecedor
}

export async function deleteFornecedor(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
