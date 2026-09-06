import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Copy } from "lucide-react"
import { eventoSchema, type EventoFormValues, type EventoFormOutput } from "../schemas/evento"
import { STATUS_EVENTO, MODALIDADES_EVENTO } from "../types/evento"
import { createEvento, deleteEvento, getEvento, updateEvento } from "../lib/eventos"
import { listInscricoes, togglePresenca } from "../lib/eventoInscricoes"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { listVoluntarioOptions } from "../lib/voluntarios"
import { Combobox } from "../components/Combobox"
import { DocumentosSection } from "../components/DocumentosSection"
import { formatDateBR } from "../lib/format"
import { friendlyErrorMessage } from "../lib/errors"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { VicePresidencia } from "../types/vicePresidencia"
import type { VoluntarioOption } from "../types/voluntario"
import type { EventoInscricao } from "../types/eventoInscricao"

const emptyDefaults: EventoFormValues = {
  associacao_id: "",
  vice_presidencia_id: "",
  responsavel_id: "",
  nome: "",
  descricao: "",
  data_evento: "",
  hora_inicio: "",
  hora_termino: "",
  modalidade: "Presencial",
  local_ou_link: "",
  vagas_limite: "",
  custo_evento: "",
  valor_inscricao: "",
  status: "Planejado",
  observacoes: "",
}

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
const labelClass = "text-sm font-medium text-brand-navy-900"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

