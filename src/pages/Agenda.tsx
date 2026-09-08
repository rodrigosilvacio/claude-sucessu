import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Check, ChevronLeft, ChevronRight, Copy } from "lucide-react"
import { listEventos } from "../lib/eventos"
import { listConteudos } from "../lib/conteudos"
import type { EventoComRelacoes } from "../types/evento"
import type { ConteudoComRelacoes } from "../types/conteudo"

type AgendaItem = {
  id: string
  tipo: "evento" | "conteudo"
  titulo: string
  data: string
  href: string
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function Agenda() {
  const navigate = useNavigate()
  const [mesAtual, setMesAtual] = useState(() => startOfMonth(new Date()))
  const [eventos, setEventos] = useState<EventoComRelacoes[]>([])
  const [conteudos, setConteudos] = useState<ConteudoComRelacoes[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const linkAgendaPublica = `${window.location.origin}/agenda-publica`

  function handleCopyAgendaLink() {
    navigator.clipboard.writeText(linkAgendaPublica)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    Promise.all([listEventos(), listConteudos()])
      .then(([e, c]) => {
        setEventos(e)
        setConteudos(c)
      })
      .finally(() => setLoading(false))
  }, [])

  const itemsPorDia = useMemo(() => {
    const map = new Map<string, AgendaItem[]>()

    for (const evento of eventos) {
      const lista = map.get(evento.data_evento) ?? []
      lista.push({
        id: evento.id,
        tipo: "evento",
        titulo: evento.nome,
        data: evento.data_evento,
        href: `/eventos/${evento.id}/editar`,
      })
      map.set(evento.data_evento, lista)
    }

    for (const conteudo of conteudos) {
      if (!conteudo.data_esperada_publicacao) continue
      const lista = map.get(conteudo.data_esperada_publicacao) ?? []
      lista.push({
        id: conteudo.id,
        tipo: "conteudo",
        titulo: conteudo.titulo,
        data: conteudo.data_esperada_publicacao,
        href: `/conteudos/${conteudo.id}/editar`,
      })
      map.set(conteudo.data_esperada_publicacao, lista)
    }

    return map
  }, [eventos, conteudos])

  const semanas = useMemo(() => {
    const primeiroDia = startOfMonth(mesAtual)
    const inicioGrid = new Date(primeiroDia)
    inicioGrid.setDate(inicioGrid.getDate() - primeiroDia.getDay())

    const dias: Date[] = []
    const cursor = new Date(inicioGrid)
    for (let i = 0; i < 42; i++) {
      dias.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    const grupos: Date[][] = []
    for (let i = 0; i < dias.length; i += 7) {
      grupos.push(dias.slice(i, i + 7))
    }
    return grupos
  }, [mesAtual])

  const hojeISO = toISODate(new Date())

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Agenda</h1>
          <p className="mt-1 text-slate-500">Eventos e prazos de conteúdo da associação</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/agenda-publica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <Calendar size={18} />
            Ver Agenda Pública
          </a>
          <button
            type="button"
            onClick={handleCopyAgendaLink}
            title="Copiar link da agenda pública"
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          </button>
          <button
            onClick={() => setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            aria-label="Mês anterior"
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="w-40 text-center text-sm font-semibold text-brand-navy-900">
            {mesAtual.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setMesAtual((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            aria-label="Próximo mês"
            className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setMesAtual(startOfMonth(new Date()))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-blue-500" /> Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Prazo de Conteúdo
        </span>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          {semanas.map((semana, i) => (
            <div key={i} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
              {semana.map((dia) => {
                const iso = toISODate(dia)
                const items = itemsPorDia.get(iso) ?? []
                const foraDoMes = dia.getMonth() !== mesAtual.getMonth()
                const ehHoje = iso === hojeISO
                return (
                  <div
                    key={iso}
                    className={`min-h-[90px] border-r border-slate-100 p-1.5 last:border-0 ${
                      foraDoMes ? "bg-slate-50" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        ehHoje
                          ? "bg-brand-blue-600 font-semibold text-white"
                          : foraDoMes
                            ? "text-slate-300"
                            : "text-slate-600"
                      }`}
                    >
                      {dia.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {items.slice(0, 3).map((item) => (
                        <button
                          key={`${item.tipo}-${item.id}`}
                          onClick={() => navigate(item.href)}
                          className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white ${
                            item.tipo === "evento" ? "bg-brand-blue-500" : "bg-amber-500"
                          }`}
                          title={item.titulo}
                        >
                          {item.titulo}
                        </button>
                      ))}
                      {items.length > 3 && (
                        <span className="block text-[11px] text-slate-400">
                          +{items.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
