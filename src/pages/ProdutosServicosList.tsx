import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { listProdutosServicos } from "../lib/produtosServicos"
import { TIPOS_PRODUTO_SERVICO } from "../constants/cadastro-options"
import type { ProdutoServicoComFornecedor } from "../types/produtoServico"

function formatCurrency(value: number | null) {
  if (value === null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProdutosServicosList() {
  const navigate = useNavigate()
  const [itens, setItens] = useState<ProdutoServicoComFornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [tipoFilter, setTipoFilter] = useState("")

  useEffect(() => {
    listProdutosServicos()
      .then(setItens)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return itens.filter((item) => {
      const matchesTerm =
        !term ||
        item.nome.toLowerCase().includes(term) ||
        item.categoria?.toLowerCase().includes(term)
      const matchesTipo = !tipoFilter || item.tipo === tipoFilter
      return matchesTerm && matchesTipo
    })
  }, [itens, search, tipoFilter])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Produtos e Serviços</h1>
          <p className="mt-1 text-slate-500">Catálogo de produtos e serviços usados pela associação</p>
        </div>
        <Link
          to="/produtos-servicos/novo"
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          Novo Item
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou categoria..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          {TIPOS_PRODUTO_SERVICO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}

        {!error && !loading && filtered.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum item encontrado.</p>
        )}

        {!error && !loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Fornecedor</th>
                <th className="px-4 py-3 font-medium">Custo</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/produtos-servicos/${item.id}/editar`)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{item.nome}</td>
                  <td className="px-4 py-3 text-slate-600">{item.tipo}</td>
                  <td className="px-4 py-3 text-slate-600">{item.categoria || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.sucesu_fornecedores?.nome_fantasia ||
                      item.sucesu_fornecedores?.razao_social ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(item.custo)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        item.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.ativo ? "Ativo" : "Inativo"}
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
