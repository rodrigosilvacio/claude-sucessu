import { useEffect, useState } from "react"
import { Check, KeyRound, UserPlus, UserX } from "lucide-react"
import {
  atualizarEscopoUsuario,
  convidarUsuario,
  definirSenhaUsuario,
  listUsuarios,
  removerAcessoUsuario,
} from "../lib/usuarios"
import { listAssociacaoOptions } from "../lib/associacoes"
import { useAuth } from "../lib/auth-context"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { SetPasswordDialog } from "../components/SetPasswordDialog"
import { PasswordField } from "../components/PasswordField"
import type { Usuario } from "../types/usuario"
import type { AssociacaoOption } from "../types/associacao"

const PAPEL_LABELS: Record<Usuario["papel"], string> = {
  admin: "Admin",
  gestor: "Gestor",
}

const AVISO_DURACAO_MS = 5000

export function UsuariosList() {
  const { session } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [associacoes, setAssociacoes] = useState<AssociacaoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [novoNome, setNovoNome] = useState("")
  const [novoUsuario, setNovoUsuario] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [novaAssociacaoId, setNovaAssociacaoId] = useState("")
  const [novoPapel, setNovoPapel] = useState<Usuario["papel"]>("gestor")
  const [salvando, setSalvando] = useState(false)

  const [confirmDemote, setConfirmDemote] = useState<Usuario | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<Usuario | null>(null)
  const [passwordTarget, setPasswordTarget] = useState<Usuario | null>(null)

  function carregar() {
    setLoading(true)
    listUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar usuários."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
    listAssociacaoOptions().then((options) => {
      setAssociacoes(options)
      if (options.length === 1) setNovaAssociacaoId(options[0].id)
    })
  }, [])

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(null), AVISO_DURACAO_MS)
    return () => clearTimeout(timer)
  }, [aviso])

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoUsuario.trim() || !novaSenha.trim()) return
    setSalvando(true)
    setError(null)
    setAviso(null)
    try {
      const result = await convidarUsuario({
        usuario: novoUsuario.trim(),
        password: novaSenha,
        nome: novoNome.trim() || undefined,
        email: novoEmail.trim() || undefined,
        associacaoId: novaAssociacaoId || undefined,
        papel: novoPapel,
      })
      setAviso(
        result.contaExistente
          ? `Esse e-mail já tinha uma conta neste projeto — foi apenas liberado o acesso ao SUCESU SP Connect. A senha existente dela não foi alterada.`
          : `Usuário "${result.user.usuario}" cadastrado. Informe a ele o usuário e a senha definida para fazer login.`,
      )
      setNovoNome("")
      setNovoUsuario("")
      setNovoEmail("")
      setNovaSenha("")
      setNovoPapel("gestor")
      carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar usuário.")
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarNovaSenha(senha: string) {
    if (!passwordTarget) return
    setError(null)
    setAviso(null)
    try {
      await definirSenhaUsuario(passwordTarget.id, senha)
      setAviso(`Senha atualizada para "${passwordTarget.usuario}".`)
      setPasswordTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao definir senha.")
    }
  }

  async function handleAssociacaoChange(usuario: Usuario, associacaoId: string) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, associacao_id: associacaoId || null } : u)),
    )
    try {
      await atualizarEscopoUsuario(usuario.id, associacaoId || null, usuario.papel)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar associação.")
      carregar()
    }
  }

  async function aplicarPapelChange(usuario: Usuario, papel: Usuario["papel"]) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, papel, is_admin: papel === "admin" } : u)),
    )
    try {
      await atualizarEscopoUsuario(usuario.id, usuario.associacao_id, papel)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar papel.")
      carregar()
    }
  }

  function handlePapelChange(usuario: Usuario, papel: Usuario["papel"]) {
    const isAutoRebaixamento =
      usuario.id === session?.user.id && usuario.papel === "admin" && papel === "gestor"

    if (isAutoRebaixamento) {
      const outrosAdmins = usuarios.filter((u) => u.id !== usuario.id && u.papel === "admin").length
      if (outrosAdmins === 0) {
        setError(
          "Você é o único Admin cadastrado. Promova outro usuário a Admin antes de deixar de ser.",
        )
        return
      }
      setConfirmDemote(usuario)
      return
    }

    aplicarPapelChange(usuario, papel)
  }

  function handleRemoverAcessoClick(usuario: Usuario) {
    if (usuario.id === session?.user.id) {
      setError("Você não pode remover seu próprio acesso por aqui.")
      return
    }
    setConfirmRevoke(usuario)
  }

  async function confirmarRemoverAcesso() {
    if (!confirmRevoke) return
    setError(null)
    try {
      await removerAcessoUsuario(confirmRevoke.id)
      carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover acesso.")
    } finally {
      setConfirmRevoke(null)
    }
  }

  function nomeAssociacao(id: string | null) {
    if (!id) return "—"
    return associacoes.find((a) => a.id === id)?.nome ?? "—"
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">Usuários</h1>
      <p className="mt-1 text-slate-500">
        Contas com acesso ao SUCESU SP Connect. Admin tem acesso completo, incluindo Associação,
        Usuários e Auditoria; Gestor tem acesso a tudo, exceto essas três telas de configuração.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-brand-navy-900">Cadastrar novo usuário</h2>
        <form onSubmit={handleCadastrar} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="novo-nome" className="text-xs font-medium text-slate-500">
              Nome
            </label>
            <input
              id="novo-nome"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="novo-usuario" className="text-xs font-medium text-slate-500">
              Usuário (para login) *
            </label>
            <input
              id="novo-usuario"
              value={novoUsuario}
              onChange={(e) => setNovoUsuario(e.target.value)}
              required
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="novo-email" className="text-xs font-medium text-slate-500">
              E-mail (opcional)
            </label>
            <input
              id="novo-email"
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="nova-senha" className="text-xs font-medium text-slate-500">
              Senha (mín. 6 caracteres) *
            </label>
            <PasswordField
              id="nova-senha"
              value={novaSenha}
              onChange={setNovaSenha}
              required
              placeholder="Digite ou gere uma senha"
              className="mt-1"
            />
          </div>

          <div>
            <label htmlFor="nova-associacao" className="text-xs font-medium text-slate-500">
              Associação
            </label>
            <select
              id="nova-associacao"
              value={novaAssociacaoId}
              onChange={(e) => setNovaAssociacaoId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            >
              <option value="">Sem associação</option>
              {associacoes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="novo-papel" className="text-xs font-medium text-slate-500">
              Papel
            </label>
            <select
              id="novo-papel"
              value={novoPapel}
              onChange={(e) => setNovoPapel(e.target.value as Usuario["papel"])}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            >
              <option value="gestor">Gestor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={salvando}
              className="flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-800 disabled:opacity-60"
            >
              <UserPlus size={16} />
              {salvando ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>

        {aviso && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
            <Check size={16} className="mt-0.5 shrink-0" />
            {aviso}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}
        {!loading && usuarios.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum usuário encontrado.</p>
        )}

        {!loading && usuarios.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Associação</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Último acesso</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-brand-navy-900">
                      {u.nome || "—"}
                      {u.id === session?.user.id && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          você
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.usuario}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.is_admin ? (
                        <span className="text-xs text-slate-400">Todas</span>
                      ) : (
                        <select
                          value={u.associacao_id ?? ""}
                          onChange={(e) => handleAssociacaoChange(u, e.target.value)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-brand-blue-500 focus:outline-none"
                        >
                          <option value="">Sem associação</option>
                          {associacoes.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.nome}
                            </option>
                          ))}
                        </select>
                      )}
                      {u.is_admin && (
                        <div className="text-xs text-slate-400">{nomeAssociacao(u.associacao_id)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <select
                        value={u.papel}
                        onChange={(e) => handlePapelChange(u, e.target.value as Usuario["papel"])}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-brand-blue-500 focus:outline-none"
                      >
                        <option value="gestor">{PAPEL_LABELS.gestor}</option>
                        <option value="admin">{PAPEL_LABELS.admin}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString("pt-BR")
                        : "Nunca acessou"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setPasswordTarget(u)}
                          title="Definir nova senha"
                          className="text-slate-400 hover:text-brand-blue-600"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoverAcessoClick(u)}
                          title="Remover acesso ao SUCESU SP Connect"
                          className="text-slate-400 hover:text-red-600"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDemote !== null}
        title="Deixar de ser Admin?"
        message="Você vai perder acesso a Associação, Usuários e Auditoria imediatamente. Tem certeza que quer continuar?"
        confirmLabel="Sim, deixar de ser Admin"
        danger
        onConfirm={() => {
          if (confirmDemote) aplicarPapelChange(confirmDemote, "gestor")
          setConfirmDemote(null)
        }}
        onCancel={() => setConfirmDemote(null)}
      />

      <ConfirmDialog
        open={confirmRevoke !== null}
        title="Remover acesso"
        message={
          confirmRevoke
            ? `Remover o acesso de "${confirmRevoke.usuario}" ao SUCESU SP Connect? A conta continua existindo (pode ser usada em outros sistemas), só perde acesso a este.`
            : ""
        }
        confirmLabel="Remover acesso"
        danger
        onConfirm={confirmarRemoverAcesso}
        onCancel={() => setConfirmRevoke(null)}
      />

      <SetPasswordDialog
        open={passwordTarget !== null}
        usuarioNome={passwordTarget?.usuario ?? ""}
        onConfirm={confirmarNovaSenha}
        onCancel={() => setPasswordTarget(null)}
      />
    </div>
  )
}
