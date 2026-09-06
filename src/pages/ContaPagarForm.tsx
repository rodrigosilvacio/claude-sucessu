import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  contaPagarSchema,
  type ContaPagarFormValues,
  type ContaPagarFormOutput,
} from "../schemas/financeiro"
import { STATUS_CONTA_PAGAR } from "../constants/cadastro-options"
import {
  createContaPagar,
  deleteContaPagar,
  getContaPagar,
  updateContaPagar,
} from "../lib/financeiro"
import { listFornecedorOptions } from "../lib/fornecedores"
import { friendlyErrorMessage } from "../lib/errors"
import { Combobox } from "../components/Combobox"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { FornecedorOption } from "../types/fornecedor"

const emptyDefaults: ContaPagarFormValues = {
  associacao_id: "",
  fornecedor_id: "",
  descricao: "",
  valor: "",
  data_vencimento: "",
  data_pagamento: "",
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

export function ContaPagarForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fornecedorOptions, setFornecedorOptions] = useState<FornecedorOption[]>([])

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContaPagarFormValues, unknown, ContaPagarFormOutput>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: emptyDefaults,
  })

  const fornecedorComboOptions = useMemo(
    () => fornecedorOptions.map((f) => ({ value: f.id, label: f.razao_social, sublabel: f.nome_fantasia ?? undefined })),
    [fornecedorOptions],
  )

  const { associacaoComboOptions } = useAssociacaoOptions({
    autoSelect: !isEditing,
    onAutoSelect: (associacaoId) => setValue("associacao_id", associacaoId),
  })

  useEffect(() => {
    listFornecedorOptions().then(setFornecedorOptions)
  }, [])

  useEffect(() => {
    if (!id) return
    getContaPagar(id)
      .then((conta) => {
        reset({
          associacao_id: conta.associacao_id ?? "",
          fornecedor_id: conta.fornecedor_id ?? "",
          descricao: conta.descricao,
          valor: String(conta.valor),
          data_vencimento: conta.data_vencimento,
          data_pagamento: conta.data_pagamento ?? "",
          status: conta.status as ContaPagarFormValues["status"],
          observacoes: conta.observacoes ?? "",
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  async function onSubmit(values: ContaPagarFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateContaPagar(id, values)
      } else {
        await createContaPagar(values)
      }
      navigate("/financeiro?aba=pagar")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar conta a pagar."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir esta conta a pagar?")) return
    try {
      await deleteContaPagar(id)
      navigate("/financeiro?aba=pagar")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir conta a pagar."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Conta a Pagar" : "Nova Conta a Pagar"}
      </h1>
      <p className="mt-1 text-slate-500">Preencha os dados da conta a pagar</p>

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

          <Field label="Fornecedor">
            <Controller
              control={control}
              name="fornecedor_id"
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={fornecedorComboOptions}
                  placeholder="Buscar fornecedor..."
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

          <Field label="Data de Pagamento">
            <input type="date" {...register("data_pagamento")} className={inputClass} />
          </Field>

          <Field label="Status *">
            <select {...register("status")} className={inputClass}>
              {STATUS_CONTA_PAGAR.map((s) => (
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
              onClick={() => navigate("/financeiro?aba=pagar")}
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
