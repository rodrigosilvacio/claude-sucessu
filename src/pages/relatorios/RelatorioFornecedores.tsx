import { useEffect, useMemo, useState } from "react"
import { listFornecedores } from "../../lib/fornecedores"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatCNPJ } from "../../lib/format"
import type { Fornecedor } from "../../types/fornecedor"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS: ReportColumn[] = [
  { header: "Razão Social", key: "razao_social" },
  { header: "Nome Fantasia", key: "nome_fantasia" },
  { header: "CNPJ", key: "cnpj_fmt" },
  { header: "Ramo de Atividade", key: "ramo_atividade" },
  { header: "Status", key: "status" },
  { header: "Telefone", key: "telefone" },
  { header: "E-mail", key: "email" },
]

export function RelatorioFornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listFornecedores()
      .then(setFornecedores)
      .finally(() => setLoading(false))
  }, [])

  const porStatus = useMemo(
    () => [
      { label: "Ativo", value: fornecedores.filter((f) => f.status === "Ativo").length },
      { label: "Inativo", value: fornecedores.filter((f) => f.status === "Inativo").length },
    ],
    [fornecedores],
  )

  const porRamo = useMemo(() => {
    const map = new Map<string, number>()
    for (const f of fornecedores) {
      const ramo = f.ramo_atividade ?? "Não informado"
      map.set(ramo, (map.get(ramo) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }))
  }, [fornecedores])

  const rows = useMemo(
    () =>
      fornecedores.map((f) => ({
        ...f,
        cnpj_fmt: f.cnpj ? formatCNPJ(f.cnpj) : "—",
        nome_fantasia: f.nome_fantasia ?? "—",
        ramo_atividade: f.ramo_atividade ?? "—",
      })),
    [fornecedores],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total de Fornecedores" value={fornecedores.length} />
        <StatCard label="Ativos" value={fornecedores.filter((f) => f.status === "Ativo").length} tone="green" />
        <StatCard label="Ramos de Atividade" value={porRamo.length} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Por Status</h3>
          <div className="mt-4">
            <BarChart data={porStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Principais Ramos de Atividade</h3>
          <div className="mt-4">
            <BarChart data={porRamo} />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Listagem de Fornecedores</h3>
          <ExportButtons filename="fornecedores" title="Relatório de Fornecedores" columns={COLUNAS} rows={rows} />
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
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.razao_social}</td>
                  <td className="px-4 py-3 text-slate-600">{r.nome_fantasia}</td>
                  <td className="px-4 py-3 text-slate-600">{r.cnpj_fmt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.ramo_atividade}</td>
                  <td className="px-4 py-3 text-slate-600">{r.status}</td>
                  <td className="px-4 py-3 text-slate-600">{r.telefone ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
