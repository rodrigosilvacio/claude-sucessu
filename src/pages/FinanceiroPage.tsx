import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Plus } from "lucide-react"
import { listContasPagar, listContasReceber } from "../lib/financeiro"
import { listFornecedorOptions } from "../lib/fornecedores"
import { listAssociadoOptions } from "../lib/associados"
import { formatCurrencyBRL, formatDateBR } from "../lib/format"
import type { ContaPagar, ContaReceber } from "../types/financeiro"
import type { FornecedorOption } from "../types/fornecedor"
import type { AssociadoOption } from "../types/associado"

const statusColors: Record<string, string> = {
  Pendente: "bg-amber-100 text-amber-700",
  Pago: "bg-green-100 text-green-700",
  Recebido: "bg-green-100 text-green-700",
  Cancelado: "bg-slate-100 text-slate-600",
}

export function FinanceiroPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get("aba") === "receber" ? "receber" : "pagar"

  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([])
  const [associados, setAssociados] = useState<AssociadoOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listContasPagar(),
      listContasReceber(),
      listFornecedorOptions(),
      listAssociadoOptions(),
    ])
      .then(([pagar, receber, forn, assoc]) => {
        setContasPagar(pagar)
        setContasReceber(receber)
        setFornecedores(forn)
        setAssociados(assoc)
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar."))
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
    .reduce((sum, c) => sum + c.valor, 0)
  const totalReceberPendente = contasReceber
    .filter((c) => c.status === "Pendente")
    .reduce((sum, c) => sum + c.valor, 0)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Financeiro</h1>
          <p className="mt-1 text-slate-500">Contas a pagar e a receber da associação</p>
        </div>
        <Link
          to={tab === "pagar" ? "/financeiro/pagar/novo" : "/financeiro/receber/novo"}
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          {tab === "pagar" ? "Nova Conta a Pagar" : "Nova Conta a Receber"}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total a Pagar (pendente)</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrencyBRL(totalPagarPendente)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total a Receber (pendente)</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {formatCurrencyBRL(totalReceberPendente)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        <button
          onClick={() => setSearchParams({ aba: "pagar" })}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "pagar"
              ? "border-b-2 border-brand-blue-600 text-brand-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Contas a Pagar
        </button>
        <button
          onClick={() => setSearchParams({ aba: "receber" })}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "receber"
              ? "border-b-2 border-brand-blue-600 text-brand-blue-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Contas a Receber
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}
        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}

        {!error && !loading && tab === "pagar" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contasPagar.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm text-slate-400">
                    Nenhuma conta a pagar cadastrada.
                  </td>
                </tr>
              )}
              {contasPagar.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/financeiro/pagar/${c.id}/editar`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{c.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{fornecedorNome(c.fornecedor_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateBR(c.data_vencimento)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrencyBRL(c.valor)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[c.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        {!error && !loading && tab === "receber" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Associado</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contasReceber.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-sm text-slate-400">
                    Nenhuma conta a receber cadastrada.
                  </td>
                </tr>
              )}
              {contasReceber.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/financeiro/receber/${c.id}/editar`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{c.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{associadoNome(c.associado_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateBR(c.data_vencimento)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrencyBRL(c.valor)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        statusColors[c.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {c.status}
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
