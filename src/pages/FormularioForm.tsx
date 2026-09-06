import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Copy, Plus, Trash2 } from "lucide-react"
import {
  formularioSchema,
  type FormularioFormValues,
  type FormularioFormOutput,
} from "../schemas/formulario"
import { STATUS_FORMULARIO, TIPOS_PERGUNTA } from "../types/formulario"
import {
  createFormulario,
  deleteFormulario,
  getFormulario,
  getPerguntas,
  listRespostas,
  updateFormulario,
} from "../lib/formularios"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { friendlyErrorMessage } from "../lib/errors"
import { Combobox } from "../components/Combobox"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { VicePresidencia } from "../types/vicePresidencia"
import type { FormularioResposta } from "../types/formulario"

const emptyDefaults: FormularioFormValues = {
  associacao_id: "",
  vice_presidencia_id: "",
  titulo: "",
  descricao: "",
  status: "Rascunho",
  data_encerramento: "",
  perguntas: [{ tipo: "Texto Curto", texto: "", obrigatoria: true, opcoes: [] }],
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

export function FormularioForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [respostas, setRespostas] = useState<FormularioResposta[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormularioFormValues, unknown, FormularioFormOutput>({
    resolver: zodResolver(formularioSchema),
    defaultValues: emptyDefaults,
  })

  const { fields, append, remove } = useFieldArray({ control, name: "perguntas" })
  const associacaoIdValue = watch("associacao_id")
  const linkFormulario = slug ? `${window.location.origin}/formulario/${slug}` : null

  const { associacaoComboOptions } = useAssociacaoOptions({
    autoSelect: !isEditing,
    onAutoSelect: (associacaoId) => setValue("associacao_id", associacaoId),
  })

  useEffect(() => {
    if (!associacaoIdValue) {
      setVicePresidencias([])
      return
    }
    listVicePresidencias(associacaoIdValue).then(setVicePresidencias)
  }, [associacaoIdValue])

  useEffect(() => {
    if (!id) return
    Promise.all([getFormulario(id), getPerguntas(id)])
      .then(([formulario, perguntas]) => {
        setSlug(formulario.slug)
        reset({
          ...formulario,
          associacao_id: formulario.associacao_id ?? "",
          vice_presidencia_id: formulario.vice_presidencia_id ?? "",
          descricao: formulario.descricao ?? "",
          data_encerramento: formulario.data_encerramento ?? "",
          status: formulario.status as FormularioFormValues["status"],
          perguntas: perguntas.map((p) => ({
            id: p.id,
            tipo: p.tipo,
            texto: p.texto,
            obrigatoria: p.obrigatoria,
            opcoes: p.opcoes,
          })),
        })
      })
      .finally(() => setLoading(false))
    listRespostas(id).then(setRespostas)
  }, [id, reset])

  async function onSubmit(values: FormularioFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateFormulario(id, values)
        navigate("/formularios")
      } else {
        const created = await createFormulario(values)
        navigate(`/formularios/${created.id}/editar`, { replace: true })
      }
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar formulário."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir este formulário? As respostas também serão removidas.")) return
    try {
      await deleteFormulario(id)
      navigate("/formularios")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir formulário."))
    }
  }

  function handleCopyLink() {
    if (!linkFormulario) return
    navigator.clipboard.writeText(linkFormulario)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Formulário" : "Novo Formulário"}
      </h1>
      <p className="mt-1 text-slate-500">Crie perguntas e colete respostas pelo link público</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {linkFormulario && (
          <div className="rounded-lg border border-brand-blue-500/30 bg-brand-blue-500/5 p-4">
            <p className={labelClass}>Link do Formulário</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={linkFormulario}
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
            {watch("status") === "Rascunho" && (
              <p className="mt-2 text-xs text-amber-700">
                O formulário está em Rascunho — mude o status para "Publicado" para aceitar respostas.
              </p>
            )}
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

            <Field label="Vice-Presidência">
              <select {...register("vice_presidencia_id")} className={inputClass}>
                <option value="">Nenhuma</option>
                {vicePresidencias.map((vp) => (
                  <option key={vp.id} value={vp.id}>
                    {vp.nome}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status *">
              <select {...register("status")} className={inputClass}>
                {STATUS_FORMULARIO.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Título *">
              <input {...register("titulo")} className={inputClass} />
              {errors.titulo && <p className="mt-1 text-xs text-red-600">{errors.titulo.message}</p>}
            </Field>

            <Field label="Data de Encerramento">
              <input type="date" {...register("data_encerramento")} className={inputClass} />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Descrição">
              <textarea {...register("descricao")} rows={2} className={inputClass} />
            </Field>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand-navy-900">Perguntas</h2>
            <button
              type="button"
              onClick={() => append({ tipo: "Texto Curto", texto: "", obrigatoria: true, opcoes: [] })}
              className="flex items-center gap-1.5 rounded-lg border border-brand-blue-600 px-3 py-1.5 text-sm font-medium text-brand-blue-600 hover:bg-brand-blue-500/10"
            >
              <Plus size={16} />
              Adicionar Pergunta
            </button>
          </div>
          {errors.perguntas?.root && (
            <p className="mt-2 text-xs text-red-600">{errors.perguntas.root.message}</p>
          )}
          {errors.perguntas?.message && (
            <p className="mt-2 text-xs text-red-600">{errors.perguntas.message}</p>
          )}

          <div className="mt-4 space-y-4">
            {fields.map((field, index) => {
              const tipo = watch(`perguntas.${index}.tipo`)
              const precisaOpcoes = tipo === "Múltipla Escolha" || tipo === "Múltiplas Seleções"
              return (
                <div key={field.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="mt-2 text-xs font-medium text-slate-400">#{index + 1}</span>
                    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Texto da Pergunta *">
                        <input {...register(`perguntas.${index}.texto`)} className={inputClass} />
                        {errors.perguntas?.[index]?.texto && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.perguntas[index]?.texto?.message}
                          </p>
                        )}
                      </Field>

                      <Field label="Tipo">
                        <select {...register(`perguntas.${index}.tipo`)} className={inputClass}>
                          {TIPOS_PERGUNTA.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </Field>

                      {precisaOpcoes && (
                        <label className="block sm:col-span-2">
                          <span className={labelClass}>Opções (uma por linha)</span>
                          <textarea
                            rows={3}
                            className={inputClass}
                            defaultValue={(field.opcoes ?? []).join("\n")}
                            onChange={(e) =>
                              setValue(
                                `perguntas.${index}.opcoes`,
                                e.target.value.split("\n").map((o) => o.trim()).filter(Boolean),
                              )
                            }
                          />
                        </label>
                      )}

                      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                        <input type="checkbox" {...register(`perguntas.${index}.obrigatoria`)} />
                        Resposta obrigatória
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label="Remover pergunta"
                      className="mt-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {isEditing && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-navy-900">Respostas</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {respostas.length}
              </span>
            </div>
            {respostas.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">Ainda não há respostas.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {respostas.map((r) => (
                  <div key={r.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-brand-navy-900">{r.respondente_nome}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(r.data_resposta).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {r.respondente_email && (
                      <div className="text-xs text-slate-400">{r.respondente_email}</div>
                    )}
                    <ul className="mt-2 space-y-1 text-slate-600">
                      {Object.entries(r.respostas).map(([pergunta, resposta]) => (
                        <li key={pergunta}>
                          <span className="text-slate-400">{pergunta}:</span>{" "}
                          {Array.isArray(resposta) ? resposta.join(", ") : resposta}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
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
              onClick={() => navigate("/formularios")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Formulário"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
