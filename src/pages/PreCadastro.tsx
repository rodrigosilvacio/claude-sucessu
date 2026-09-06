import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2 } from "lucide-react"
import { Logo } from "../components/Logo"
import { formatCPF, formatPhone } from "../lib/format"
import { submitPreCadastro } from "../lib/associados"
import { UFS } from "../constants/associado-options"
import {
  preCadastroSchema,
  type PreCadastroFormValues,
  type PreCadastroFormOutput,
} from "../schemas/pre-cadastro"

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
const labelClass = "text-sm font-medium text-brand-navy-900"

export function PreCadastro() {
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PreCadastroFormValues, unknown, PreCadastroFormOutput>({
    resolver: zodResolver(preCadastroSchema),
    defaultValues: {
      nome_completo: "",
      cpf: "",
      email: "",
      telefone: "",
      data_nascimento: "",
      empresa: "",
      profissao: "",
      cidade: "",
      estado: "",
      instagram: "",
      aceite_lgpd: false,
    },
  })

  async function onSubmit(values: PreCadastroFormOutput) {
    setSubmitError(null)
    try {
      await submitPreCadastro(values)
      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar cadastro."
      setSubmitError(
        message.includes("duplicate") || message.includes("unique")
          ? "Já existe um cadastro com esse CPF ou e-mail."
          : message,
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 py-10">
      <div className="rounded-2xl bg-white px-8 py-5 shadow-sm">
        <Logo />
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={40} className="text-green-600" />
            <h1 className="text-xl font-bold text-brand-navy-900">Cadastro enviado!</h1>
            <p className="text-slate-500">
              Recebemos seus dados. Nossa equipe vai analisar e aprovar seu cadastro em breve.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-center text-2xl font-bold text-brand-navy-900">
              Pré-Cadastro de Associado
            </h1>
            <p className="mt-2 text-center text-slate-500">
              Preencha seus dados para solicitar associação à SUCESU SP
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Nome Completo *</span>
                <input {...register("nome_completo")} className={inputClass} />
                {errors.nome_completo && (
                  <p className="mt-1 text-xs text-red-600">{errors.nome_completo.message}</p>
                )}
              </label>

              <label className="block">
                <span className={labelClass}>CPF *</span>
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
              </label>

              <label className="block">
                <span className={labelClass}>E-mail *</span>
                <input type="email" {...register("email")} className={inputClass} />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </label>

              <label className="block">
                <span className={labelClass}>Telefone *</span>
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
                {errors.telefone && (
                  <p className="mt-1 text-xs text-red-600">{errors.telefone.message}</p>
                )}
              </label>

              <label className="block">
                <span className={labelClass}>Data de Nascimento</span>
                <input type="date" {...register("data_nascimento")} className={inputClass} />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelClass}>Empresa</span>
                  <input {...register("empresa")} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Profissão</span>
                  <input {...register("profissao")} className={inputClass} />
                </label>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-4">
                <label className="block">
                  <span className={labelClass}>Cidade</span>
                  <input {...register("cidade")} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>UF</span>
                  <select {...register("estado")} className={inputClass}>
                    <option value="">–</option>
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={labelClass}>Instagram</span>
                <input {...register("instagram")} className={inputClass} placeholder="@usuario" />
              </label>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5" {...register("aceite_lgpd")} />
                Aceito os termos de uso e a política de privacidade (LGPD) da SUCESU SP.
              </label>
              {errors.aceite_lgpd && (
                <p className="text-xs text-red-600">{errors.aceite_lgpd.message}</p>
              )}

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : "Enviar Pré-Cadastro"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
