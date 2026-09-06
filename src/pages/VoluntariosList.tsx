import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { listVoluntarios } from "../lib/voluntarios"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { AssociadoAvatar } from "../components/AssociadoAvatar"
import { formatDateBR } from "../lib/format"
import type { VoluntarioComAssociado } from "../types/voluntario"
import type { VicePresidencia } from "../types/vicePresidencia"

function isAtivo(dataTermino: string | null) {
  return !dataTermino || dataTermino >= new Date().toISOString().slice(0, 10)
}

export function VoluntariosList() {
  const navigate = useNavigate()
  const [voluntarios, setVoluntarios] = useState<VoluntarioComAssociado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [vpFilter, setVpFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])

  useEffect(() => {
    listVoluntarios()
      .then(setVoluntarios)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    listVicePresidencias().then(setVicePresidencias)
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return voluntarios.filter((v) => {
      const nome = v.sucesu_associados?.nome_completo.toLowerCase() ?? ""
      const matchesTerm = !term || nome.includes(term)
      const matchesVp = !vpFilter || v.vice_presidencia_id === vpFilter
      const ativo = isAtivo(v.data_termino)
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "Ativo" && ativo) ||
        (statusFilter === "Encerrado" && !ativo)
      return matchesTerm && matchesVp && matchesStatus
    })
  }, [voluntarios, search, vpFilter, statusFilter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Voluntários</h1>
          <p className="mt-1 text-slate-500">Associados atuando como voluntários nas Vice-Presidências</p>
        </div>
        <Link
          to="/voluntarios/novo"
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          Novo Voluntário
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome do associado..."
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
          <option value="Ativo">Ativo</option>
          <option value="Encerrado">Encerrado</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}

        {!error && !loading && filtered.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum voluntário encontrado.</p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-medium">Associado</th>
                <th className="px-4 py-3 font-medium">Vice-Presidência</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3 font-medium">Contato preferido</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((voluntario) => {
                const associado = voluntario.sucesu_associados
                const ativo = isAtivo(voluntario.data_termino)
                return (
                  <tr
                    key={voluntario.id}
                    onClick={() => navigate(`/voluntarios/${voluntario.id}/editar`)}
                    className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <AssociadoAvatar
                        fotoPath={associado?.foto_url ?? null}
                        nome={associado?.nome_completo ?? ""}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-navy-900">
                        {associado?.nome_completo ?? "—"}
                      </div>
                      <div className="text-xs text-slate-400">
                        Nº {associado?.numero_associado} · {associado?.categoria_associado || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {voluntario.sucesu_vice_presidencias?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDateBR(voluntario.data_inicio)} –{" "}
                      {voluntario.data_termino ? formatDateBR(voluntario.data_termino) : "atual"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{voluntario.preferencia_contato}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ativo ? "Ativo" : "Encerrado"}
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
