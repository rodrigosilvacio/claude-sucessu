import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  fornecedorSchema,
  type FornecedorFormValues,
  type FornecedorFormOutput,
} from "../schemas/fornecedor"
import { STATUS_FORNECEDOR } from "../constants/cadastro-options"
import { UFS } from "../constants/associado-options"
import { formatCNPJ, formatPhone, formatCEP } from "../lib/format"
import {
  createFornecedor,
  deleteFornecedor,
  getFornecedor,
  updateFornecedor,
} from "../lib/fornecedores"
import { friendlyErrorMessage } from "../lib/errors"
import { Combobox } from "../components/Combobox"
import { DocumentosSection } from "../components/DocumentosSection"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"

const emptyDefaults: FornecedorFormValues = {
  associacao_id: "",
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  telefone: "",
  email: "",
  site: "",
  nome_contato: "",
  cargo_contato: "",
  ramo_atividade: "",
  cep: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  banco: "",
  agencia: "",
  conta_corrente: "",
  chave_pix: "",
  status: "Ativo",
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

export function FornecedorForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FornecedorFormValues, unknown, FornecedorFormOutput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: emptyDefaults,
  })

  const { associacaoComboOptions } = useAssociacaoOptions({
    autoSelect: !isEditing,
    onAutoSelect: (associacaoId) => setValue("associacao_id", associacaoId),
  })

  useEffect(() => {
    if (!id) return
    getFornecedor(id)
      .then((fornecedor) => {
        reset({
          ...fornecedor,
          associacao_id: fornecedor.associacao_id ?? "",
          nome_fantasia: fornecedor.nome_fantasia ?? "",
          cnpj: fornecedor.cnpj ? formatCNPJ(fornecedor.cnpj) : "",
          telefone: fornecedor.telefone ?? "",
          email: fornecedor.email ?? "",
          site: fornecedor.site ?? "",
          nome_contato: fornecedor.nome_contato ?? "",
          cargo_contato: fornecedor.cargo_contato ?? "",
          ramo_atividade: fornecedor.ramo_atividade ?? "",
          cep: fornecedor.cep ?? "",
          endereco: fornecedor.endereco ?? "",
          numero_endereco: fornecedor.numero_endereco ?? "",
          complemento: fornecedor.complemento ?? "",
          bairro: fornecedor.bairro ?? "",
          cidade: fornecedor.cidade ?? "",
          estado: fornecedor.estado ?? "",
          banco: fornecedor.banco ?? "",
          agencia: fornecedor.agencia ?? "",
          conta_corrente: fornecedor.conta_corrente ?? "",
          chave_pix: fornecedor.chave_pix ?? "",
          observacoes: fornecedor.observacoes ?? "",
          status: fornecedor.status as FornecedorFormValues["status"],
        })
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  async function onSubmit(values: FornecedorFormOutput) {
    setSubmitError(null)
    try {
      if (isEditing && id) {
        await updateFornecedor(id, values)
      } else {
        await createFornecedor(values)
      }
      navigate("/fornecedores")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar fornecedor."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir este fornecedor?")) return
    try {
      await deleteFornecedor(id)
      navigate("/fornecedores")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir fornecedor."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Fornecedor" : "Novo Fornecedor"}
      </h1>
      <p className="mt-1 text-slate-500">Preencha os dados do fornecedor</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Section title="Dados da Empresa">
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

          <Field label="Razão Social *">
            <input {...register("razao_social")} className={inputClass} />
            {errors.razao_social && (
              <p className="mt-1 text-xs text-red-600">{errors.razao_social.message}</p>
            )}
          </Field>

          <Field label="Nome Fantasia">
            <input {...register("nome_fantasia")} className={inputClass} />
          </Field>

          <Field label="CNPJ">
            <Controller
              control={control}
              name="cnpj"
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                  className={inputClass}
                  placeholder="00.000.000/0000-00"
                />
              )}
            />
            {errors.cnpj && <p className="mt-1 text-xs text-red-600">{errors.cnpj.message}</p>}
          </Field>

          <Field label="Ramo de Atividade">
            <input
              {...register("ramo_atividade")}
              className={inputClass}
              placeholder="Ex: Alimentação, Gráfica, Audiovisual..."
            />
          </Field>

          <Field label="Status *">
            <select {...register("status")} className={inputClass}>
              {STATUS_FORNECEDOR.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Contato">
          <Field label="Telefone">
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                  className={inputClass}
                  placeholder="(11) 90000-0000"
                />
              )}
            />
          </Field>

          <Field label="E-mail">
            <input type="email" {...register("email")} className={inputClass} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </Field>

          <Field label="Site">
            <input {...register("site")} className={inputClass} placeholder="https://" />
          </Field>

          <Field label="Nome do Contato">
            <input {...register("nome_contato")} className={inputClass} />
          </Field>

          <Field label="Cargo do Contato">
            <input {...register("cargo_contato")} className={inputClass} />
          </Field>
        </Section>

        <Section title="Endereço">
          <Field label="CEP">
            <Controller
              control={control}
              name="cep"
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(formatCEP(e.target.value))}
                  className={inputClass}
                  placeholder="00000-000"
                />
              )}
            />
          </Field>

          <Field label="Endereço">
            <input {...register("endereco")} className={inputClass} placeholder="Rua/Avenida" />
          </Field>

          <Field label="Número">
            <input {...register("numero_endereco")} className={inputClass} />
          </Field>

          <Field label="Complemento">
            <input {...register("complemento")} className={inputClass} />
          </Field>

          <Field label="Bairro">
            <input {...register("bairro")} className={inputClass} />
          </Field>

          <Field label="Cidade">
            <input {...register("cidade")} className={inputClass} />
          </Field>

          <Field label="Estado (UF)">
            <select {...register("estado")} className={inputClass}>
              <option value="">Selecione</option>
              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Dados Bancários">
          <Field label="Banco">
            <input {...register("banco")} className={inputClass} />
          </Field>

          <Field label="Agência">
            <input {...register("agencia")} className={inputClass} />
          </Field>

          <Field label="Conta Corrente">
            <input {...register("conta_corrente")} className={inputClass} />
          </Field>

          <Field label="Chave PIX">
            <input {...register("chave_pix")} className={inputClass} />
          </Field>
        </Section>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <Field label="Observações">
            <textarea {...register("observacoes")} rows={3} className={inputClass} />
          </Field>
        </div>

        {isEditing && id && watch("associacao_id") && (
          <DocumentosSection
            entidadeTipo="fornecedor"
            entidadeId={id}
            associacaoId={watch("associacao_id")}
          />
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
              onClick={() => navigate("/fornecedores")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Fornecedor"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
