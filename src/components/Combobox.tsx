import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, X } from "lucide-react"

export type ComboboxOption = {
  value: string
  label: string
  sublabel?: string
}

type ComboboxProps = {
  value: string
  onChange: (value: string) => void
  options: ComboboxOption[]
  placeholder?: string
  emptyMessage?: string
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(term) || o.sublabel?.toLowerCase().includes(term),
    )
  }, [options, query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSelect(option: ComboboxOption) {
    onChange(option.value)
    setOpen(false)
    setQuery("")
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange("")
    setQuery("")
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setOpen(true)}
        className="mt-1 flex w-full cursor-text items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm focus-within:border-brand-blue-500"
      >
        <input
          value={open ? query : (selected?.label ?? "")}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected ? selected.label : placeholder}
          className="w-full outline-none"
        />
        {selected && !open && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar seleção"
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown size={14} className="shrink-0 text-slate-400" />
      </div>

      {open && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</li>
          )}
          {filtered.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => handleSelect(option)}
                className={`flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                  option.value === value ? "bg-brand-blue-500/10" : ""
                }`}
              >
                <span className="text-brand-navy-900">{option.label}</span>
                {option.sublabel && <span className="text-xs text-slate-400">{option.sublabel}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
