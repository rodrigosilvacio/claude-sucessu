import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Calendar,
  ClipboardList,
  MapPin,
  Users,
  HeartHandshake,
  Truck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { listAssociados } from "../lib/associados"
import { listVoluntarios } from "../lib/voluntarios"
import { listFornecedores } from "../lib/fornecedores"
import { listEventos } from "../lib/eventos"
import { listConteudos } from "../lib/conteudos"
import { listContasPagar, listContasReceber } from "../lib/financeiro"
import { STATUS_CONTEUDO } from "../types/conteudo"
import { STATUS_EVENTO } from "../types/evento"
import { formatCurrencyBRL, formatDateBR } from "../lib/format"
import { BarChart } from "../components/BarChart"
import type { Associado } from "../types/associado"
import type { VoluntarioComAssociado } from "../types/voluntario"
import type { Fornecedor } from "../types/fornecedor"
import type { EventoComRelacoes } from "../types/evento"
import type { ConteudoComRelacoes } from "../types/conteudo"
import type { ContaPagar, ContaReceber } from "../types/financeiro"

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string | number
  tone?: "default" | "green" | "red" | "amber"
}) {
  const toneClass = {
    default: "text-brand-navy-900 bg-brand-blue-500/10 text-brand-blue-600",
    green: "text-green-600 bg-green-100",
    red: "text-red-600 bg-red-100",
    amber: "text-amber-600 bg-amber-100",
  }[tone]

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClass}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-brand-navy-900">{value}</p>
    </div>
  )
}

