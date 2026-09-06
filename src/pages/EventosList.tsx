import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { listEventos } from "../lib/eventos"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { STATUS_EVENTO } from "../types/evento"
import { formatDateBR } from "../lib/format"
import type { EventoComRelacoes } from "../types/evento"
import type { VicePresidencia } from "../types/vicePresidencia"

const statusColors: Record<string, string> = {
  Planejado: "bg-blue-100 text-blue-700",
  Realizado: "bg-green-100 text-green-700",
  Cancelado: "bg-red-100 text-red-700",
}

function formatCurrency(value: number | null) {
  if (value === null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function EventosList() {
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<EventoComRelacoes[]>([])
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [vpFilter, setVpFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  useEffect(() => {
    listEventos()
      .then(setEventos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    listVicePresidencias().then(setVicePresidencias)
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return eventos.filter((e) => {
      const matchesTerm = !term || e.nome.toLowerCase().includes(term)
      const matchesVp = !vpFilter || e.vice_presidencia_id === vpFilter
      const matchesStatus = !statusFilter || e.status === statusFilter
      return matchesTerm && matchesVp && matchesStatus
    })
  }, [eventos, search, vpFilter, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Eventos</h1>
          <p className="mt-1 text-slate-500">Eventos organizados pelas Vice-Presidências</p>
        </div>
        <Link
          to="/eventos/novo"
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          Novo Evento
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome do evento..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={vpFilter}
          onChange={(e) => setVpFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todas as Vice-Presidências</option>
          {vicePresidencias.map((vp) => (
            <option key={vp.id} value={vp.id}>
              {vp.nome}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todos os status</option>
          {STATUS_EVENTO.map((s) => (
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
          <p className="p-5 text-sm text-slate-400">Nenhum evento encontrado.</p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Vice-Presidência</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Inscritos</th>
                <th className="px-4 py-3 font-medium">Custo</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evento) => {
                const inscritos = evento.sucesu_evento_inscricoes?.[0]?.count ?? 0
                return (
                  <tr
                    key={evento.id}
                    onClick={() => navigate(`/eventos/${evento.id}/editar`)}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-navy-900">{evento.nome}</div>
                      <div className="text-xs text-slate-400">
                        {evento.sucesu_voluntarios?.sucesu_associados?.nome_completo ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {evento.sucesu_vice_presidencias?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateBR(evento.data_evento)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {inscritos}
                      {evento.vagas_limite ? ` / ${evento.vagas_limite}` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(evento.custo_evento)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusColors[evento.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {evento.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
