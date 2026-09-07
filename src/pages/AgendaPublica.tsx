import { useEffect, useState } from "react"
import { Calendar, Clock, ExternalLink, MapPin, Users } from "lucide-react"
import { Logo } from "../components/Logo"
import { listEventosPublicos } from "../lib/eventos"
import type { EventoPublicoResumo } from "../types/evento"

const MESES = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
]

function formatCurrency(value: number | null) {
  if (!value) return "Gratuito"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function DateBadge({ iso }: { iso: string }) {
  const date = new Date(`${iso}T00:00:00`)
  return (
    <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-navy-900 py-2 text-white">
      <span className="text-xs font-semibold tracking-wide text-brand-blue-300">
        {MESES[date.getMonth()]}
      </span>
      <span className="text-2xl font-bold leading-tight">{date.getDate()}</span>
    </div>
  )
}

export function AgendaPublica() {
  const [eventos, setEventos] = useState<EventoPublicoResumo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listEventosPublicos()
      .then(setEventos)
      .catch(() => setError("Não foi possível carregar a agenda."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="text-2xl font-bold text-brand-navy-900">Agenda de Eventos</h1>
          <p className="text-slate-500">Confira e inscreva-se nos próximos eventos da SUCESU SP</p>
        </div>

        <div className="mt-8 space-y-4">
          {loading && <p className="text-center text-sm text-slate-400">Carregando agenda...</p>}

          {!loading && error && <p className="text-center text-sm text-red-600">{error}</p>}

          {!loading && !error && eventos.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <Calendar size={32} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                Nenhum evento programado no momento. Volte em breve!
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            eventos.map((evento) => {
              const vagasEsgotadas =
                evento.vagas_limite !== null && evento.vagas_ocupadas >= evento.vagas_limite

              return (
                <div
                  key={evento.id}
                  className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <DateBadge iso={evento.data_evento} />

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-brand-navy-900">{evento.nome}</h2>
                    {evento.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{evento.descricao}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600">
                      {evento.hora_inicio && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-brand-blue-600" />
                          {evento.hora_inicio.slice(0, 5)}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-brand-blue-600" />
                        {evento.local_ou_link
                          ? `${evento.modalidade} — ${evento.local_ou_link}`
                          : evento.modalidade}
                      </span>
                      {evento.vagas_limite && (
                        <span className="flex items-center gap-1.5">
                          <Users size={14} className="text-brand-blue-600" />
                          {evento.vagas_ocupadas}/{evento.vagas_limite} vagas
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-navy-900">
                        {formatCurrency(evento.valor_inscricao)}
                      </span>
                      {vagasEsgotadas ? (
                        <span className="text-xs font-medium text-slate-400">Vagas esgotadas</span>
                      ) : (
                        <a
                          href={`/inscricao/${evento.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
                        >
                          Inscreva-se
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