export function Dashboard() {
  const [associados, setAssociados] = useState<Associado[]>([])
  const [voluntarios, setVoluntarios] = useState<VoluntarioComAssociado[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [eventos, setEventos] = useState<EventoComRelacoes[]>([])
  const [conteudos, setConteudos] = useState<ConteudoComRelacoes[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listAssociados(),
      listVoluntarios(),
      listFornecedores(),
      listEventos(),
      listConteudos(),
      listContasPagar(),
      listContasReceber(),
    ])
      .then(([a, v, f, e, c, cp, cr]) => {
        setAssociados(a)
        setVoluntarios(v)
        setFornecedores(f)
        setEventos(e)
        setConteudos(c)
        setContasPagar(cp)
        setContasReceber(cr)
      })
      .finally(() => setLoading(false))
  }, [])

  const hojeISO = toISODate(new Date())

  const totalPagarPendente = contasPagar
    .filter((c) => c.status === "Pendente")
    .reduce((s, c) => s + c.valor, 0)
  const totalReceberPendente = contasReceber
    .filter((c) => c.status === "Pendente")
    .reduce((s, c) => s + c.valor, 0)
  const saldoProjetado = totalReceberPendente - totalPagarPendente

  const associadosPorStatus = useMemo(() => {
    const ordem = ["Ativo", "Pendente de Aprovação", "Inativo", "Suspenso"]
    return ordem.map((status) => ({
      label: status,
      value: associados.filter((a) => a.status === status).length,
    }))
  }, [associados])

  const conteudosPorStatus = useMemo(
    () =>
      STATUS_CONTEUDO.map((status) => ({
        label: status,
        value: conteudos.filter((c) => c.status === status).length,
      })),
    [conteudos],
  )

  const eventosPorStatus = useMemo(
    () =>
      STATUS_EVENTO.map((status) => ({
        label: status,
        value: eventos.filter((e) => e.status === status).length,
      })),
    [eventos],
  )

  const voluntariosPorVp = useMemo(() => {
    const map = new Map<string, number>()
    for (const v of voluntarios) {
      const nome = v.sucesu_vice_presidencias?.nome ?? "Sem VP"
      map.set(nome, (map.get(nome) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  }, [voluntarios])

  const proximosEventos = useMemo(
    () =>
      eventos
        .filter((e) => e.data_evento >= hojeISO && e.status !== "Cancelado")
        .sort((a, b) => a.data_evento.localeCompare(b.data_evento))
        .slice(0, 7),
    [eventos, hojeISO],
  )

  const agendaSemana = useMemo(() => {
    const limite = toISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    type Item = { id: string; tipo: "evento" | "conteudo"; titulo: string; data: string; href: string }
    const items: Item[] = []

    for (const e of eventos) {
      if (e.data_evento >= hojeISO && e.data_evento <= limite) {
        items.push({
          id: e.id,
          tipo: "evento",
          titulo: e.nome,
          data: e.data_evento,
          href: `/eventos/${e.id}/editar`,
        })
      }
    }
    for (const c of conteudos) {
      if (
        c.data_esperada_publicacao &&
        c.data_esperada_publicacao >= hojeISO &&
        c.data_esperada_publicacao <= limite
      ) {
        items.push({
          id: c.id,
          tipo: "conteudo",
          titulo: c.titulo,
          data: c.data_esperada_publicacao,
          href: `/conteudos/${c.id}/editar`,
        })
      }
    }

    return items.sort((a, b) => a.data.localeCompare(b.data)).slice(0, 6)
  }, [eventos, conteudos, hojeISO])

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Dashboard Gerencial</h1>
          <p className="mt-1 text-slate-500">Visão executiva da associação</p>
        </div>
        <Link
          to="/relatorios"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Ver relatórios detalhados
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Users} label="Associados ativos" value={associados.filter((a) => a.status === "Ativo").length} />
        <KpiCard icon={HeartHandshake} label="Voluntários" value={voluntarios.length} />
        <KpiCard icon={Truck} label="Fornecedores ativos" value={fornecedores.filter((f) => f.status === "Ativo").length} />
        <KpiCard
          icon={saldoProjetado >= 0 ? TrendingUp : TrendingDown}
          label="Saldo Projetado (pendente)"
          value={formatCurrencyBRL(saldoProjetado)}
          tone={saldoProjetado >= 0 ? "green" : "red"}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy-900">
              <Wallet size={18} className="text-brand-blue-600" />
              Financeiro (pendente)
            </h2>
            <Link to="/financeiro" className="text-xs font-medium text-brand-blue-600 hover:underline">
              Ver Financeiro
            </Link>
          </div>
          <div className="mt-4">
            <BarChart
              data={[
                { label: "A Receber", value: totalReceberPendente, color: "bg-green-500" },
                { label: "A Pagar", value: totalPagarPendente, color: "bg-red-500" },
              ]}
            />
            <p className="mt-3 text-xs text-slate-400">
              Valores em R$, considerando apenas contas com status Pendente.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-navy-900">Eventos por Status</h2>
          <div className="mt-4">
            <BarChart data={eventosPorStatus} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-navy-900">Associados por Status</h2>
          <div className="mt-4">
            <BarChart data={associadosPorStatus} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-navy-900">Conteúdos por Status</h2>
          <div className="mt-4">
            <BarChart data={conteudosPorStatus} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy-900">
              <Calendar size={18} className="text-brand-blue-600" />
              Próximos Eventos
            </h2>
            <Link to="/eventos" className="text-xs font-medium text-brand-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {proximosEventos.length === 0 && (
              <p className="text-sm text-slate-400">Nenhum evento agendado.</p>
            )}
            {proximosEventos.map((e) => (
              <Link
                key={e.id}
                to={`/eventos/${e.id}/editar`}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-brand-navy-900">{e.nome}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={12} />
                    {e.modalidade}
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-blue-600">
                  {formatDateBR(e.data_evento)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy-900">
              <ClipboardList size={18} className="text-amber-500" />
              Agenda da Semana
            </h2>
            <Link to="/agenda" className="text-xs font-medium text-brand-blue-600 hover:underline">
              Ver agenda
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {agendaSemana.length === 0 && (
              <p className="text-sm text-slate-400">Nada previsto para os próximos 7 dias.</p>
            )}
            {agendaSemana.map((item) => (
              <Link
                key={`${item.tipo}-${item.id}`}
                to={item.href}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${item.tipo === "evento" ? "bg-brand-blue-500" : "bg-amber-500"}`}
                  />
                  <p className="text-sm font-medium text-brand-navy-900">{item.titulo}</p>
                </div>
                <span className="text-sm text-slate-500">{formatDateBR(item.data)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-brand-navy-900">
          <Users size={18} className="text-brand-blue-600" />
          Voluntários por Vice-Presidência
        </h2>
        <div className="mt-4">
          <BarChart data={voluntariosPorVp} />
        </div>
      </div>
    </div>
  )
}
