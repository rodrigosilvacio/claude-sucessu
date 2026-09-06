import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  voluntarioSchema,
  type VoluntarioFormValues,
  type VoluntarioFormOutput,
} from "../schemas/voluntario"
import { PREFERENCIAS_CONTATO } from "../constants/associado-options"
import {
  createVoluntario,
  deleteVoluntario,
  getVoluntario,
  updateVoluntario,
} from "../lib/voluntarios"
import { getAssociado, listAssociadoOptions } from "../lib/associados"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { friendlyErrorMessage } from "../lib/errors"
import { AssociadoAvatar } from "../components/AssociadoAvatar"
import { Combobox } from "../components/Combobox"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { AssociadoOption, Associado } from "../types/associado"
import type { VicePresidencia } from "../types/vicePresidencia"

const emptyDefaults: VoluntarioFormValues = {
  associacao_id: "",
  associado_id: "",
  vice_presidencia_id: "",
  data_inicio: "",
  data_termino: "",
  preferencia_contato: "Email",
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

export function VoluntarioForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [associadoOptions, setAssociadoOptions] = useState<AssociadoOption[]>([])
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [selectedAssociado, setSelectedAssociado] = useState<Associado | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VoluntarioFormValues, unknown, VoluntarioFormOutput>({
    resolver: zodResolver(voluntarioSchema),
    defaultValues: emptyDefaults,
  })

  const associadoId = watch("associado_id")
  const associacaoIdValue = watch("associacao_id")

  const { associacaoComboOptions } = useAssociacaoOptions({
    autoSelect: !isEditing,
    onAutoSelect: (associacaoId) => setValue("associacao_id", associacaoId),
  })

  const associadoComboOptions = useMemo(
    () =>
      associadoOptions.map((a) => ({
        value: a.id,
        label: a.nome_completo,
        sublabel: `Nº ${a.numero_associado}`,
      })),
    [associadoOptions],
  )

  useEffect(() => {
    listAssociadoOptions().then(setAssociadoOptions)
  }, [])

  useEffect(() => {
    if (!associacaoIdValue) {
      setVicePresidencias([])
      return
    }
    listVicePresidencias(associacaoIdValue).then(setVicePresidencias)
  }, [associacaoIdValue])

  useEffect(() => {
    if (!id) return
    getVoluntario(id)
      .then((voluntario) => {
        reset({
          ...voluntario,
          associacao_id: voluntario.associacao_id ?? "",
          data_termino: voluntario.data_termino ?? "",
          preferencia_contato:
            voluntario.preferencia_contato as VoluntarioFormValues["preferencia_contato"],
          observacoes: voluntario.observacoes ?? "",
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  useEffect(() => {
    if (!associadoId) {
      setSelectedAssociado(null)
      return
    }
    let active = true
    getAssociado(associadoId).then((associado) => {
      if (active) setSelectedAssociado(associado)
    })
    return () => {
      active = false
    }
  }, [associadoId])

  async function onSubmit(values: VoluntarioFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateVoluntario(id, values)
      } else {
        await createVoluntario(values)
      }
      navigate("/voluntarios")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar voluntário."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir este voluntário?")) return
    try {
      await deleteVoluntario(id)
      navigate("/voluntarios")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir voluntário."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Voluntário" : "Novo Voluntário"}
      </h1>
      <p className="mt-1 text-slate-500">Um voluntário é sempre um associado já cadastrado</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <Field label="Associado *">
              <Controller
                control={control}
                name="associado_id"
                render={({ field }) => (
                  <Combobox
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    options={associadoComboOptions}
                    placeholder="Buscar associado por nome ou número..."
                  />
                )}
              />
              {errors.associado_id && (
                <p className="mt-1 text-xs text-red-600">{errors.associado_id.message}</p>
              )}
            </Field>
          </div>

          {selectedAssociado && (
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <AssociadoAvatar
                fotoPath={selectedAssociado.foto_url}
                nome={selectedAssociado.nome_completo}
                size={44}
              />
              <div className="text-sm">
                <div className="font-medium text-brand-navy-900">
                  {selectedAssociado.nome_completo}
                </div>
                <div className="text-slate-500">
                  {selectedAssociado.telefone} · {selectedAssociado.email}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-navy-900">Atuação</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Vice-Presidência que atuará *">
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
            </Field>

            <Field label="Data de Início *">
              <input type="date" {...register("data_inicio")} className={inputClass} />
              {errors.data_inicio && (
                <p className="mt-1 text-xs text-red-600">{errors.data_inicio.message}</p>
              )}
            </Field>

            <Field label="Data de Término">
              <input type="date" {...register("data_termino")} className={inputClass} />
              {errors.data_termino && (
                <p className="mt-1 text-xs text-red-600">{errors.data_termino.message}</p>
              )}
            </Field>

            <Field label="Preferência de Contato *">
              <select {...register("preferencia_contato")} className={inputClass}>
                {PREFERENCIAS_CONTATO.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Observação">
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
              onClick={() => navigate("/voluntarios")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Voluntário"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
