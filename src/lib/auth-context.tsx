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

// Este projeto Supabase é compartilhado com outros apps do usuário — uma sessão
// válida não basta. Só quem está em sucesu_usuarios pode acessar o SUCESU SP Connect.
async function getEscopo(userId: string): Promise<UsuarioEscopo | null> {
  const { data } = await supabase
    .from("sucesu_usuarios")
    .select("associacao_id, is_admin, papel")
    .eq("id", userId)
    .maybeSingle()
  return data as UsuarioEscopo | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [escopo, setEscopo] = useState<UsuarioEscopo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const escopoAtual = await getEscopo(data.session.user.id)
        if (!escopoAtual) {
          await supabase.auth.signOut()
          setSession(null)
          setEscopo(null)
        } else {
          setSession(data.session)
          setEscopo(escopoAtual)
        }
      } else {
        setSession(null)
      }
      setLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession) {
        const escopoAtual = await getEscopo(newSession.user.id)
        if (!escopoAtual) {
          await supabase.auth.signOut()
          setSession(null)
          setEscopo(null)
          return
        }
        setEscopo(escopoAtual)
      } else {
        setEscopo(null)
      }
      setSession(newSession)
    })

    return () => subscription.subscription.unsubscribe()
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

    const escopoAtual = await getEscopo(data.user.id)
    if (!escopoAtual) {
      await supabase.auth.signOut()
      return { error: "Esta conta não tem acesso ao SUCESU SP Connect." }
    }
    setEscopo(escopoAtual)

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
