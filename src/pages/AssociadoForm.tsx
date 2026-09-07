import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { UserRound } from "lucide-react"
import {
  associadoSchema,
  type AssociadoFormValues,
  type AssociadoFormOutput,
} from "../schemas/associado"
import {
  GENEROS,
  ESTADOS_CIVIS,
  CATEGORIAS_ASSOCIADO,
  TIPOS_PESSOA,
  FORMAS_PAGAMENTO,
  TIPOS_VINCULO,
  ORIGENS_ASSOCIADO,
  STATUS_ASSOCIADO,
  UFS,
} from "../constants/associado-options"
import { formatCPF, formatPhone, formatCEP } from "../lib/format"
import {
  createAssociado,
  deleteAssociado,
  getAssociado,
  listAssociadoOptions,
  updateAssociado,
  uploadFotoAssociado,
  getFotoUrl,
} from "../lib/associados"
import { getAssociacao } from "../lib/associacoes"
import { listVicePresidencias } from "../lib/vicePresidencias"
import { friendlyErrorMessage } from "../lib/errors"
import { Combobox } from "../components/Combobox"
import { DocumentosSection } from "../components/DocumentosSection"
import { useAssociacaoOptions } from "../hooks/useAssociacaoOptions"
import type { AssociadoOption } from "../types/associado"
import type { VicePresidencia } from "../types/vicePresidencia"

