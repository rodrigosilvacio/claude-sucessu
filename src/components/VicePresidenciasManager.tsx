import { useEffect, useState } from "react"
import { Plus, X } from "lucide-react"
import {
  createVicePresidencia,
  deleteVicePresidencia,
  listVicePresidencias,
} from "../lib/vicePresidencias"
import type { VicePresidencia } from "../types/vicePresidencia"

export function VicePresidenciasManager({ associacaoId }: { associacaoId: string }) {
  const [vps, setVps] = useState<VicePresidencia[]>([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listVicePresidencias(associacaoId)
      .then(setVps)
      .finally(() => setLoading(false))
  }, [associacaoId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      const created = await createVicePresidencia(associacaoId, novoNome.trim())
      setVps((prev) => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)))
      setNovoNome("")
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("duplicate")
          ? "Já existe uma Vice-Presidência com esse nome."
          : "Erro ao adicionar Vice-Presidência.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(id: string) {
    setError(null)
    try {
      await deleteVicePresidencia(id)
      setVps((prev) => prev.filter((vp) => vp.id !== id))
    } catch {
      setError("Não é possível remover: essa Vice-Presidência já está em uso em Voluntários ou Conteúdos.")
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-brand-navy-900">Vice-Presidências</h2>
      <p className="mt-1 text-sm text-slate-500">
        Cadastre as Vice-Presidências desta associação — usadas em Voluntários e Conteúdos.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {vps.length === 0 && (
            <p className="text-sm text-slate-400">Nenhuma Vice-Presidência cadastrada ainda.</p>
          )}
          {vps.map((vp) => (
            <span
              key={vp.id}
              className="flex items-center gap-2 rounded-full bg-brand-navy-900/5 px-3 py-1.5 text-sm text-brand-navy-900"
            >
              {vp.nome}
              <button
                type="button"
                onClick={() => handleRemove(vp.id)}
                aria-label={`Remover ${vp.nome}`}
                className="text-slate-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          placeholder="Nova Vice-Presidência (ex: Jurídico)"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-lg border border-brand-blue-600 px-3 py-2 text-sm font-medium text-brand-blue-600 hover:bg-brand-blue-500/10 disabled:opacity-60"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
