import { useEffect, useMemo, useState } from "react"
import { listAssociados } from "../../lib/associados"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatDateBR } from "../../lib/format"
import type { Associado } from "../../types/associado"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS: ReportColumn[] = [
  { header: "Nº", key: "numero_associado" },
  { header: "Nome", key: "nome_completo" },
  { header: "Tipo", key: "tipo_pessoa" },
  { header: "Categoria", key: "categoria_associado" },
  { header: "Status", key: "status" },
  { header: "Cidade/UF", key: "cidade_uf" },
  { header: "Data de Entrada", key: "data_entrada_fmt" },
]

export function RelatorioAssociados() {
  const [associados, setAssociados] = useState<Associado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAssociados()
      .then(setAssociados)
      .finally(() => setLoading(false))
  }, [])

  const porStatus = useMemo(() => {
    const ordem = ["Ativo", "Pendente de Aprovação", "Inativo", "Suspenso"]
    return ordem.map((status) => ({
      label: status,
      value: associados.filter((a) => a.status === status).length,
    }))
  }, [associados])

  const porCategoria = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of associados) {
      const cat = a.categoria_associado ?? "Sem categoria"
      map.set(cat, (map.get(cat) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  }, [associados])

  const rows = useMemo(
    () =>
      associados.map((a) => ({
        ...a,
        cidade_uf: [a.cidade, a.estado].filter(Boolean).join("/") || "—",
        data_entrada_fmt: formatDateBR(a.data_entrada),
      })),
    [associados],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  const pf = associados.filter((a) => a.tipo_pessoa === "Pessoa Física").length
  const pj = associados.filter((a) => a.tipo_pessoa === "Pessoa Jurídica").length

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total de Associados" value={associados.length} />
        <StatCard label="Ativos" value={associados.filter((a) => a.status === "Ativo").length} tone="green" />
        <StatCard
          label="Pendentes"
          value={associados.filter((a) => a.status === "Pendente de Aprovação").length}
          tone="amber"
        />
        <StatCard label="Pessoa Física" value={pf} />
        <StatCard label="Pessoa Jurídica" value={pj} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Status</h3>
          <div className="mt-4">
            <BarChart data={porStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Categoria</h3>
          <div className="mt-4">
            <BarChart data={porCategoria} />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Listagem de Associados</h3>
          <ExportButtons filename="associados" title="Relatório de Associados" columns={COLUNAS} rows={rows} />
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
                    Nenhum associado cadastrado.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.numero_associado}</td>
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.nome_completo}</td>
                  <td className="px-4 py-3 text-slate-600">{r.tipo_pessoa}</td>
                  <td className="px-4 py-3 text-slate-600">{r.categoria_associado ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.status}</td>
                  <td className="px-4 py-3 text-slate-600">{r.cidade_uf}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_entrada_fmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