const emptyDefaults: AssociadoFormValues = {
  associacao_id: "",
  nome_completo: "",
  rg: "",
  cpf: "",
  data_nascimento: "",
  genero: "",
  estado_civil: "",
  nacionalidade: "Brasileira",
  telefone: "",
  email: "",
  instagram: "",
  cep: "",
  endereco: "",
  numero_endereco: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  profissao: "",
  empresa: "",
  cargo: "",
  formacao_academica: "",
  tipo_pessoa: "Pessoa Física",
  valor_associacao: "100.00",
  forma_pagamento: undefined as unknown as AssociadoFormValues["forma_pagamento"],
  parcelas_cartao: "",
  categoria_associado: undefined as unknown as AssociadoFormValues["categoria_associado"],
  tipo_vinculo: "",
  origem_associado: "",
  indicado_por_id: "",
  data_entrada: "",
  data_aprovacao: "",
  status: "Pendente de Aprovação",
  data_desligamento: "",
  motivo_inativacao: "",
  areas_interesse: [],
  receber_emails: true,
  receber_whatsapp: true,
  aceite_lgpd: false,
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

export function AssociadoForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditing)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [associadoOptions, setAssociadoOptions] = useState<AssociadoOption[]>([])
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [existingFotoPath, setExistingFotoPath] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssociadoFormValues, unknown, AssociadoFormOutput>({
    resolver: zodResolver(associadoSchema),
    defaultValues: emptyDefaults,
  })

  const status = watch("status")
  const showInativacao = status === "Inativo" || status === "Suspenso"
  const associacaoIdValue = watch("associacao_id")
  const formaPagamentoValue = watch("forma_pagamento")

  const indicadoPorOptions = useMemo(
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
    listAssociadoOptions(id).then(setAssociadoOptions)
  }, [id])

  useEffect(() => {
    if (!associacaoIdValue) {
      setVicePresidencias([])
      return
    }
    listVicePresidencias(associacaoIdValue).then(setVicePresidencias)
  }, [associacaoIdValue])

  // Novo associado: já traz o valor de anuidade configurado na Associação (Pessoa Física por padrão).
  useEffect(() => {
    if (isEditing || !associacaoIdValue) return
    getAssociacao(associacaoIdValue).then((associacao) => {
      setValue("valor_associacao", String(associacao.valor_pessoa_fisica))
    })
  }, [associacaoIdValue, isEditing, setValue])

  async function handleTipoPessoaChange(tipo: string) {
    if (!associacaoIdValue) return
    const associacao = await getAssociacao(associacaoIdValue)
    const valor = tipo === "Pessoa Jurídica" ? associacao.valor_pessoa_juridica : associacao.valor_pessoa_fisica
    setValue("valor_associacao", String(valor))
  }

  useEffect(() => {
    if (!id) return
    getAssociado(id)
      .then((associado) => {
        reset({
          ...associado,
          associacao_id: associado.associacao_id ?? "",
          cpf: formatCPF(associado.cpf),
          rg: associado.rg ?? "",
          data_nascimento: associado.data_nascimento ?? "",
          genero: associado.genero ?? "",
          estado_civil: associado.estado_civil ?? "",
          nacionalidade: associado.nacionalidade ?? "",
          instagram: associado.instagram ?? "",
          cep: associado.cep ?? "",
          endereco: associado.endereco ?? "",
          numero_endereco: associado.numero_endereco ?? "",
          complemento: associado.complemento ?? "",
          bairro: associado.bairro ?? "",
          cidade: associado.cidade ?? "",
          estado: associado.estado ?? "",
          profissao: associado.profissao ?? "",
          empresa: associado.empresa ?? "",
          cargo: associado.cargo ?? "",
          formacao_academica: associado.formacao_academica ?? "",
          tipo_vinculo: associado.tipo_vinculo ?? "",
          origem_associado: associado.origem_associado ?? "",
          indicado_por_id: associado.indicado_por_id ?? "",
          data_entrada: associado.data_entrada ?? "",
          data_aprovacao: associado.data_aprovacao ?? "",
          data_desligamento: associado.data_desligamento ?? "",
          motivo_inativacao: associado.motivo_inativacao ?? "",
          observacoes: associado.observacoes ?? "",
          tipo_pessoa: associado.tipo_pessoa as AssociadoFormValues["tipo_pessoa"],
          valor_associacao:
            associado.valor_associacao !== null ? String(associado.valor_associacao) : "",
          forma_pagamento: associado.forma_pagamento as AssociadoFormValues["forma_pagamento"],
          parcelas_cartao:
            associado.parcelas_cartao !== null ? String(associado.parcelas_cartao) : "",
          categoria_associado:
            associado.categoria_associado as AssociadoFormValues["categoria_associado"],
          status: associado.status as AssociadoFormValues["status"],
        })
        setExistingFotoPath(associado.foto_url)
        if (associado.foto_url) {
          getFotoUrl(associado.foto_url).then(setFotoPreview)
        }
      })
      .finally(() => setLoading(false))
  }, [id, reset])

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setFotoFile(file)
    if (file) setFotoPreview(URL.createObjectURL(file))
  }

  async function onSubmit(values: AssociadoFormOutput) {
    setSubmitError(null)
    try {
      let fotoPath = existingFotoPath
      if (fotoFile) {
        fotoPath = await uploadFotoAssociado(fotoFile)
      }

      const payload = { ...values, foto_url: fotoPath }

      if (isEditing && id) {
        await updateAssociado(id, payload)
      } else {
        await createAssociado(payload)
      }
      navigate("/associados")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao salvar associado."))
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm("Tem certeza que deseja excluir este associado? Essa ação não pode ser desfeita.")) return
    try {
      await deleteAssociado(id)
      navigate("/associados")
    } catch (err) {
      setSubmitError(friendlyErrorMessage(err, "Erro ao excluir associado."))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-navy-900">
        {isEditing ? "Editar Associado" : "Novo Associado"}
      </h1>
      <p className="mt-1 text-slate-500">Preencha os dados do associado</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-navy-900/10 text-brand-navy-900">
            {fotoPreview ? (
              <img src={fotoPreview} alt="Foto do associado" className="h-full w-full object-cover" />
            ) : (
              <UserRound size={36} strokeWidth={1.75} />
            )}
          </div>
          <div>
            <label className={labelClass}>Foto</label>
            <input type="file" accept="image/*" onChange={handleFotoChange} className="mt-1 block text-sm" />
          </div>
        </div>

        <Section title="Associação">
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
        </Section>

        <Section title="Dados Pessoais">
          <Field label="Nome Completo *">
            <input {...register("nome_completo")} className={inputClass} />
            {errors.nome_completo && (
              <p className="mt-1 text-xs text-red-600">{errors.nome_completo.message}</p>
            )}
          </Field>

          <Field label="RG">
            <input {...register("rg")} className={inputClass} />
          </Field>

          <Field label="CPF *">
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(formatCPF(e.target.value))}
                  className={inputClass}
                  placeholder="000.000.000-00"
                />
              )}
            />
            {errors.cpf && <p className="mt-1 text-xs text-red-600">{errors.cpf.message}</p>}
          </Field>

          <Field label="Data de Nascimento">
            <input type="date" {...register("data_nascimento")} className={inputClass} />
          </Field>

          <Field label="Gênero">
            <select {...register("genero")} className={inputClass}>
              <option value="">Selecione</option>
              {GENEROS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Estado Civil">
            <select {...register("estado_civil")} className={inputClass}>
              <option value="">Selecione</option>
              {ESTADOS_CIVIS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nacionalidade">
            <input {...register("nacionalidade")} className={inputClass} />
          </Field>
        </Section>

        <Section title="Contato & Endereço">
          <Field label="Telefone *">
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
            {errors.telefone && <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>}
          </Field>

          <Field label="E-mail *">
            <input type="email" {...register("email")} className={inputClass} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </Field>

          <Field label="Instagram">
            <input {...register("instagram")} className={inputClass} placeholder="@usuario" />
          </Field>

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

        <Section title="Profissional">
          <Field label="Profissão">
            <input {...register("profissao")} className={inputClass} />
          </Field>

          <Field label="Empresa">
            <input {...register("empresa")} className={inputClass} />
          </Field>

          <Field label="Cargo">
            <input {...register("cargo")} className={inputClass} />
          </Field>

          <Field label="Formação Acadêmica">
            <input {...register("formacao_academica")} className={inputClass} />
          </Field>
        </Section>

        <Section title="Vínculo Associativo">
          <Field label="Tipo de Pessoa *">
            <Controller
              control={control}
              name="tipo_pessoa"
              render={({ field }) => (
                <select
                  {...field}
                  className={inputClass}
                  onChange={(e) => {
                    field.onChange(e)
                    handleTipoPessoaChange(e.target.value)
                  }}
                >
                  {TIPOS_PESSOA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              )}
            />
          </Field>

          <Field label="Valor da Anuidade (R$)">
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("valor_associacao")}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-400">
              Preenchido a partir do valor configurado em Associação — gera automaticamente a(s)
              conta(s) a receber assim que o associado for aprovado.
            </p>
          </Field>

          <Field label="Forma de Pagamento *">
            <select {...register("forma_pagamento")} className={inputClass}>
              <option value="">Selecione</option>
              {FORMAS_PAGAMENTO.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errors.forma_pagamento && (
              <p className="mt-1 text-xs text-red-600">{errors.forma_pagamento.message}</p>
            )}
          </Field>

          {formaPagamentoValue === "Cartão" && (
            <Field label="Em Quantas Vezes *">
              <input
                type="number"
                min="1"
                max="12"
                {...register("parcelas_cartao")}
                className={inputClass}
              />
              {errors.parcelas_cartao && (
                <p className="mt-1 text-xs text-red-600">{errors.parcelas_cartao.message}</p>
              )}
            </Field>
          )}

          <Field label="Categoria do Associado *">
            <select {...register("categoria_associado")} className={inputClass}>
              <option value="">Selecione</option>
              {CATEGORIAS_ASSOCIADO.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.categoria_associado && (
              <p className="mt-1 text-xs text-red-600">{errors.categoria_associado.message}</p>
            )}
          </Field>

          <Field label="Tipo de Vínculo">
            <select {...register("tipo_vinculo")} className={inputClass}>
              <option value="">Selecione</option>
              {TIPOS_VINCULO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Origem do Associado">
            <select {...register("origem_associado")} className={inputClass}>
              <option value="">Selecione</option>
              {ORIGENS_ASSOCIADO.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Indicado por">
            <Controller
              control={control}
              name="indicado_por_id"
              render={({ field }) => (
                <Combobox
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={indicadoPorOptions}
                  placeholder="Buscar associado por nome ou número..."
                  emptyMessage="Nenhum associado encontrado"
                />
              )}
            />
          </Field>

          <Field label="Data de Entrada">
            <input type="date" {...register("data_entrada")} className={inputClass} />
          </Field>

          <Field label="Data da Aprovação">
            <input type="date" {...register("data_aprovacao")} className={inputClass} />
          </Field>

          <Field label="Status *">
            <select {...register("status")} className={inputClass}>
              {STATUS_ASSOCIADO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          {showInativacao && (
            <>
              <Field label="Data de Desligamento">
                <input type="date" {...register("data_desligamento")} className={inputClass} />
              </Field>
              <Field label="Motivo da Inativação">
                <input {...register("motivo_inativacao")} className={inputClass} />
              </Field>
            </>
          )}
        </Section>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-navy-900">
            Áreas de Interesse (VPs)
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {vicePresidencias.length === 0 && (
              <p className="text-sm text-slate-400">
                Nenhuma Vice-Presidência cadastrada. Cadastre em Configuração &gt; Associação.
              </p>
            )}
            {vicePresidencias.map((vp) => (
              <label key={vp.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" value={vp.id} {...register("areas_interesse")} />
                {vp.nome}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-brand-navy-900">Preferências</h2>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("receber_emails")} />
              Receber e-mails institucionais?
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("receber_whatsapp")} />
              Receber mensagens por WhatsApp?
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" {...register("aceite_lgpd")} />
              Aceite dos termos de uso e política de privacidade (LGPD)
            </label>
          </div>

          <Field label="Observações">
            <textarea {...register("observacoes")} rows={3} className={inputClass} />
          </Field>
        </div>

        {isEditing && id && associacaoIdValue && (
          <DocumentosSection entidadeTipo="associado" entidadeId={id} associacaoId={associacaoIdValue} />
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
              onClick={() => navigate("/associados")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-brand-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar Associado"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
