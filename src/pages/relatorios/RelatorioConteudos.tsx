import { useEffect, useMemo, useState } from "react"
import { listConteudos } from "../../lib/conteudos"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatDateBR } from "../../lib/format"
import { STATUS_CONTEUDO } from "../../types/conteudo"
import type { ConteudoComRelacoes } from "../../types/conteudo"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS: ReportColumn[] = [
  { header: "Título", key: "titulo" },
  { header: "Vice-Presidência", key: "vp_nome" },
  { header: "Solicitante", key: "solicitante_nome" },
  { header: "Prioridade", key: "prioridade" },
  { header: "Status", key: "status" },
  { header: "Publicação Esperada", key: "data_esperada_publicacao_fmt" },
]

export function RelatorioConteudos() {
  const [conteudos, setConteudos] = useState<ConteudoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listConteudos()
      .then(setConteudos)
      .finally(() => setLoading(false))
  }, [])

  const porStatus = useMemo(
    () =>
      STATUS_CONTEUDO.map((status) => ({
        label: status,
        value: conteudos.filter((c) => c.status === status).length,
      })),
    [conteudos],
  )

  const porVp = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of conteudos) {
      const nome = c.sucesu_vice_presidencias?.nome ?? "Sem VP"
      map.set(nome, (map.get(nome) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  }, [conteudos])

  const rows = useMemo(
    () =>
      conteudos.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        vp_nome: c.sucesu_vice_presidencias?.nome ?? "—",
        solicitante_nome: c.sucesu_voluntarios?.sucesu_associados?.nome_completo ?? "—",
        prioridade: c.prioridade,
        status: c.status,
        data_esperada_publicacao_fmt: formatDateBR(c.data_esperada_publicacao),
      })),
    [conteudos],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de Conteúdos" value={conteudos.length} />
        <StatCard label="A Fazer" value={conteudos.filter((c) => c.status === "A Fazer").length} />
        <StatCard
          label="Em Andamento"
          value={conteudos.filter((c) => c.status === "Em Andamento").length}
        />
        <StatCard
          label="Concluído"
          value={conteudos.filter((c) => c.status === "Concluído").length}
          tone="green"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Status (Kanban)</h3>
          <div className="mt-4">
            <BarChart data={porStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Vice-Presidência</h3>
          <div className="mt-4">
            <BarChart data={porVp} />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Listagem de Conteúdos</h3>
          <ExportButtons filename="conteudos" title="Relatório de Conteúdos" columns={COLUNAS} rows={rows} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {COLUNAS.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-medium">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS.length} className="px-4 py-5 text-sm text-slate-400">
                    Nenhum conteúdo cadastrado.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.titulo}</td>
                  <td className="px-4 py-3 text-slate-600">{r.vp_nome}</td>
                  <td className="px-4 py-3 text-slate-600">{r.solicitante_nome}</td>
                  <td className="px-4 py-3 text-slate-600">{r.prioridade}</td>
                  <td className="px-4 py-3 text-slate-600">{r.status}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_esperada_publicacao_fmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
