import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Logo } from "../components/Logo"
import { supabase } from "../lib/supabase"

export function DefinirSenha() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [sessionValida, setSessionValida] = useState(false)
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionValida(Boolean(data.session))
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.")
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: senha })
    setSubmitting(false)

    if (updateError) {
      setError("Não foi possível definir a senha. Tente pedir um novo link.")
      return
    }

    setSucesso(true)
    setTimeout(() => navigate("/"), 1500)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4">
      <div className="rounded-2xl bg-white px-8 py-5 shadow-sm">
        <Logo />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        {checking && <p className="text-center text-sm text-slate-400">Verificando link...</p>}

        {!checking && !sessionValida && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-brand-navy-900">Link inválido ou expirado</h1>
            <p className="mt-2 text-sm text-slate-500">
              Peça para um administrador gerar um novo link em Usuários.
            </p>
          </div>
        )}

        {!checking && sessionValida && sucesso && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-brand-navy-900">Senha definida!</h1>
            <p className="mt-2 text-sm text-slate-500">Redirecionando para o sistema...</p>
          </div>
        )}

        {!checking && sessionValida && !sucesso && (
          <>
            <h1 className="text-center text-2xl font-bold text-brand-navy-900">Defina sua senha</h1>
            <p className="mt-2 text-center text-slate-500">
              Escolha a senha que você vai usar para acessar o sistema
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="senha" className="text-sm font-medium text-brand-navy-900">
                  Nova senha
                </label>
                <input
                  id="senha"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirmarSenha" className="text-sm font-medium text-brand-navy-900">
                  Confirmar senha
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
              >
                {submitting ? "Salvando..." : "Salvar senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
