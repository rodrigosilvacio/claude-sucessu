import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export type UsuarioEscopo = {
  associacao_id: string | null
  is_admin: boolean
  papel: "admin" | "gestor"
}

type AuthContextValue = {
  session: Session | null
  escopo: UsuarioEscopo | null
  loading: boolean
  signIn: (usuario: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Resultado da checagem de escopo:
// - "ok": usuário está em sucesu_usuarios
// - "sem_acesso": consulta funcionou e o usuário NÃO está em sucesu_usuarios
// - "erro": falha transitória (JWT expirado durante refresh, rede, etc.)
type EscopoResult =
  | { status: "ok"; escopo: UsuarioEscopo }
  | { status: "sem_acesso" }
  | { status: "erro" }

// Este projeto Supabase é compartilhado com outros apps do usuário — uma sessão
// válida não basta. Só quem está em sucesu_usuarios pode acessar o SUCESU SP Connect.
async function getEscopo(userId: string): Promise<EscopoResult> {
  const { data, error } = await supabase
    .from("sucesu_usuarios")
    .select("associacao_id, is_admin, papel")
    .eq("id", userId)
    .maybeSingle()
  if (error) return { status: "erro" }
  if (!data) return { status: "sem_acesso" }
  return { status: "ok", escopo: data as UsuarioEscopo }
}

// Ao reabrir o app com o access token vencido, a primeira consulta pode sair com o
// JWT antigo (401) enquanto o supabase-js faz o refresh. Antes isso era tratado como
// "sem acesso" e o app deslogava o usuário. Agora só deslogamos quando a consulta
// funciona e confirma que o usuário não pertence ao app; em erro, tentamos de novo.
async function getEscopoComRetry(userId: string): Promise<EscopoResult> {
  let result = await getEscopo(userId)
  for (let tentativa = 1; result.status === "erro" && tentativa <= 2; tentativa++) {
    await new Promise((r) => setTimeout(r, 400 * tentativa))
    await supabase.auth.getSession()
    result = await getEscopo(userId)
  }
  return result
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [escopo, setEscopo] = useState<UsuarioEscopo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ativo = true

    async function aplicarSessao(newSession: Session | null) {
      if (!newSession) {
        if (!ativo) return
        setSession(null)
        setEscopo(null)
        setLoading(false)
        return
      }

      const result = await getEscopoComRetry(newSession.user.id)
      if (!ativo) return

      if (result.status === "sem_acesso") {
        await supabase.auth.signOut()
        setSession(null)
        setEscopo(null)
      } else if (result.status === "ok") {
        setEscopo(result.escopo)
        setSession(newSession)
      }
      // status "erro": mantém o estado atual e não desloga; o próximo evento de auth
      // (ex.: TOKEN_REFRESHED) tenta de novo.
      setLoading(false)
    }

    // INITIAL_SESSION cobre o carregamento inicial (substitui o getSession()).
    // Nunca aguardar chamadas do Supabase dentro do callback: o supabase-js segura
    // um lock de auth durante ele, e o await pode travar ou usar o token antigo.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setTimeout(() => {
        void aplicarSessao(newSession)
      }, 0)
    })

    return () => {
      ativo = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  async function signIn(usuario: string, password: string) {
    const { data: email, error: resolveError } = await supabase.rpc("sucesu_resolver_login", {
      p_usuario: usuario.trim(),
    })
    if (resolveError || !email) {
      return { error: "Usuário ou senha inválidos." }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: "Usuário ou senha inválidos." }

    const result = await getEscopoComRetry(data.user.id)
    if (result.status === "sem_acesso") {
      await supabase.auth.signOut()
      return { error: "Esta conta não tem acesso ao SUCESU SP Connect." }
    }
    if (result.status === "erro") {
      return { error: "Não foi possível validar seu acesso. Tente novamente." }
    }
    setEscopo(result.escopo)

    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, escopo, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
