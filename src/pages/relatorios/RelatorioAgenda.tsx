import { useEffect, useMemo, useState } from "react"
import { listEventos } from "../../lib/eventos"
import { listConteudos } from "../../lib/conteudos"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatDateBR } from "../../lib/format"
import type { EventoComRelacoes } from "../../types/evento"
import type { ConteudoComRelacoes } from "../../types/conteudo"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS: ReportColumn[] = [
  { header: "Data", key: "data_fmt" },
  { header: "Tipo", key: "tipo" },
  { header: "Título", key: "titulo" },
]

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function RelatorioAgenda() {
  const [eventos, setEventos] = useState<EventoComRelacoes[]>([])
  const [conteudos, setConteudos] = useState<ConteudoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listEventos(), listConteudos()])
      .then(([e, c]) => {
        setEventos(e)
        setConteudos(c)
      })
      .finally(() => setLoading(false))
  }, [])

  const hojeISO = toISODate(new Date())
  const limite30 = toISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const limite60 = toISODate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000))

  const itens = useMemo(() => {
    type Item = { id: string; tipo: "Evento" | "Conteúdo"; titulo: string; data: string }
    const list: Item[] = []
    for (const e of eventos) {
      if (e.data_evento >= hojeISO) {
        list.push({ id: e.id, tipo: "Evento", titulo: e.nome, data: e.data_evento })
      }
    }
    for (const c of conteudos) {
      if (c.data_esperada_publicacao && c.data_esperada_publicacao >= hojeISO) {
        list.push({ id: c.id, tipo: "Conteúdo", titulo: c.titulo, data: c.data_esperada_publicacao })
      }
    }
    return list.sort((a, b) => a.data.localeCompare(b.data))
  }, [eventos, conteudos, hojeISO])

  const proximos30 = itens.filter((i) => i.data <= limite30)
  const proximos60 = itens.filter((i) => i.data <= limite60)

  const porTipo = useMemo(
    () => [
      { label: "Eventos", value: proximos60.filter((i) => i.tipo === "Evento").length },
      { label: "Conteúdos", value: proximos60.filter((i) => i.tipo === "Conteúdo").length },
    ],
    [proximos60],
  )

  const rows = useMemo(
    () =>
      itens.slice(0, 60).map((i) => ({
        id: `${i.tipo}-${i.id}`,
        data_fmt: formatDateBR(i.data),
        tipo: i.tipo,
        titulo: i.titulo,
      })),
    [itens],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Itens nos Próximos 7 dias" value={itens.filter((i) => i.data <= toISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))).length} />
        <StatCard label="Itens nos Próximos 30 dias" value={proximos30.length} />
        <StatCard label="Itens nos Próximos 60 dias" value={proximos60.length} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-brand-navy-900">Eventos x Conteúdos (60 dias)</h3>
        <div className="mt-4">
          <BarChart data={porTipo} />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Próximos Compromissos</h3>
          <ExportButtons filename="agenda" title="Relatório de Agenda" columns={COLUNAS} rows={rows} />
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
                    Nada previsto.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-600">{r.data_fmt}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.tipo === "Evento" ? "bg-brand-blue-500/10 text-brand-blue-600" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.titulo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
