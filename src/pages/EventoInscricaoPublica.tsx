import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Calendar, Clock, MapPin, Users } from "lucide-react"
import { Logo } from "../components/Logo"
import { getEventoPublico, inscreverEmEvento } from "../lib/eventos"
import { formatDateBR } from "../lib/format"
import {
  eventoInscricaoSchema,
  type EventoInscricaoFormValues,
  type EventoInscricaoFormOutput,
} from "../schemas/eventoInscricao"
import type { EventoPublico } from "../types/evento"

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
const labelClass = "text-sm font-medium text-brand-navy-900"

function formatCurrency(value: number | null) {
  if (!value) return "Gratuito"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function EventoInscricaoPublica() {
  const { slug } = useParams()
  const [evento, setEvento] = useState<EventoPublico | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventoInscricaoFormValues, unknown, EventoInscricaoFormOutput>({
    resolver: zodResolver(eventoInscricaoSchema),
    defaultValues: { nome_completo: "", email: "", telefone: "", empresa: "" },
  })

  useEffect(() => {
    if (!slug) return
    getEventoPublico(slug)
      .then((data) => {
        if (!data) setNotFound(true)
        else setEvento(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  async function onSubmit(values: EventoInscricaoFormOutput) {
    if (!slug) return
    setSubmitError(null)
    try {
      await inscreverEmEvento(slug, values)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar inscrição.")
    }
  }

  const vagasEsgotadas =
    evento?.vagas_limite !== null &&
    evento?.vagas_limite !== undefined &&
    evento.vagas_ocupadas >= evento.vagas_limite

  const inscricoesFechadas = evento?.status !== "Planejado"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 py-10">
      <div className="rounded-2xl bg-white px-8 py-5 shadow-sm">
        <Logo />
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        {loading && <p className="text-center text-sm text-slate-400">Carregando...</p>}

        {!loading && notFound && (
          <div className="py-6 text-center">
            <h1 className="text-xl font-bold text-brand-navy-900">Evento não encontrado</h1>
            <p className="mt-2 text-slate-500">Verifique se o link está correto.</p>
          </div>
        )}

        {!loading && evento && submitted && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={40} className="text-green-600" />
            <h1 className="text-xl font-bold text-brand-navy-900">Inscrição confirmada!</h1>
            <p className="text-slate-500">
              Você está inscrito em <strong>{evento.nome}</strong>. Nos vemos lá!
            </p>
          </div>
        )}

        {!loading && evento && !submitted && (
          <>
            <h1 className="text-center text-2xl font-bold text-brand-navy-900">{evento.nome}</h1>
            {evento.descricao && (
              <p className="mt-2 text-center text-slate-500">{evento.descricao}</p>
            )}

            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-blue-600" />
                {formatDateBR(evento.data_evento)}
                {evento.hora_inicio && ` às ${evento.hora_inicio.slice(0, 5)}`}
              </div>
              {evento.local_ou_link && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-blue-600" />
                  {evento.modalidade}: {evento.local_ou_link}
                </div>
              )}
              {evento.hora_termino && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-brand-blue-600" />
                  Término: {evento.hora_termino.slice(0, 5)}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users size={16} className="text-brand-blue-600" />
                {formatCurrency(evento.valor_inscricao)}
                {evento.vagas_limite ? ` · ${evento.vagas_ocupadas}/${evento.vagas_limite} vagas` : ""}
              </div>
            </div>

            {inscricoesFechadas ? (
              <p className="mt-6 text-center text-sm text-slate-500">
                As inscrições para este evento não estão mais abertas.
              </p>
            ) : vagasEsgotadas ? (
              <p className="mt-6 text-center text-sm text-slate-500">
                Este evento está com as vagas esgotadas.
              </p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <label className="block">
                  <span className={labelClass}>Nome Completo *</span>
                  <input {...register("nome_completo")} className={inputClass} />
                  {errors.nome_completo && (
                    <p className="mt-1 text-xs text-red-600">{errors.nome_completo.message}</p>
                  )}
                </label>

                <label className="block">
                  <span className={labelClass}>E-mail *</span>
                  <input type="email" {...register("email")} className={inputClass} />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </label>

                <label className="block">
                  <span className={labelClass}>Telefone</span>
                  <input {...register("telefone")} className={inputClass} placeholder="(11) 90000-0000" />
                </label>

                <label className="block">
                  <span className={labelClass}>Empresa</span>
                  <input {...register("empresa")} className={inputClass} />
                </label>

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
                >
                  {isSubmitting ? "Enviando..." : "Confirmar Inscrição"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
