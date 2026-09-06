import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { Usuario } from "../types/usuario"

const FUNCTION_NAME = "sucesu-admin-users"

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const errorBody = await error.context.json().catch(() => null)
      throw new Error(errorBody?.error || error.message)
    }
    throw error
  }

  if (data?.error) throw new Error(data.error)
  return data as T
}

export async function listUsuarios(): Promise<Usuario[]> {
  const data = await invoke<{ users: Usuario[] }>({ action: "list" })
  return data.users
}

export async function convidarUsuario(
  email: string,
  nome?: string,
  associacaoId?: string,
  isAdmin?: boolean,
  papel?: "gestor" | "financeiro",
): Promise<{ user: { id: string; email: string }; actionLink: string | null }> {
  return invoke({ action: "invite", email, nome, associacaoId, isAdmin, papel })
}

export async function atualizarEscopoUsuario(
  userId: string,
  associacaoId: string | null,
  isAdmin: boolean,
  papel: "gestor" | "financeiro",
): Promise<void> {
  await invoke({ action: "update_scope", userId, associacaoId, isAdmin, papel })
}

export async function gerarLinkRedefinicao(email: string): Promise<{ actionLink: string | null }> {
  return invoke({ action: "reset_link", email })
}

export async function removerAcessoUsuario(userId: string): Promise<void> {
  await invoke({ action: "revoke", userId })
}
