import { useEffect, useMemo, useRef, useState } from "react"
import { listAssociacaoOptions } from "../lib/associacoes"
import type { AssociacaoOption } from "../types/associacao"
import type { ComboboxOption } from "../components/Combobox"

type UseAssociacaoOptionsArgs = {
  autoSelect?: boolean
  onAutoSelect?: (id: string) => void
}

export function useAssociacaoOptions({ autoSelect = false, onAutoSelect }: UseAssociacaoOptionsArgs = {}) {
  const [associacaoOptions, setAssociacaoOptions] = useState<AssociacaoOption[]>([])
  const onAutoSelectRef = useRef(onAutoSelect)

  useEffect(() => {
    onAutoSelectRef.current = onAutoSelect
  })

  useEffect(() => {
    listAssociacaoOptions().then((options) => {
      setAssociacaoOptions(options)
      if (autoSelect && options.length === 1) {
        onAutoSelectRef.current?.(options[0].id)
      }
    })
  }, [autoSelect])

  const associacaoComboOptions = useMemo<ComboboxOption[]>(
    () => associacaoOptions.map((a) => ({ value: a.id, label: a.nome })),
    [associacaoOptions],
  )

  return { associacaoOptions, associacaoComboOptions }
}
