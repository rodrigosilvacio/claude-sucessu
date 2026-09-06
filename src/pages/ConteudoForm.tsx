import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  conteudoSchema,
  type ConteudoFormValues,
  type ConteudoFormOutput,
} from "../schemas/conteudo"
import { MEIOS_CONTEUDO, PRIORIDADES_CONTEUDO } from "../constants/conteudo-options"
import { STATUS_CONTEUDO } from "../types/conteudo"
import { createConteudo, deleteConteudo, getConteudo, updateConteudo } from "../lib/conteudos"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { listVoluntarioOptions } from "../lib/voluntarios"
import { Combobox } from "../components/Combobox"
import { formatDateBR } from "../lib/format"
import { friendlyErrorMessage } from "../lib/errors"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { VicePresidencia } from "../types/vicePresidencia"
import type { VoluntarioOption } from "../types/voluntario"

const emptyDefaults: ConteudoFormValues = {
  associacao_id: "",
  vice_presidencia_id: "",
  solicitante_id: "",
  titulo: "",
  descricao: "",
  meios: [],
  prioridade: "Média",
  status: "A Fazer",
  data_esperada_publicacao: "",
  link_publicado: "",
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

export function ConteudoForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [voluntarioOptions, setVoluntarioOptions] = useState<VoluntarioOption[]>([])
  const [dataSolicitacao, setDataSolicitacao] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConteudoFormValues, unknown, ConteudoFormOutput>({
    resolver: zodResolver(conteudoSchema),
    defaultValues: emptyDefaults,
  })

  const associacaoIdValue = watch("associacao_id")
  const vicePresidenciaId = watch("vice_presidencia_id")
  const solicitanteId = watch("solicitante_id")

  const solicitanteOptions = useMemo(() => {
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

  // Ao escolher o voluntário solicitante, já traz a Vice-Presidência dele.
  useEffect(() => {
    if (!solicitanteId) return
    const voluntario = voluntarioOptions.find((v) => v.id === solicitanteId)
    if (voluntario) setValue("vice_presidencia_id", voluntario.vice_presidencia_id)
  }, [solicitanteId, voluntarioOptions, setValue])

  useEffect(() => {
    if (!id) return
    getConteudo(id)
      .then((conteudo) => {
        setDataSolicitacao(conteudo.data_solicitacao)
        reset({
          ...conteudo,
          associacao_id: conteudo.associacao_id ?? "",
          descricao: conteudo.descricao ?? "",
          data_esperada_publicacao: conteudo.data_esperada_publicacao ?? "",
          link_publicado: conteudo.link_publicado ?? "",
          observacoes: conteudo.observacoes ?? "",
          prioridade: conteudo.prioridade as ConteudoFormValues["prioridade"],
          status: conteudo.status,
          meios: conteudo.meios as ConteudoFormValues["meios"],
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  async function onSubmit(values: ConteudoFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateConteudo(id, values)
      } else {
        await createConteudo(values)
      }
      navigate("/conteudos")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar solicitação."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir esta solicitação de conteúdo?")) return
    try {
      await deleteConteudo(id)
      navigate("/conteudos")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir solicitação."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Solicitação de Conteúdo" : "Nova Solicitação de Conteúdo"}
      </h1>
      <p className="mt-1 text-slate-500">Solicitação de conteúdo por uma Vice-Presidência</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
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

            <Field label="Solicitante (Voluntário) *">
              <Controller
                control={control}
                name="solicitante_id"
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={solicitanteOptions}
                    placeholder="Buscar voluntário..."
                    emptyMessage="Nenhum voluntário ativo nessa VP"
                  />
                )}
              />
              {errors.solicitante_id && (
                <p className="mt-1 text-xs text-red-600">{errors.solicitante_id.message}</p>
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
                Preenchida automaticamente ao escolher o solicitante — pode ser ajustada.
              </p>
            </Field>

            <Field label="Status (Kanban)">
              <select {...register("status")} className={inputClass}>
                {STATUS_CONTEUDO.map((s) => (
                  <option key={s} value={s}>
                    {s === "Arquivado" ? "Arquivados" : s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Data da Solicitação">
              <input
                disabled
                value={dataSolicitacao ? formatDateBR(dataSolicitacao) : "Hoje (automático)"}
                className={`${inputClass} bg-slate-50 text-slate-400`}
              />
            </Field>

            <Field label="Data Esperada de Publicação">
              <input type="date" {...register("data_esperada_publicacao")} className={inputClass} />
            </Field>

            <Field label="Prioridade">
              <select {...register("prioridade")} className={inputClass}>
                {PRIORIDADES_CONTEUDO.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Conteúdo Solicitado *">
              <input {...register("titulo")} className={inputClass} placeholder="Ex: Post sobre a Lei X" />
              {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Descrição">
              <textarea {...register("descricao")} rows={3} className={inputClass} />
            </Field>
          </div>

          <div className="mt-4">
            <span className={labelClass}>Meios *</span>
            <div className="mt-2 flex flex-wrap gap-4">
              {MEIOS_CONTEUDO.map((meio) => (
                <label key={meio} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" value={meio} {...register("meios")} />
                  {meio}
                </label>
              ))}
            </div>
            {errors.meios && <p className="mt-1 text-xs text-red-600">{errors.meios.message}</p>}
          </div>

          <div className="mt-4">
            <Field label="Link Publicado">
              <input {...register("link_publicado")} className={inputClass} placeholder="https://" />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Observações">
              <textarea {...register("observacoes")} rows={3} className={inputClass} />
            </Field>
          </div>
        </div>

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
              onClick={() => navigate("/conteudos")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Solicitação"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
