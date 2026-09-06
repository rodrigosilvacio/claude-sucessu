import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CheckCircle2, ExternalLink, Plus, Search } from "lucide-react"
import { approveAssociado, listAssociados } from "../lib/associados"
import { AssociadoAvatar } from "../components/AssociadoAvatar"
import { STATUS_ASSOCIADO, CATEGORIAS_ASSOCIADO } from "../constants/associado-options"
import type { Associado } from "../types/associado"

const statusColors: Record<string, string> = {
  Ativo: "bg-green-100 text-green-700",
  Inativo: "bg-slate-100 text-slate-600",
  Suspenso: "bg-amber-100 text-amber-700",
  "Pendente de Aprovação": "bg-blue-100 text-blue-700",
}

export function AssociadosList() {
  const navigate = useNavigate()
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("")
  const [approvingId, setApprovingId] = useState<string | null>(null)

  useEffect(() => {
    listAssociados()
      .then(setAssociados)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setApprovingId(id)
    try {
      const updated = await approveAssociado(id)
      setAssociados((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar associado.")
    } finally {
      setApprovingId(null)
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return associados.filter((a) => {
      const matchesTerm =
        !term ||
        a.nome_completo.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        String(a.numero_associado).includes(term)
      const matchesStatus = !statusFilter || a.status === statusFilter
      const matchesCategoria = !categoriaFilter || a.categoria_associado === categoriaFilter
      return matchesTerm && matchesStatus && matchesCategoria
    })
  }, [associados, search, statusFilter, categoriaFilter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Associados</h1>
          <p className="mt-1 text-slate-500">Cadastro central de associados da SUCESU SP</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/pre-cadastro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-navy-900 transition-colors hover:bg-slate-50"
          >
            <ExternalLink size={18} />
            Link de Pré-Cadastro
          </a>
          <Link
            to="/associados/novo"
            className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
          >
            <Plus size={18} />
            Novo Associado
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, e-mail ou número..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS_ASSOCIADO.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select
          value={categoriaFilter}
          onChange={(e) => setCategoriaFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS_ASSOCIADO.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}

        {!error && !loading && filtered.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum associado encontrado.</p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nº</th>
                <th className="px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Cidade/UF</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((associado) => (
                <tr
                  key={associado.id}
                  onClick={() => navigate(`/associados/${associado.id}/editar`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-slate-500">{associado.numero_associado}</td>
                  <td className="px-4 py-3">
                    <AssociadoAvatar fotoPath={associado.foto_url} nome={associado.nome_completo} />
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-navy-900">
                    {associado.nome_completo}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {associado.categoria_associado || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {[associado.cidade, associado.estado].filter(Boolean).join("/") || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{associado.telefone}</div>
                    <div className="text-xs text-slate-400">{associado.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[associado.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {associado.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {associado.status === "Pendente de Aprovação" && (
                      <button
                        onClick={(e) => handleApprove(e, associado.id)}
                        disabled={approvingId === associado.id}
                        className="flex items-center gap-1.5 rounded-lg border border-green-600 px-3 py-1.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:opacity-60"
                      >
                        <CheckCircle2 size={14} />
                        {approvingId === associado.id ? "Aprovando..." : "Aprovar"}
                      </button>
                    )}
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
