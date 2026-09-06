import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { Logo } from "../components/Logo"
import { getFormularioPublico, responderFormulario } from "../lib/formularios"
import type { FormularioPublico as FormularioPublicoType } from "../types/formulario"

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
const labelClass = "text-sm font-medium text-brand-navy-900"

export function FormularioPublico() {
  const { slug } = useParams()
  const [formulario, setFormulario] = useState<FormularioPublicoType | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [respostas, setRespostas] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!slug) return
    getFormularioPublico(slug)
      .then((data) => {
        if (!data) setNotFound(true)
        else setFormulario(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  function updateResposta(perguntaId: string, value: string | string[]) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: value }))
  }

  function toggleCheckbox(perguntaId: string, opcao: string, checked: boolean) {
    setRespostas((prev) => {
      const atual = Array.isArray(prev[perguntaId]) ? (prev[perguntaId] as string[]) : []
      const nova = checked ? [...atual, opcao] : atual.filter((o) => o !== opcao)
      return { ...prev, [perguntaId]: nova }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!slug || !formulario) return

    setSubmitError(null)

    if (!nome.trim()) {
      setSubmitError("Informe seu nome.")
      return
    }

    for (const pergunta of formulario.perguntas) {
      if (!pergunta.obrigatoria) continue
      const valor = respostas[pergunta.id]
      const vazio = !valor || (Array.isArray(valor) && valor.length === 0)
      if (vazio) {
        setSubmitError(`Responda: "${pergunta.texto}"`)
        return
      }
    }

    setSubmitting(true)
    try {
      // As perguntas usam o texto como chave (mais legível ao rever respostas depois).
      const respostasComTexto = Object.fromEntries(
        formulario.perguntas
          .filter((p) => respostas[p.id] !== undefined)
          .map((p) => [p.texto, respostas[p.id]]),
      )
      await responderFormulario(slug, nome, email || null, respostasComTexto)
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar respostas.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4 py-10">
      <div className="rounded-2xl bg-white px-8 py-5 shadow-sm">
        <Logo />
      </div>

      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm">
        {loading && <p className="text-center text-sm text-slate-400">Carregando...</p>}

        {!loading && notFound && (
          <div className="py-6 text-center">
            <h1 className="text-xl font-bold text-brand-navy-900">Formulário não encontrado</h1>
            <p className="mt-2 text-slate-500">Verifique se o link está correto.</p>
          </div>
        )}

        {!loading && formulario && submitted && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 size={40} className="text-green-600" />
            <h1 className="text-xl font-bold text-brand-navy-900">Respostas enviadas!</h1>
            <p className="text-slate-500">Obrigado por participar.</p>
          </div>
        )}

        {!loading && formulario && !submitted && formulario.status !== "Publicado" && (
          <p className="py-6 text-center text-sm text-slate-500">
            Este formulário não está aceitando respostas no momento.
          </p>
        )}

        {!loading && formulario && !submitted && formulario.status === "Publicado" && (
          <>
            <h1 className="text-center text-2xl font-bold text-brand-navy-900">
              {formulario.titulo}
            </h1>
            {formulario.descricao && (
              <p className="mt-2 text-center text-slate-500">{formulario.descricao}</p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className={labelClass}>Nome Completo *</span>
                <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
              </label>

              <label className="block">
                <span className={labelClass}>E-mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>

              {formulario.perguntas.map((pergunta) => (
                <div key={pergunta.id}>
                  <span className={labelClass}>
                    {pergunta.texto} {pergunta.obrigatoria && "*"}
                  </span>

                  {pergunta.tipo === "Texto Curto" && (
                    <input
                      className={inputClass}
                      onChange={(e) => updateResposta(pergunta.id, e.target.value)}
                    />
                  )}

                  {pergunta.tipo === "Texto Longo" && (
                    <textarea
                      rows={3}
                      className={inputClass}
                      onChange={(e) => updateResposta(pergunta.id, e.target.value)}
                    />
                  )}

                  {pergunta.tipo === "Múltipla Escolha" && (
                    <div className="mt-2 space-y-1.5">
                      {pergunta.opcoes.map((opcao) => (
                        <label key={opcao} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="radio"
                            name={pergunta.id}
                            value={opcao}
                            onChange={(e) => updateResposta(pergunta.id, e.target.value)}
                          />
                          {opcao}
                        </label>
                      ))}
                    </div>
                  )}

                  {pergunta.tipo === "Múltiplas Seleções" && (
                    <div className="mt-2 space-y-1.5">
                      {pergunta.opcoes.map((opcao) => (
                        <label key={opcao} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            onChange={(e) => toggleCheckbox(pergunta.id, opcao, e.target.checked)}
                          />
                          {opcao}
                        </label>
                      ))}
                    </div>
                  )}

                  {pergunta.tipo === "Escala (1-5)" && (
                    <div className="mt-2 flex gap-3">
                      {["1", "2", "3", "4", "5"].map((n) => (
                        <label key={n} className="flex flex-col items-center gap-1 text-sm text-slate-700">
                          <input
                            type="radio"
                            name={pergunta.id}
                            value={n}
                            onChange={(e) => updateResposta(pergunta.id, e.target.value)}
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800 disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar Respostas"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
