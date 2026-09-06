import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { listFornecedores } from "../lib/fornecedores"
import { STATUS_FORNECEDOR } from "../constants/cadastro-options"
import { formatCNPJ } from "../lib/format"
import type { Fornecedor } from "../types/fornecedor"

const statusColors: Record<string, string> = {
  Ativo: "bg-green-100 text-green-700",
  Inativo: "bg-slate-100 text-slate-600",
}

export function FornecedoresList() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    listFornecedores()
      .then(setFornecedores)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return fornecedores.filter((f) => {
      const matchesTerm =
        !term ||
        f.razao_social.toLowerCase().includes(term) ||
        f.nome_fantasia?.toLowerCase().includes(term) ||
        f.cnpj?.includes(term)
      const matchesStatus = !statusFilter || f.status === statusFilter
      return matchesTerm && matchesStatus
    })
  }, [fornecedores, search, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Fornecedores</h1>
          <p className="mt-1 text-slate-500">Fornecedores de produtos e serviços da associação</p>
        </div>
        <Link
          to="/fornecedores/novo"
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          Novo Fornecedor
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por razão social, nome fantasia ou CNPJ..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS_FORNECEDOR.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}

        {!error && !loading && filtered.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum fornecedor encontrado.</p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Razão Social</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Ramo de Atividade</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fornecedor) => (
                <tr
                  key={fornecedor.id}
                  onClick={() => navigate(`/fornecedores/${fornecedor.id}/editar`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-brand-navy-900">{fornecedor.razao_social}</div>
                    {fornecedor.nome_fantasia && (
                      <div className="text-xs text-slate-400">{fornecedor.nome_fantasia}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {fornecedor.cnpj ? formatCNPJ(fornecedor.cnpj) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{fornecedor.ramo_atividade || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{fornecedor.telefone || "—"}</div>
                    <div className="text-xs text-slate-400">{fornecedor.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[fornecedor.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {fornecedor.status}
                    </span>
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
