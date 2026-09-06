import { useEffect, useMemo, useState } from "react"
import { listEventos } from "../../lib/eventos"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatDateBR } from "../../lib/format"
import { STATUS_EVENTO, MODALIDADES_EVENTO } from "../../types/evento"
import type { EventoComRelacoes } from "../../types/evento"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS: ReportColumn[] = [
  { header: "Nome", key: "nome" },
  { header: "Data", key: "data_evento_fmt" },
  { header: "Modalidade", key: "modalidade" },
  { header: "Vagas", key: "vagas_limite" },
  { header: "Inscritos", key: "inscritos" },
  { header: "Status", key: "status" },
]

export function RelatorioEventos() {
  const [eventos, setEventos] = useState<EventoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listEventos()
      .then(setEventos)
      .finally(() => setLoading(false))
  }, [])

  const totalInscritos = useMemo(
    () => eventos.reduce((sum, e) => sum + (e.sucesu_evento_inscricoes?.[0]?.count ?? 0), 0),
    [eventos],
  )

  const porStatus = useMemo(
    () =>
      STATUS_EVENTO.map((status) => ({
        label: status,
        value: eventos.filter((e) => e.status === status).length,
      })),
    [eventos],
  )

  const porModalidade = useMemo(
    () =>
      MODALIDADES_EVENTO.map((modalidade) => ({
        label: modalidade,
        value: eventos.filter((e) => e.modalidade === modalidade).length,
      })),
    [eventos],
  )

  const rows = useMemo(
    () =>
      eventos.map((e) => ({
        id: e.id,
        nome: e.nome,
        data_evento_fmt: formatDateBR(e.data_evento),
        modalidade: e.modalidade,
        vagas_limite: e.vagas_limite ?? "Sem limite",
        inscritos: e.sucesu_evento_inscricoes?.[0]?.count ?? 0,
        status: e.status,
      })),
    [eventos],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de Eventos" value={eventos.length} />
        <StatCard label="Planejados" value={eventos.filter((e) => e.status === "Planejado").length} />
        <StatCard
          label="Realizados"
          value={eventos.filter((e) => e.status === "Realizado").length}
          tone="green"
        />
        <StatCard label="Total de Inscritos" value={totalInscritos} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Status</h3>
          <div className="mt-4">
            <BarChart data={porStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Modalidade</h3>
          <div className="mt-4">
            <BarChart data={porModalidade} />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Listagem de Eventos</h3>
          <ExportButtons filename="eventos" title="Relatório de Eventos" columns={COLUNAS} rows={rows} />
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
                    Nenhum evento cadastrado.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_evento_fmt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.modalidade}</td>
                  <td className="px-4 py-3 text-slate-600">{r.vagas_limite}</td>
                  <td className="px-4 py-3 text-slate-600">{r.inscritos}</td>
                  <td className="px-4 py-3 text-slate-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
