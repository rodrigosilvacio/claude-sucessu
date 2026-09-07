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
import type { Usuario } from "../types/usuario"
import type { AssociacaoOption } from "../types/associacao"

const PAPEL_LABELS: Record<Usuario["papel"], string> = {
  gestor: "Gestor",
  financeiro: "Financeiro",
}

export function UsuariosList() {
  const { session } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [associacoes, setAssociacoes] = useState<AssociacaoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [novoNome, setNovoNome] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [novaAssociacaoId, setNovaAssociacaoId] = useState("")
  const [novoAdmin, setNovoAdmin] = useState(false)
  const [novoPapel, setNovoPapel] = useState<Usuario["papel"]>("gestor")
  const [convidando, setConvidando] = useState(false)

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

  async function handleConvidar(e: React.FormEvent) {
    e.preventDefault()
    if (!novoEmail.trim()) return
    setConvidando(true)
    setError(null)
    setAviso(null)
    try {
      const result = await convidarUsuario(
        novoEmail.trim(),
        novoNome.trim() || undefined,
        novaAssociacaoId || undefined,
        novoAdmin,
        novoPapel,
        novaSenha || undefined,
      )
      setAviso(
        result.contaExistente
          ? `${novoEmail.trim()} já tinha uma conta neste projeto — foi apenas liberado o acesso ao SUCESU SP Connect. A senha existente dela não foi alterada.`
          : `Conta criada. Informe à pessoa: e-mail ${novoEmail.trim()} e a senha definida.`,
      )
      setNovoEmail("")
      setNovoNome("")
      setNovaSenha("")
      setNovoAdmin(false)
      setNovoPapel("gestor")
      carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao convidar usuário.")
    } finally {
      setConvidando(false)
    }
  }

  async function handleDefinirSenha(usuario: Usuario) {
    const novaSenha = window.prompt(
      `Nova senha para ${usuario.email} (mínimo 6 caracteres):\nIsso muda a senha de login dessa conta — se ela usa outro sistema seu com o mesmo e-mail, a senha muda lá também.`,
    )
    if (!novaSenha) return
    setError(null)
    setAviso(null)
    try {
      await definirSenhaUsuario(usuario.id, novaSenha)
      setAviso(`Senha atualizada para ${usuario.email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao definir senha.")
    }
  }

  async function handleAssociacaoChange(usuario: Usuario, associacaoId: string) {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? { ...u, associacao_id: associacaoId || null } : u)),
    )
    try {
      await atualizarEscopoUsuario(usuario.id, associacaoId || null, usuario.is_admin, usuario.papel)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar associação.")
      carregar()
    }
  }

  async function handleAdminChange(usuario: Usuario, isAdmin: boolean) {
    setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, is_admin: isAdmin } : u)))
    try {
      await atualizarEscopoUsuario(usuario.id, usuario.associacao_id, isAdmin, usuario.papel)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar permissão.")
      carregar()
    }
  }

  async function handlePapelChange(usuario: Usuario, papel: Usuario["papel"]) {
    setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? { ...u, papel } : u)))
    try {
      await atualizarEscopoUsuario(usuario.id, usuario.associacao_id, usuario.is_admin, papel)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar papel.")
      carregar()
    }
  }

  async function handleRemoverAcesso(usuario: Usuario) {
    if (usuario.id === session?.user.id) {
      setError("Você não pode remover seu próprio acesso por aqui.")
      return
    }
    if (
      !window.confirm(
        `Remover o acesso de ${usuario.email} ao SUCESU SP Connect? A conta continua existindo (pode ser usada em outros sistemas), só perde acesso a este.`,
      )
    )
      return
    setError(null)
    try {
      await removerAcessoUsuario(usuario.id)
      carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover acesso.")
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
        Contas com acesso ao SUCESU SP Connect (este projeto Supabase é compartilhado com outros
        sistemas seus — aqui só aparecem contas autorizadas para este). Administradores veem todas
        as associações; os demais ficam vinculados a uma associação específica. O papel Financeiro é
        o único que pode criar, editar ou excluir contas a pagar/receber.
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-brand-navy-900">Cadastrar novo usuário</h2>
        <p className="mt-1 text-xs text-slate-500">
          Você define a senha inicial e informa e-mail e senha diretamente para a pessoa.
        </p>
        <form onSubmit={handleConvidar} className="mt-3 flex flex-wrap gap-2">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome"
            className="min-w-[160px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
          <input
            type="email"
            required
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
          <input
            type="text"
            required
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Senha inicial (mín. 6 caracteres)"
            className="min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
          <select
            value={novaAssociacaoId}
            onChange={(e) => setNovaAssociacaoId(e.target.value)}
            disabled={novoAdmin}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Sem associação</option>
            {associacoes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <select
            value={novoPapel}
            onChange={(e) => setNovoPapel(e.target.value as Usuario["papel"])}
            disabled={novoAdmin}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="gestor">Gestor</option>
            <option value="financeiro">Financeiro</option>
          </select>
          <label className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">
            <input type="checkbox" checked={novoAdmin} onChange={(e) => setNovoAdmin(e.target.checked)} />
            Administrador
          </label>
          <button
            type="submit"
            disabled={convidando}
            className="flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-800 disabled:opacity-60"
          >
            <UserPlus size={16} />
            {convidando ? "Salvando..." : "Cadastrar"}
          </button>
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
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Associação</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
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
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
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
                      {u.is_admin ? (
                        <span className="text-xs text-slate-400">Todos os papéis</span>
                      ) : (
                        <select
                          value={u.papel}
                          onChange={(e) => handlePapelChange(u, e.target.value as Usuario["papel"])}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-brand-blue-500 focus:outline-none"
                        >
                          <option value="gestor">{PAPEL_LABELS.gestor}</option>
                          <option value="financeiro">{PAPEL_LABELS.financeiro}</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={u.is_admin}
                        onChange={(e) => handleAdminChange(u, e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleString("pt-BR")
                        : "Nunca acessou"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleDefinirSenha(u)}
                          title="Definir nova senha"
                          className="text-slate-400 hover:text-brand-blue-600"
                        >
                          <KeyRound size={16} />
                        </button>
                        <button
                          onClick={() => handleRemoverAcesso(u)}
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
    </div>
  )
}