export function EventoForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [voluntarioOptions, setVoluntarioOptions] = useState<VoluntarioOption[]>([])
  const [slug, setSlug] = useState<string | null>(null)
  const [dataCadastro, setDataCadastro] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [inscricoes, setInscricoes] = useState<EventoInscricao[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventoFormValues, unknown, EventoFormOutput>({
    resolver: zodResolver(eventoSchema),
    defaultValues: emptyDefaults,
  })

  const associacaoIdValue = watch("associacao_id")
  const responsavelId = watch("responsavel_id")
  const vicePresidenciaId = watch("vice_presidencia_id")
  const modalidade = watch("modalidade")

  const responsavelOptions = useMemo(() => {
    const filtered = vicePresidenciaId
      ? voluntarioOptions.filter((v) => v.vice_presidencia_id === vicePresidenciaId)
      : voluntarioOptions
    return filtered.map((v) => ({
      value: v.id,
      label: v.nome_completo,
      sublabel: `Nº ${v.numero_associado}`,
    }))
  }, [voluntarioOptions, vicePresidenciaId])

  const { associacaoComboOptions } = useAssociacaoOptions({
    autoSelect: !isEditing,
    onAutoSelect: (associacaoId) => setValue("associacao_id", associacaoId),
  })

  const linkInscricao = slug ? `${window.location.origin}/inscricao/${slug}` : null

  useEffect(() => {
    listVoluntarioOptions().then(setVoluntarioOptions)
  }, [])

  useEffect(() => {
    if (!associacaoIdValue) {
      setVicePresidencias([])
      return
    }
    listVicePresidencias(associacaoIdValue).then(setVicePresidencias)
  }, [associacaoIdValue])

  // Ao escolher o voluntário responsável, já traz a Vice-Presidência dele.
  useEffect(() => {
    if (!responsavelId) return
    const voluntario = voluntarioOptions.find((v) => v.id === responsavelId)
    if (voluntario) setValue("vice_presidencia_id", voluntario.vice_presidencia_id)
  }, [responsavelId, voluntarioOptions, setValue])

  useEffect(() => {
    if (!id) return
    getEvento(id)
      .then((evento) => {
        setSlug(evento.slug)
        setDataCadastro(evento.data_cadastro)
        reset({
          ...evento,
          associacao_id: evento.associacao_id ?? "",
          descricao: evento.descricao ?? "",
          hora_inicio: evento.hora_inicio ?? "",
          hora_termino: evento.hora_termino ?? "",
          local_ou_link: evento.local_ou_link ?? "",
          vagas_limite: evento.vagas_limite !== null ? String(evento.vagas_limite) : "",
          custo_evento: evento.custo_evento !== null ? String(evento.custo_evento) : "",
          valor_inscricao: evento.valor_inscricao !== null ? String(evento.valor_inscricao) : "",
          observacoes: evento.observacoes ?? "",
          modalidade: evento.modalidade as EventoFormValues["modalidade"],
          status: evento.status as EventoFormValues["status"],
        })
      })
      .finally(() => setLoading(false))
    listInscricoes(id).then(setInscricoes)
  }, [id, reset])

  async function onSubmit(values: EventoFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateEvento(id, values)
      } else {
        const created = await createEvento(values)
        navigate(`/eventos/${created.id}/editar`, { replace: true })
        return
      }
      navigate("/eventos")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar evento."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir este evento? Os inscritos também serão removidos.")) return
    try {
      await deleteEvento(id)
      navigate("/eventos")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir evento."))
    }
  }

  function handleCopyLink() {
    if (!linkInscricao) return
    navigator.clipboard.writeText(linkInscricao)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleTogglePresenca(inscricaoId: string, presente: boolean) {
    setInscricoes((prev) =>
      prev.map((i) => (i.id === inscricaoId ? { ...i, presente } : i)),
    )
    try {
      await togglePresenca(inscricaoId, presente)
    } catch {
      setInscricoes((prev) =>
        prev.map((i) => (i.id === inscricaoId ? { ...i, presente: !presente } : i)),
      )
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Evento" : "Novo Evento"}
      </h1>
      <p className="mt-1 text-slate-500">Cadastro de eventos organizados pela associação</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {linkInscricao && (
          <div className="rounded-lg border border-brand-blue-500/30 bg-brand-blue-500/5 p-4">
            <p className={labelClass}>Link de Inscrição</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={linkInscricao}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-800"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Associação *">
              <Controller
                control={control}
                name="associacao_id"
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={associacaoComboOptions}
                    placeholder="Buscar associação..."
                  />
                )}
              />
              {errors.associacao_id && (
                <p className="mt-1 text-xs text-red-600">{errors.associacao_id.message}</p>
              )}
            </Field>

            <Field label="Voluntário Responsável *">
              <Controller
                control={control}
                name="responsavel_id"
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={responsavelOptions}
                    placeholder="Buscar voluntário..."
                  />
                )}
              />
              {errors.responsavel_id && (
                <p className="mt-1 text-xs text-red-600">{errors.responsavel_id.message}</p>
              )}
            </Field>

            <Field label="Vice-Presidência *">
              <select {...register("vice_presidencia_id")} className={inputClass}>
                <option value="">Selecione</option>
                {vicePresidencias.map((vp) => (
                  <option key={vp.id} value={vp.id}>
                    {vp.nome}
                  </option>
                ))}
              </select>
              {errors.vice_presidencia_id && (
                <p className="mt-1 text-xs text-red-600">{errors.vice_presidencia_id.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Preenchida automaticamente ao escolher o responsável.
              </p>
            </Field>

            <Field label="Nome do Evento *">
              <input {...register("nome")} className={inputClass} />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
            </Field>

            <Field label="Data do Evento *">
              <input type="date" {...register("data_evento")} className={inputClass} />
              {errors.data_evento && (
                <p className="mt-1 text-xs text-red-600">{errors.data_evento.message}</p>
              )}
            </Field>

            <Field label="Data de Cadastro">
              <input
                disabled
                value={dataCadastro ? formatDateBR(dataCadastro) : "Hoje (automático)"}
                className={`${inputClass} bg-slate-50 text-slate-400`}
              />
            </Field>

            <Field label="Hora de Início">
              <input type="time" {...register("hora_inicio")} className={inputClass} />
            </Field>

            <Field label="Hora de Término">
              <input type="time" {...register("hora_termino")} className={inputClass} />
            </Field>

            <Field label="Modalidade *">
              <select {...register("modalidade")} className={inputClass}>
                {MODALIDADES_EVENTO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={modalidade === "Online" ? "Link da Transmissão" : "Local do Evento"}>
              <input
                {...register("local_ou_link")}
                className={inputClass}
                placeholder={modalidade === "Online" ? "https://" : "Endereço do evento"}
              />
            </Field>

            <Field label="Vagas (limite)">
              <input type="number" min="1" {...register("vagas_limite")} className={inputClass} placeholder="Sem limite" />
              {errors.vagas_limite && (
                <p className="mt-1 text-xs text-red-600">{errors.vagas_limite.message}</p>
              )}
            </Field>

            <Field label="Custo do Evento (R$)">
              <input type="number" step="0.01" min="0" {...register("custo_evento")} className={inputClass} placeholder="0,00" />
            </Field>

            <Field label="Valor de Inscrição (R$)">
              <input type="number" step="0.01" min="0" {...register("valor_inscricao")} className={inputClass} placeholder="Gratuito" />
            </Field>

            <Field label="Status *">
              <select {...register("status")} className={inputClass}>
                {STATUS_EVENTO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Descrição do Evento">
              <textarea {...register("descricao")} rows={3} className={inputClass} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Observações">
              <textarea {...register("observacoes")} rows={2} className={inputClass} />
            </Field>
          </div>
        </div>

        {isEditing && id && associacaoIdValue && (
          <DocumentosSection entidadeTipo="evento" entidadeId={id} associacaoId={associacaoIdValue} />
        )}

        {isEditing && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-navy-900">Inscritos</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {inscricoes.length}
              </span>
            </div>

            {inscricoes.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Ainda não há inscritos neste evento.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Nome</th>
                      <th className="py-2 pr-4 font-medium">Contato</th>
                      <th className="py-2 pr-4 font-medium">Empresa</th>
                      <th className="py-2 pr-4 font-medium">Inscrito em</th>
                      <th className="py-2 pr-4 font-medium">Presença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inscricoes.map((i) => (
                      <tr key={i.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-4 font-medium text-brand-navy-900">{i.nome_completo}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          <div>{i.email}</div>
                          {i.telefone && <div className="text-xs text-slate-400">{i.telefone}</div>}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">{i.empresa || "—"}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          {new Date(i.data_inscricao).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="py-2 pr-4">
                          <label className="flex items-center gap-2 text-slate-600">
                            <input
                              type="checkbox"
                              checked={i.presente}
                              onChange={(e) => handleTogglePresenca(i.id, e.target.checked)}
                            />
                            Compareceu
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <div className="flex justify-between gap-3">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Excluir
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/eventos")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Evento"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
