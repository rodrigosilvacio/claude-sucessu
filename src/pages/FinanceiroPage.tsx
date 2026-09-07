import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Plus, Search, X } from "lucide-react"
import { listContasPagar, listContasReceber } from "../lib/financeiro"
import { listFornecedorOptions } from "../lib/fornecedores"
import { listAssociadoOptions } from "../lib/associados"
import { formatCurrencyBRL, formatDateBR } from "../lib/format"
import { STATUS_CONTA_PAGAR, STATUS_CONTA_RECEBER } from "../constants/cadastro-options"
import { Pagination } from "../components/Pagination"
import type { ContaPagar, ContaReceber } from "../types/financeiro"
import type { FornecedorOption } from "../types/fornecedor"
import type { AssociadoOption } from "../types/associado"

const statusColors: Record<string, string> = {
  Pendente: "bg-amber-100 text-amber-700",
  Pago: "bg-green-100 text-green-700",
  Recebido: "bg-green-100 text-green-700",
  Cancelado: "bg-slate-100 text-slate-600",
}

const PAGE_SIZE = 15

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

  const [searchPagar, setSearchPagar] = useState("")
  const [statusPagar, setStatusPagar] = useState("")
  const [fornecedorFiltro, setFornecedorFiltro] = useState("")
  const [vencimentoDePagar, setVencimentoDePagar] = useState("")
  const [vencimentoAtePagar, setVencimentoAtePagar] = useState("")
  const [pagePagar, setPagePagar] = useState(1)

  const [searchReceber, setSearchReceber] = useState("")
  const [statusReceber, setStatusReceber] = useState("")
  const [associadoFiltro, setAssociadoFiltro] = useState("")
  const [vencimentoDeReceber, setVencimentoDeReceber] = useState("")
  const [vencimentoAteReceber, setVencimentoAteReceber] = useState("")
  const [pageReceber, setPageReceber] = useState(1)

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

  const filteredPagar = useMemo(() => {
    const term = searchPagar.trim().toLowerCase()
    return contasPagar.filter((c) => {
      const matchesTerm =
        !term ||
        c.descricao.toLowerCase().includes(term) ||
        fornecedorNome(c.fornecedor_id).toLowerCase().includes(term)
      const matchesStatus = !statusPagar || c.status === statusPagar
      const matchesFornecedor = !fornecedorFiltro || c.fornecedor_id === fornecedorFiltro
      const matchesDe = !vencimentoDePagar || c.data_vencimento >= vencimentoDePagar
      const matchesAte = !vencimentoAtePagar || c.data_vencimento <= vencimentoAtePagar
      return matchesTerm && matchesStatus && matchesFornecedor && matchesDe && matchesAte
    })
  }, [
    contasPagar,
    searchPagar,
    statusPagar,
    fornecedorFiltro,
    vencimentoDePagar,
    vencimentoAtePagar,
    fornecedorNome,
  ])

  const filteredReceber = useMemo(() => {
    const term = searchReceber.trim().toLowerCase()
    return contasReceber.filter((c) => {
      const matchesTerm =
        !term ||
        c.descricao.toLowerCase().includes(term) ||
        associadoNome(c.associado_id).toLowerCase().includes(term)
      const matchesStatus = !statusReceber || c.status === statusReceber
      const matchesAssociado = !associadoFiltro || c.associado_id === associadoFiltro
      const matchesDe = !vencimentoDeReceber || c.data_vencimento >= vencimentoDeReceber
      const matchesAte = !vencimentoAteReceber || c.data_vencimento <= vencimentoAteReceber
      return matchesTerm && matchesStatus && matchesAssociado && matchesDe && matchesAte
    })
  }, [
    contasReceber,
    searchReceber,
    statusReceber,
    associadoFiltro,
    vencimentoDeReceber,
    vencimentoAteReceber,
    associadoNome,
  ])

  const paginatedPagar = filteredPagar.slice((pagePagar - 1) * PAGE_SIZE, pagePagar * PAGE_SIZE)
  const paginatedReceber = filteredReceber.slice(
    (pageReceber - 1) * PAGE_SIZE,
    pageReceber * PAGE_SIZE,
  )

  const filtrosPagarAtivos =
    searchPagar || statusPagar || fornecedorFiltro || vencimentoDePagar || vencimentoAtePagar
  const filtrosReceberAtivos =
    searchReceber || statusReceber || associadoFiltro || vencimentoDeReceber || vencimentoAteReceber

  function limparFiltrosPagar() {
    setSearchPagar("")
    setStatusPagar("")
    setFornecedorFiltro("")
    setVencimentoDePagar("")
    setVencimentoAtePagar("")
    setPagePagar(1)
  }

  function limparFiltrosReceber() {
    setSearchReceber("")
    setStatusReceber("")
    setAssociadoFiltro("")
    setVencimentoDeReceber("")
    setVencimentoAteReceber("")
    setPageReceber(1)
  }

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

      {tab === "pagar" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchPagar}
              onChange={(e) => {
                setSearchPagar(e.target.value)
                setPagePagar(1)
              }}
              placeholder="Pesquisar por descrição ou fornecedor..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusPagar}
            onChange={(e) => {
              setStatusPagar(e.target.value)
              setPagePagar(1)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            {STATUS_CONTA_PAGAR.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={fornecedorFiltro}
            onChange={(e) => {
              setFornecedorFiltro(e.target.value)
              setPagePagar(1)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          >
            <option value="">Todos os fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.razao_social}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Vencimento</span>
            <input
              type="date"
              value={vencimentoDePagar}
              onChange={(e) => {
                setVencimentoDePagar(e.target.value)
                setPagePagar(1)
              }}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
            <span>até</span>
            <input
              type="date"
              value={vencimentoAtePagar}
              onChange={(e) => {
                setVencimentoAtePagar(e.target.value)
                setPagePagar(1)
              }}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>
          {filtrosPagarAtivos && (
            <button
              onClick={limparFiltrosPagar}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-blue-600"
            >
              <X size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {tab === "receber" && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchReceber}
              onChange={(e) => {
                setSearchReceber(e.target.value)
                setPageReceber(1)
              }}
              placeholder="Pesquisar por descrição ou associado..."
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={statusReceber}
            onChange={(e) => {
              setStatusReceber(e.target.value)
              setPageReceber(1)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            {STATUS_CONTA_RECEBER.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={associadoFiltro}
            onChange={(e) => {
              setAssociadoFiltro(e.target.value)
              setPageReceber(1)
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
          >
            <option value="">Todos os associados</option>
            {associados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome_completo}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span>Vencimento</span>
            <input
              type="date"
              value={vencimentoDeReceber}
              onChange={(e) => {
                setVencimentoDeReceber(e.target.value)
                setPageReceber(1)
              }}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
            <span>até</span>
            <input
              type="date"
              value={vencimentoAteReceber}
              onChange={(e) => {
                setVencimentoAteReceber(e.target.value)
                setPageReceber(1)
              }}
              className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
            />
          </div>
          {filtrosReceberAtivos && (
            <button
              onClick={limparFiltrosReceber}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-blue-600"
            >
              <X size={14} />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}
        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}

        {!error && !loading && tab === "pagar" && (
          <>
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
                  {filteredPagar.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-5 text-sm text-slate-400">
                        {contasPagar.length === 0
                          ? "Nenhuma conta a pagar cadastrada."
                          : "Nenhuma conta encontrada para os filtros selecionados."}
                      </td>
                    </tr>
                  )}
                  {paginatedPagar.map((c) => (
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
            <Pagination
              page={pagePagar}
              pageSize={PAGE_SIZE}
              totalItems={filteredPagar.length}
              onPageChange={setPagePagar}
            />
          </>
        )}

        {!error && !loading && tab === "receber" && (
          <>
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
                  {filteredReceber.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-5 text-sm text-slate-400">
                        {contasReceber.length === 0
                          ? "Nenhuma conta a receber cadastrada."
                          : "Nenhuma conta encontrada para os filtros selecionados."}
                      </td>
                    </tr>
                  )}
                  {paginatedReceber.map((c) => (
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
            <Pagination
              page={pageReceber}
              pageSize={PAGE_SIZE}
              totalItems={filteredReceber.length}
              onPageChange={setPageReceber}
            />
          </>
        )}
      </div>
    </div>
  )
}
