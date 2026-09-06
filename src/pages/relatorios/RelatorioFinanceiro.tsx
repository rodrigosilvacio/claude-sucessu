import { useEffect, useMemo, useState } from "react"
import { listContasPagar, listContasReceber } from "../../lib/financeiro"
import { listFornecedorOptions } from "../../lib/fornecedores"
import { listAssociadoOptions } from "../../lib/associados"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatCurrencyBRL, formatDateBR } from "../../lib/format"
import type { ContaPagar, ContaReceber } from "../../types/financeiro"
import type { FornecedorOption } from "../../types/fornecedor"
import type { AssociadoOption } from "../../types/associado"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS_PAGAR: ReportColumn[] = [
  { header: "Descrição", key: "descricao" },
  { header: "Fornecedor", key: "fornecedor_nome" },
  { header: "Vencimento", key: "data_vencimento_fmt" },
  { header: "Valor", key: "valor_fmt" },
  { header: "Status", key: "status" },
]

const COLUNAS_RECEBER: ReportColumn[] = [
  { header: "Descrição", key: "descricao" },
  { header: "Associado", key: "associado_nome" },
  { header: "Vencimento", key: "data_vencimento_fmt" },
  { header: "Valor", key: "valor_fmt" },
  { header: "Status", key: "status" },
]

export function RelatorioFinanceiro() {
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [associados, setAssociados] = useState<AssociadoOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listContasPagar(), listContasReceber(), listFornecedorOptions(), listAssociadoOptions()])
      .then(([cp, cr, forn, assoc]) => {
        setContasPagar(cp)
        setContasReceber(cr)
        setFornecedores(forn)
        setAssociados(assoc)
      })
      .finally(() => setLoading(false))
  }, [])

  const fornecedorNome = useMemo(() => {
    const map = new Map(fornecedores.map((f) => [f.id, f.razao_social]))
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—")
  }, [fornecedores])

  const associadoNome = useMemo(() => {
    const map = new Map(associados.map((a) => [a.id, a.nome_completo]))
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—")
  }, [associados])

  const totalPagarPendente = contasPagar
    .filter((c) => c.status === "Pendente")
    .reduce((s, c) => s + c.valor, 0)
  const totalPago = contasPagar.filter((c) => c.status === "Pago").reduce((s, c) => s + c.valor, 0)
  const totalReceberPendente = contasReceber
    .filter((c) => c.status === "Pendente")
    .reduce((s, c) => s + c.valor, 0)
  const totalRecebido = contasReceber
    .filter((c) => c.status === "Recebido")
    .reduce((s, c) => s + c.valor, 0)

  const saldoProjetado = totalReceberPendente + totalRecebido - (totalPagarPendente + totalPago)

  const porStatusPagar = useMemo(
    () => [
      { label: "Pendente", value: contasPagar.filter((c) => c.status === "Pendente").length },
      { label: "Pago", value: contasPagar.filter((c) => c.status === "Pago").length },
      { label: "Cancelado", value: contasPagar.filter((c) => c.status === "Cancelado").length },
    ],
    [contasPagar],
  )

  const porStatusReceber = useMemo(
    () => [
      { label: "Pendente", value: contasReceber.filter((c) => c.status === "Pendente").length },
      { label: "Recebido", value: contasReceber.filter((c) => c.status === "Recebido").length },
      { label: "Cancelado", value: contasReceber.filter((c) => c.status === "Cancelado").length },
    ],
    [contasReceber],
  )

  const rowsPagar = useMemo(
    () =>
      contasPagar.map((c) => ({
        ...c,
        fornecedor_nome: fornecedorNome(c.fornecedor_id),
        data_vencimento_fmt: formatDateBR(c.data_vencimento),
        valor_fmt: formatCurrencyBRL(c.valor),
      })),
    [contasPagar, fornecedorNome],
  )

  const rowsReceber = useMemo(
    () =>
      contasReceber.map((c) => ({
        ...c,
        associado_nome: associadoNome(c.associado_id),
        data_vencimento_fmt: formatDateBR(c.data_vencimento),
        valor_fmt: formatCurrencyBRL(c.valor),
      })),
    [contasReceber, associadoNome],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="A Pagar (pendente)" value={formatCurrencyBRL(totalPagarPendente)} tone="red" />
        <StatCard label="A Receber (pendente)" value={formatCurrencyBRL(totalReceberPendente)} tone="amber" />
        <StatCard label="Pago (histórico)" value={formatCurrencyBRL(totalPago)} />
        <StatCard label="Recebido (histórico)" value={formatCurrencyBRL(totalRecebido)} tone="green" />
        <StatCard
          label="Saldo Projetado"
          value={formatCurrencyBRL(saldoProjetado)}
          tone={saldoProjetado >= 0 ? "green" : "red"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Contas a Pagar por Status</h3>
          <div className="mt-4">
            <BarChart data={porStatusPagar} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold text-brand-navy-900">Contas a Receber por Status</h3>
          <div className="mt-4">
            <BarChart data={porStatusReceber} />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Contas a Pagar</h3>
          <ExportButtons
            filename="contas_a_pagar"
            title="Relatório de Contas a Pagar"
            columns={COLUNAS_PAGAR}
            rows={rowsPagar}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {COLUNAS_PAGAR.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-medium">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsPagar.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS_PAGAR.length} className="px-4 py-5 text-sm text-slate-400">
                    Nenhuma conta a pagar cadastrada.
                  </td>
                </tr>
              )}
              {rowsPagar.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{r.fornecedor_nome}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_vencimento_fmt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.valor_fmt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Contas a Receber</h3>
          <ExportButtons
            filename="contas_a_receber"
            title="Relatório de Contas a Receber"
            columns={COLUNAS_RECEBER}
            rows={rowsReceber}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {COLUNAS_RECEBER.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-medium">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsReceber.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS_RECEBER.length} className="px-4 py-5 text-sm text-slate-400">
                    Nenhuma conta a receber cadastrada.
                  </td>
                </tr>
              )}
              {rowsReceber.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{r.associado_nome}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_vencimento_fmt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.valor_fmt}</td>
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
