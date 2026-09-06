import { useEffect, useMemo, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  associacaoSchema,
  type AssociacaoFormValues,
  type AssociacaoFormOutput,
} from "../schemas/associacao"
import {
  createAssociacao,
  getLogoPublicUrl,
  getPrimaryAssociacao,
  updateAssociacao,
  uploadLogoAssociacao,
} from "../lib/associacoes"
import { listAssociadoOptions } from "../lib/associados"
import { UFS } from "../constants/associado-options"
import { formatCNPJ, formatPhone, formatCEP } from "../lib/format"
import { Combobox } from "../components/Combobox"
import { VicePresidenciasManager } from "../components/VicePresidenciasManager"
import { friendlyErrorMessage } from "../lib/errors"
import type { AssociadoOption } from "../types/associado"

const emptyDefaults: AssociacaoFormValues = {
  nome: "",
  cnpj: "",
  cep: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  telefone: "",
  email: "",
  presidente_id: "",
  vp_financeiro_id: "",
  vp_operacoes_id: "",
  banco: "",
  agencia: "",
  conta_corrente: "",
  valor_pessoa_fisica: "100.00",
  valor_pessoa_juridica: "100.00",
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

export function AssociacaoPage() {
  const [associacaoId, setAssociacaoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [associadoOptions, setAssociadoOptions] = useState<AssociadoOption[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [existingLogoPath, setExistingLogoPath] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssociacaoFormValues, unknown, AssociacaoFormOutput>({
    resolver: zodResolver(associacaoSchema),
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

  useEffect(() => {
    listAssociadoOptions().then(setAssociadoOptions)
  }, [])

  useEffect(() => {
    getPrimaryAssociacao()
      .then((associacao) => {
        if (!associacao) return
        setAssociacaoId(associacao.id)
        reset({
          ...associacao,
          cnpj: associacao.cnpj ? formatCNPJ(associacao.cnpj) : "",
          cep: associacao.cep ?? "",
          endereco: associacao.endereco ?? "",
          numero_endereco: associacao.numero_endereco ?? "",
          complemento: associacao.complemento ?? "",
          bairro: associacao.bairro ?? "",
          cidade: associacao.cidade ?? "",
          estado: associacao.estado ?? "",
          telefone: associacao.telefone ?? "",
          email: associacao.email ?? "",
          presidente_id: associacao.presidente_id ?? "",
          vp_financeiro_id: associacao.vp_financeiro_id ?? "",
          vp_operacoes_id: associacao.vp_operacoes_id ?? "",
          banco: associacao.banco ?? "",
          agencia: associacao.agencia ?? "",
          conta_corrente: associacao.conta_corrente ?? "",
          valor_pessoa_fisica: String(associacao.valor_pessoa_fisica ?? 100),
          valor_pessoa_juridica: String(associacao.valor_pessoa_juridica ?? 100),
        })
        setExistingLogoPath(associacao.logo_url)
        if (associacao.logo_url) setLogoPreview(getLogoPublicUrl(associacao.logo_url))
      })
      .finally(() => setLoading(false))
  }, [reset])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    if (file) setLogoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(values: AssociacaoFormOutput) {
    setSubmitError(null)
    setSavedMessage(null)
    try {
      let logoPath = existingLogoPath
      if (logoFile) {
        logoPath = await uploadLogoAssociacao(logoFile)
      }
      const payload = { ...values, logo_url: logoPath }

      if (associacaoId) {
        await updateAssociacao(associacaoId, payload)
      } else {
        const created = await createAssociacao(payload)
        setAssociacaoId(created.id)
      }
      setSavedMessage("Dados da associação salvos com sucesso.")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar associação."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">Associação</h1>
      <p className="mt-1 text-slate-500">Dados cadastrais da entidade</p>

      <div className="mt-6 space-y-6">
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
            {logoPreview ? (
              <img src={logoPreview} alt="Logotipo da associação" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">Sem logo</span>
            )}
          </div>
          <div>
            <label className={labelClass}>Logotipo</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="mt-1 block text-sm" />
            <p className="mt-1 text-xs text-slate-400">
              Aparece no menu, na tela de login e nas páginas públicas.
            </p>
          </div>
        </div>

        <Section title="Dados da Associação">
          <Field label="Nome *">
            <input {...register("nome")} className={inputClass} />
            {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome.message}</p>}
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

        <Section title="Diretoria">
          <Field label="Presidente">
            <Controller
              control={control}
              name="presidente_id"
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

          <Field label="VP Financeiro">
            <Controller
              control={control}
              name="vp_financeiro_id"
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

          <Field label="VP Operações">
            <Controller
              control={control}
              name="vp_operacoes_id"
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
        </Section>

        <Section title="Valor da Associação">
          <Field label="Pessoa Física (R$) *">
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("valor_pessoa_fisica")}
              className={inputClass}
            />
            {errors.valor_pessoa_fisica && (
              <p className="mt-1 text-xs text-red-600">{errors.valor_pessoa_fisica.message}</p>
            )}
          </Field>

          <Field label="Pessoa Jurídica (R$) *">
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("valor_pessoa_juridica")}
              className={inputClass}
            />
            {errors.valor_pessoa_juridica && (
              <p className="mt-1 text-xs text-red-600">{errors.valor_pessoa_juridica.message}</p>
            )}
          </Field>
        </Section>

        {associacaoId && <VicePresidenciasManager associacaoId={associacaoId} />}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}
        {savedMessage && <p className="text-sm text-green-700">{savedMessage}</p>}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
          >
            {isSubmitting ? "Salvando..." : "Salvar Associação"}
          </button>
        </div>
      </div>
    </div>
  )
}
