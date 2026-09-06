import { Fragment, useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { listAuditLog, TABELAS_AUDITADAS, OPERACOES_AUDITORIA } from "../lib/auditoria"
import type { AuditLog } from "../types/auditLog"

const operacaoColors: Record<string, string> = {
  INSERT: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
}

const nomesAmigaveis: Record<string, string> = {
  sucesu_associados: "Associados",
  sucesu_voluntarios: "Voluntários",
  sucesu_eventos: "Eventos",
  sucesu_fornecedores: "Fornecedores",
  sucesu_conteudos: "Conteúdos",
  sucesu_associacoes: "Associação",
  sucesu_produtos_servicos: "Produtos e Serviços",
  sucesu_formularios: "Formulários",
  sucesu_contas_pagar: "Contas a Pagar",
  sucesu_contas_receber: "Contas a Receber",
  sucesu_documentos: "Documentos",
}

export function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabelaFilter, setTabelaFilter] = useState("")
  const [operacaoFilter, setOperacaoFilter] = useState("")
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    listAuditLog({ tabela: tabelaFilter || undefined, operacao: operacaoFilter || undefined })
      .then(setLogs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tabelaFilter, operacaoFilter])

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">Auditoria</h1>
      <p className="mt-1 text-slate-500">
        Histórico de alterações no sistema (últimos 200 registros)
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={tabelaFilter}
          onChange={(e) => setTabelaFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todos os cadastros</option>
          {TABELAS_AUDITADAS.map((t) => (
            <option key={t} value={t}>
              {nomesAmigaveis[t] ?? t}
            </option>
          ))}
        </select>
        <select
          value={operacaoFilter}
          onChange={(e) => setOperacaoFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todas as operações</option>
          {OPERACOES_AUDITORIA.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {error && <p className="p-5 text-sm text-red-600">{error}</p>}
        {!error && loading && <p className="p-5 text-sm text-slate-400">Carregando...</p>}
        {!error && !loading && logs.length === 0 && (
          <p className="p-5 text-sm text-slate-400">Nenhum registro encontrado.</p>
        )}

        {!error && !loading && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
                <th className="px-4 py-3 font-medium">Operação</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setExpandido(expandido === log.id ? null : log.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandido === log.id}
                    aria-label={`Ver detalhes do registro de auditoria de ${nomesAmigaveis[log.tabela] ?? log.tabela}`}
                    className="cursor-pointer border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(log.criado_em).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-navy-900">
                      {nomesAmigaveis[log.tabela] ?? log.tabela}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          operacaoColors[log.operacao] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {log.operacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {log.usuario_id ? log.usuario_id.slice(0, 8) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {expandido === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expandido === log.id && (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {log.dados_antigos && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-slate-400">Antes</p>
                              <pre className="mt-1 max-h-64 overflow-auto rounded bg-white p-2 text-xs text-slate-600">
                                {JSON.stringify(log.dados_antigos, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.dados_novos && (
                            <div>
                              <p className="text-xs font-semibold uppercase text-slate-400">Depois</p>
                              <pre className="mt-1 max-h-64 overflow-auto rounded bg-white p-2 text-xs text-slate-600">
                                {JSON.stringify(log.dados_novos, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
