import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { Plus, Search, Mail, MessageCircle, Camera, Briefcase, Calendar } from "lucide-react"
import { listConteudos, updateConteudoStatus } from "../lib/conteudos"
import { listVicePresidencias } from "../lib/vicePresidencias"
import type { ConteudoComRelacoes, StatusConteudo } from "../types/conteudo"
import { AssociadoAvatar } from "../components/AssociadoAvatar"
import { formatDateBR } from "../lib/format"
import type { VicePresidencia } from "../types/vicePresidencia"

const COLUNAS: { status: StatusConteudo; titulo: string }[] = [
  { status: "A Fazer", titulo: "A Fazer" },
  { status: "Em Andamento", titulo: "Em Andamento" },
  { status: "Concluído", titulo: "Concluído" },
  { status: "Arquivado", titulo: "Arquivados" },
]

const meioIcon: Record<string, React.ReactNode> = {
  Email: <Mail size={12} />,
  WhatsApp: <MessageCircle size={12} />,
  Instagram: <Camera size={12} />,
  LinkedIn: <Briefcase size={12} />,
}

const prioridadeColors: Record<string, string> = {
  Baixa: "bg-slate-100 text-slate-600",
  Média: "bg-amber-100 text-amber-700",
  Alta: "bg-red-100 text-red-700",
}

function KanbanCard({ item }: { item: ConteudoComRelacoes }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
      }
    : undefined

  const associado = item.sucesu_voluntarios?.sucesu_associados

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => navigate(`/conteudos/${item.id}/editar`)}
      className={`cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-brand-blue-600">
          {item.sucesu_vice_presidencias?.nome ?? "—"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            prioridadeColors[item.prioridade] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {item.prioridade}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-medium text-brand-navy-900">{item.titulo}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AssociadoAvatar fotoPath={associado?.foto_url ?? null} nome={associado?.nome_completo ?? ""} size={22} />
          <span className="text-xs text-slate-500">{associado?.nome_completo ?? "—"}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          {item.meios.map((meio) => (
            <span key={meio} title={meio}>
              {meioIcon[meio]}
            </span>
          ))}
        </div>
      </div>

      {item.data_esperada_publicacao && (
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={12} />
          {formatDateBR(item.data_esperada_publicacao)}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({
  status,
  titulo,
  items,
}: {
  status: StatusConteudo
  titulo: string
  items: ConteudoComRelacoes[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-slate-50 p-3 transition-colors ${
        isOver ? "border-brand-blue-500 bg-brand-blue-500/5" : "border-slate-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-brand-navy-900">{titulo}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
          {items.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
        {items.map((item) => (
          <KanbanCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
            Nenhum item
          </p>
        )}
      </div>
    </div>
  )
}

export function ConteudosKanban() {
  const [conteudos, setConteudos] = useState<ConteudoComRelacoes[]>([])
  const [vicePresidencias, setVicePresidencias] = useState<VicePresidencia[]>([])
  const [vpFilter, setVpFilter] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    listConteudos()
      .then(setConteudos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    listVicePresidencias().then(setVicePresidencias)
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return conteudos.filter((c) => {
      const matchesVp = !vpFilter || c.vice_presidencia_id === vpFilter
      const matchesTerm = !term || c.titulo.toLowerCase().includes(term)
      return matchesVp && matchesTerm
    })
  }, [conteudos, vpFilter, search])

  const byStatus = useMemo(() => {
    const map: Record<StatusConteudo, ConteudoComRelacoes[]> = {
      "A Fazer": [],
      "Em Andamento": [],
      Concluído: [],
      Arquivado: [],
    }
    for (const item of filtered) map[item.status].push(item)
    return map
  }, [filtered])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const newStatus = over.id as StatusConteudo
    const item = conteudos.find((c) => c.id === active.id)
    if (!item || item.status === newStatus) return

    const previousStatus = item.status
    setConteudos((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, status: newStatus } : c)),
    )

    try {
      await updateConteudoStatus(item.id, newStatus)
    } catch {
      setConteudos((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, status: previousStatus } : c)),
      )
      setError("Erro ao mover o card. Tente novamente.")
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy-900">Conteúdos</h1>
          <p className="mt-1 text-slate-500">
            Solicitações de conteúdo das Vice-Presidências — itens concluídos são arquivados
            automaticamente após 30 dias
          </p>
        </div>
        <Link
          to="/conteudos/novo"
          className="flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
        >
          <Plus size={18} />
          Nova Solicitação
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por título..."
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={vpFilter}
          onChange={(e) => setVpFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-blue-500 focus:outline-none"
        >
          <option value="">Todas as Vice-Presidências</option>
          {vicePresidencias.map((vp) => (
            <option key={vp.id} value={vp.id}>
              {vp.nome}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-400">Carregando...</p>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="mt-4 flex flex-1 gap-4 overflow-x-auto pb-4">
            {COLUNAS.map((coluna) => (
              <KanbanColumn
                key={coluna.status}
                status={coluna.status}
                titulo={coluna.titulo}
                items={byStatus[coluna.status]}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  )
}
