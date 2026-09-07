import { useState, type FormEvent } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { Logo } from "../components/Logo"
import { useAuth } from "../lib/auth-context"

export function Login() {
  const { session, signIn } = useAuth()
  const location = useLocation()
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? "/"
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(usuario, password)
    setSubmitting(false)
    if (error) setError(error)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4">
      <div className="rounded-2xl bg-white px-8 py-5 shadow-sm">
        <Logo />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-brand-navy-900">Bem-vindo de volta</h1>
        <p className="mt-2 text-center text-slate-500">Acesse com seu usuário e senha</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="usuario" className="text-sm font-medium text-brand-navy-900">
              Usuário
            </label>
            <input
              id="usuario"
              type="text"
              required
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-brand-navy-900">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Esqueceu sua senha? Peça para um administrador redefinir em Usuários.
        </p>
      </div>
    </div>
  )
}
