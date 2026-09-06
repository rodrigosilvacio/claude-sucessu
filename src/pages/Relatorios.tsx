import { useSearchParams } from "react-router-dom"
import { RelatorioAssociados } from "./relatorios/RelatorioAssociados"
import { RelatorioVoluntarios } from "./relatorios/RelatorioVoluntarios"
import { RelatorioFornecedores } from "./relatorios/RelatorioFornecedores"
import { RelatorioFinanceiro } from "./relatorios/RelatorioFinanceiro"
import { RelatorioConteudos } from "./relatorios/RelatorioConteudos"
import { RelatorioEventos } from "./relatorios/RelatorioEventos"
import { RelatorioAgenda } from "./relatorios/RelatorioAgenda"

const TABS = [
  { key: "associados", label: "Associados", Component: RelatorioAssociados },
  { key: "voluntarios", label: "Voluntários", Component: RelatorioVoluntarios },
  { key: "fornecedores", label: "Fornecedores", Component: RelatorioFornecedores },
  { key: "financeiro", label: "Financeiro", Component: RelatorioFinanceiro },
  { key: "conteudos", label: "Conteúdos", Component: RelatorioConteudos },
  { key: "eventos", label: "Eventos", Component: RelatorioEventos },
  { key: "agenda", label: "Agenda", Component: RelatorioAgenda },
] as const

export function Relatorios() {
  const [searchParams, setSearchParams] = useSearchParams()
  const abaAtual = searchParams.get("aba") ?? "associados"
  const tab = TABS.find((t) => t.key === abaAtual) ?? TABS[0]
  const Ativo = tab.Component

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">Relatórios</h1>
      <p className="mt-1 text-slate-500">
        Visão executiva por área, com listagem completa e exportação em Excel ou PDF
      </p>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSearchParams({ aba: t.key })}
            className={`shrink-0 px-4 py-2 text-sm font-medium ${
              tab.key === t.key
                ? "border-b-2 border-brand-blue-600 text-brand-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Ativo />
      </div>
    </div>
  )
}
