import { useEffect, useMemo, useState } from "react"
import { listVoluntarios } from "../../lib/voluntarios"
import { StatCard } from "../../components/StatCard"
import { BarChart } from "../../components/BarChart"
import { ExportButtons } from "../../components/ExportButtons"
import { formatDateBR } from "../../lib/format"
import type { VoluntarioComAssociado } from "../../types/voluntario"
import type { ReportColumn } from "../../lib/reportExport"

const COLUNAS: ReportColumn[] = [
  { header: "Nome", key: "nome_completo" },
  { header: "Nº Associado", key: "numero_associado" },
  { header: "Vice-Presidência", key: "vp_nome" },
  { header: "Data de Início", key: "data_inicio_fmt" },
  { header: "Preferência de Contato", key: "preferencia_contato" },
  { header: "Situação", key: "situacao" },
]

export function RelatorioVoluntarios() {
  const [voluntarios, setVoluntarios] = useState<VoluntarioComAssociado[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listVoluntarios()
      .then(setVoluntarios)
      .finally(() => setLoading(false))
  }, [])

  const hojeISO = new Date().toISOString().slice(0, 10)
  const ativos = voluntarios.filter((v) => !v.data_termino || v.data_termino >= hojeISO)

  const porVp = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of voluntarios) {
      const nome = v.sucesu_vice_presidencias?.nome ?? "Sem VP"
      map.set(nome, (map.get(nome) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  }, [voluntarios])

  const rows = useMemo(
    () =>
      voluntarios.map((v) => ({
        id: v.id,
        nome_completo: v.sucesu_associados?.nome_completo ?? "—",
        numero_associado: v.sucesu_associados?.numero_associado ?? "—",
        vp_nome: v.sucesu_vice_presidencias?.nome ?? "—",
        data_inicio_fmt: formatDateBR(v.data_inicio),
        preferencia_contato: v.preferencia_contato,
        situacao: !v.data_termino || v.data_termino >= hojeISO ? "Ativo" : "Encerrado",
      })),
    [voluntarios, hojeISO],
  )

  if (loading) return <p className="text-sm text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total de Voluntários" value={voluntarios.length} />
        <StatCard label="Ativos" value={ativos.length} tone="green" />
        <StatCard label="Vice-Presidências com Voluntários" value={porVp.length} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-brand-navy-900">Por Vice-Presidência</h3>
        <div className="mt-4">
          <BarChart data={porVp} />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 className="text-base font-semibold text-brand-navy-900">Listagem de Voluntários</h3>
          <ExportButtons filename="voluntarios" title="Relatório de Voluntários" columns={COLUNAS} rows={rows} />
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
                    Nenhum voluntário cadastrado.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-brand-navy-900">{r.nome_completo}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.numero_associado}</td>
                  <td className="px-4 py-3 text-slate-600">{r.vp_nome}</td>
                  <td className="px-4 py-3 text-slate-600">{r.data_inicio_fmt}</td>
                  <td className="px-4 py-3 text-slate-600">{r.preferencia_contato}</td>
                  <td className="px-4 py-3 text-slate-600">{r.situacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
