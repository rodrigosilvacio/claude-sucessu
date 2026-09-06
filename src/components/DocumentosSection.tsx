import { useEffect, useRef, useState } from "react"
import { Download, FileText, Trash2, Upload } from "lucide-react"
import { deleteDocumento, getDocumentoUrl, listDocumentos, uploadDocumento } from "../lib/documentos"
import type { Documento, EntidadeDocumento } from "../types/documento"

type DocumentosSectionProps = {
  entidadeTipo: EntidadeDocumento
  entidadeId: string
  associacaoId: string
}

function formatTamanho(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentosSection({ entidadeTipo, entidadeId, associacaoId }: DocumentosSectionProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function carregar() {
    setLoading(true)
    listDocumentos(entidadeTipo, entidadeId)
      .then(setDocumentos)
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar documentos."))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidadeTipo, entidadeId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadDocumento(entidadeTipo, entidadeId, associacaoId, file)
      carregar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar documento.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDownload(doc: Documento) {
    const url = await getDocumentoUrl(doc.storage_path)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  async function handleDelete(doc: Documento) {
    if (!window.confirm(`Excluir o documento "${doc.nome_arquivo}"?`)) return
    try {
      await deleteDocumento(doc.id, doc.storage_path)
      setDocumentos((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir documento.")
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-navy-900">Documentos</h2>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
          <Upload size={14} />
          {uploading ? "Enviando..." : "Enviar documento"}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-slate-400">Carregando...</p>}
        {!loading && documentos.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum documento anexado ainda.</p>
        )}
        {documentos.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={16} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-navy-900">{doc.nome_arquivo}</p>
                <p className="text-xs text-slate-400">
                  {formatTamanho(doc.tamanho)} · {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => handleDownload(doc)}
                aria-label={`Baixar ${doc.nome_arquivo}`}
                className="text-slate-400 hover:text-brand-blue-600"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleDelete(doc)}
                aria-label={`Excluir ${doc.nome_arquivo}`}
                className="text-slate-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
