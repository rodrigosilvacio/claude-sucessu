import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "./supabase"
import type { Usuario } from "../types/usuario"

const FUNCTION_NAME = "sucesu-admin-users"

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const errorBody = await error.context.json().catch(() => null)
      const message: string | undefined = errorBody?.error
      // O token de acesso pode estar perto de expirar (aba ficou muito tempo
      // aberta/inativa) e o refresh automático ainda não rodou. Força um
      // refresh e tenta a chamada de novo, uma única vez, antes de desistir.
      if (message === "Sessão inválida") {
        const { data: refreshed } = await supabase.auth.refreshSession()
        if (refreshed.session) {
          const retry = await supabase.functions.invoke(FUNCTION_NAME, { body })
          if (!retry.error) {
            if (retry.data?.error) throw new Error(retry.data.error)
            return retry.data as T
          }
        }
      }
      throw new Error(message || error.message)
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

export async function convidarUsuario(params: {
  usuario: string
  password: string
  nome?: string
  email?: string
  associacaoId?: string
  papel: "admin" | "gestor"
}): Promise<{ user: { id: string; usuario: string; email: string }; contaExistente: boolean }> {
  return invoke({ action: "invite", ...params })
}

export async function atualizarEscopoUsuario(
  userId: string,
  associacaoId: string | null,
  papel: "admin" | "gestor",
): Promise<void> {
  await invoke({ action: "update_scope", userId, associacaoId, papel })
}

export async function definirSenhaUsuario(userId: string, password: string): Promise<void> {
  await invoke({ action: "set_password", userId, password })
}

export async function removerAcessoUsuario(userId: string): Promise<void> {
  await invoke({ action: "revoke", userId })
}

export async function resolverEmailPorUsuario(usuario: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("sucesu_resolver_login", { p_usuario: usuario })
  if (error) throw error
  return (data as string | null) ?? null
}
