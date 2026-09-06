import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { listFormularios } from "../lib/formularios"
import { STATUS_FORMULARIO } from "../types/formulario"
import { formatDateBR } from "../lib/format"
import type { FormularioComRelacoes } from "../types/formulario"

const statusColors: Record<string, string> = {
  Rascunho: "bg-slate-100 text-slate-600",
  Publicado: "bg-green-100 text-green-700",
  Encerrado: "bg-amber-100 text-amber-700",
}

export function FormulariosList() {
  const navigate = useNavigate()
  const [formularios, setFormularios] = useState<FormularioComRelacoes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    listFormularios()
      .then(setFormularios)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return formularios.filter((f) => {
      const matchesTerm = !term || f.titulo.toLowerCase().includes(term)
      const matchesStatus = !statusFilter || f.status === statusFilter
      return matchesTerm && matchesStatus
    })
  }, [formularios, search, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Formulários</h1>
          <p className="mt-1 text-slate-500">Pesquisas e formulários da associação</p>
        </div>
        <Link
          to="/formularios/novo"
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          Novo Formulário
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por título..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS_FORMULARIO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}
        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}
        {!error && !loading && filtered.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum formulário encontrado.</p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Vice-Presidência</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 font-medium">Respostas</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => navigate(`/formularios/${f.id}/editar`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{f.titulo}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {f.sucesu_vice_presidencias?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateBR(f.data_criacao)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {f.sucesu_formulario_respostas?.[0]?.count ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[f.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {f.status}
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
