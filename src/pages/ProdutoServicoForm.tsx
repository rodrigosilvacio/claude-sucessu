import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  produtoServicoSchema,
  type ProdutoServicoFormValues,
  type ProdutoServicoFormOutput,
} from "../schemas/produtoServico"
import { TIPOS_PRODUTO_SERVICO } from "../constants/cadastro-options"
import {
  createProdutoServico,
  deleteProdutoServico,
  getProdutoServico,
  updateProdutoServico,
} from "../lib/produtosServicos"
import { listFornecedorOptions } from "../lib/fornecedores"
import { friendlyErrorMessage } from "../lib/errors"
import { Combobox } from "../components/Combobox"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { FornecedorOption } from "../types/fornecedor"

const emptyDefaults: ProdutoServicoFormValues = {
  associacao_id: "",
  fornecedor_id: "",
  nome: "",
  descricao: "",
  tipo: undefined as unknown as ProdutoServicoFormValues["tipo"],
  categoria: "",
  unidade_medida: "",
  custo: "",
  ativo: true,
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

export function ProdutoServicoForm() {
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
  } = useForm<ProdutoServicoFormValues, unknown, ProdutoServicoFormOutput>({
    resolver: zodResolver(produtoServicoSchema),
    defaultValues: emptyDefaults,
  })

  const fornecedorComboOptions = useMemo(
    () =>
      fornecedorOptions.map((f) => ({
        value: f.id,
        label: f.nome_fantasia || f.razao_social,
        sublabel: f.nome_fantasia ? f.razao_social : undefined,
      })),
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
    getProdutoServico(id)
      .then((item) => {
        reset({
          ...item,
          associacao_id: item.associacao_id ?? "",
          fornecedor_id: item.fornecedor_id ?? "",
          descricao: item.descricao ?? "",
          categoria: item.categoria ?? "",
          unidade_medida: item.unidade_medida ?? "",
          custo: item.custo !== null ? String(item.custo) : "",
          observacoes: item.observacoes ?? "",
          tipo: item.tipo as ProdutoServicoFormValues["tipo"],
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  async function onSubmit(values: ProdutoServicoFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateProdutoServico(id, values)
      } else {
        await createProdutoServico(values)
      }
      navigate("/produtos-servicos")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar item."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir este item?")) return
    try {
      await deleteProdutoServico(id)
      navigate("/produtos-servicos")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir item."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Item" : "Novo Produto ou Serviço"}
      </h1>
      <p className="mt-1 text-slate-500">Cadastro de produtos e serviços usados pela associação</p>

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

            <Field label="Nome *">
              <input {...register("nome")} className={inputClass} />
              {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
            </Field>

            <Field label="Tipo *">
              <select {...register("tipo")} className={inputClass}>
                <option value="">Selecione</option>
                {TIPOS_PRODUTO_SERVICO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipo && <p className="mt-1 text-xs text-red-600">{errors.tipo.message}</p>}
            </Field>

            <Field label="Categoria">
              <input
                {...register("categoria")}
                className={inputClass}
                placeholder="Ex: Alimentação, Áudio e Vídeo..."
              />
            </Field>

            <Field label="Unidade de Medida">
              <input
                {...register("unidade_medida")}
                className={inputClass}
                placeholder="Ex: unidade, hora, diária..."
              />
            </Field>

            <Field label="Custo (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                {...register("custo")}
                className={inputClass}
                placeholder="0,00"
              />
              {errors.custo && <p className="mt-1 text-xs text-red-600">{errors.custo.message}</p>}
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
                    emptyMessage="Nenhum fornecedor ativo encontrado"
                  />
                )}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Descrição">
              <textarea {...register("descricao")} rows={3} className={inputClass} />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register("ativo")} />
            Item ativo (disponível para uso/contratação)
          </label>

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
              onClick={() => navigate("/produtos-servicos")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Item"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
