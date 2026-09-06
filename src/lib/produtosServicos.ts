import { supabase } from "./supabase"
import type { ProdutoServico, ProdutoServicoComFornecedor } from "../types/produtoServico"
import type { ProdutoServicoFormOutput } from "../schemas/produtoServico"

const TABLE = "sucesu_produtos_servicos"
const SELECT_WITH_FORNECEDOR = "*, sucesu_fornecedores(id, razao_social, nome_fantasia)"

export async function listProdutosServicos(): Promise<ProdutoServicoComFornecedor[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(SELECT_WITH_FORNECEDOR)
    .order("nome", { ascending: true })

  if (error) throw error
  return data as unknown as ProdutoServicoComFornecedor[]
}

export async function getProdutoServico(id: string): Promise<ProdutoServico> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single()
  if (error) throw error
  return data as ProdutoServico
}

export async function createProdutoServico(
  values: ProdutoServicoFormOutput,
): Promise<ProdutoServico> {
  const { data, error } = await supabase.from(TABLE).insert(values).select("*").single()
  if (error) throw error
  return data as ProdutoServico
}

export async function updateProdutoServico(
  id: string,
  values: ProdutoServicoFormOutput,
): Promise<ProdutoServico> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(values)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as ProdutoServico
}

export async function deleteProdutoServico(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id)
  if (error) throw error
}
