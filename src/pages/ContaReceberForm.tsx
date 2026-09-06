import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  contaReceberSchema,
  type ContaReceberFormValues,
  type ContaReceberFormOutput,
} from "../schemas/financeiro"
import { STATUS_CONTA_RECEBER } from "../constants/cadastro-options"
import {
  createContaReceber,
  deleteContaReceber,
  getContaReceber,
  updateContaReceber,
} from "../lib/financeiro"
import { listAssociadoOptions } from "../lib/associados"
import { friendlyErrorMessage } from "../lib/errors"
import { Combobox } from "../components/Combobox"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { AssociadoOption } from "../types/associado"

const emptyDefaults: ContaReceberFormValues = {
  associacao_id: "",
  associado_id: "",
  descricao: "",
  valor: "",
  data_vencimento: "",
  data_recebimento: "",
  status: "Pendente",
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-brand-navy-900">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

export function ContaReceberForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [associadoOptions, setAssociadoOptions] = useState<AssociadoOption[]>([])

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContaReceberFormValues, unknown, ContaReceberFormOutput>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: emptyDefaults,
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

  const { associacaoComboOptions } = useAssociacaoOptions({
    autoSelect: !isEditing,
    onAutoSelect: (associacaoId) => setValue("associacao_id", associacaoId),
  })

  useEffect(() => {
    listAssociadoOptions().then(setAssociadoOptions)
  }, [])

  useEffect(() => {
    if (!id) return
    getContaReceber(id)
      .then((conta) => {
        reset({
          associacao_id: conta.associacao_id ?? "",
          associado_id: conta.associado_id ?? "",
          descricao: conta.descricao,
          valor: String(conta.valor),
          data_vencimento: conta.data_vencimento,
          data_recebimento: conta.data_recebimento ?? "",
          status: conta.status as ContaReceberFormValues["status"],
          observacoes: conta.observacoes ?? "",
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  async function onSubmit(values: ContaReceberFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateContaReceber(id, values)
      } else {
        await createContaReceber(values)
      }
      navigate("/financeiro?aba=receber")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar conta a receber."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir esta conta a receber?")) return
    try {
      await deleteContaReceber(id)
      navigate("/financeiro?aba=receber")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir conta a receber."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Conta a Receber" : "Nova Conta a Receber"}
      </h1>
      <p className="mt-1 text-slate-500">Preencha os dados da conta a receber</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Section title="Dados da Conta">
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

          <Field label="Associado">
            <Controller
              control={control}
              name="associado_id"
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={associadoComboOptions}
                  placeholder="Buscar associado..."
                />
              )}
            />
          </Field>

          <Field label="Descrição *">
            <input {...register("descricao")} className={inputClass} />
            {errors.descricao && (
              <p className="mt-1 text-xs text-red-600">{errors.descricao.message}</p>
            )}
          </Field>

          <Field label="Valor (R$) *">
            <input type="number" step="0.01" min="0" {...register("valor")} className={inputClass} />
            {errors.valor && <p className="mt-1 text-xs text-red-600">{errors.valor.message}</p>}
          </Field>

          <Field label="Data de Vencimento *">
            <input type="date" {...register("data_vencimento")} className={inputClass} />
            {errors.data_vencimento && (
              <p className="mt-1 text-xs text-red-600">{errors.data_vencimento.message}</p>
            )}
          </Field>

          <Field label="Data de Recebimento">
            <input type="date" {...register("data_recebimento")} className={inputClass} />
          </Field>

          <Field label="Status *">
            <select {...register("status")} className={inputClass}>
              {STATUS_CONTA_RECEBER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <Field label="Observações">
            <textarea {...register("observacoes")} rows={3} className={inputClass} />
          </Field>
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
              onClick={() => navigate("/financeiro?aba=receber")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Conta"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
