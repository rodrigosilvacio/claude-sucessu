import { useState } from "react"
import { Modal } from "./Modal"
import { PasswordField } from "./PasswordField"

type SetPasswordDialogProps = {
  open: boolean
  usuarioNome: string
  onConfirm: (senha: string) => Promise<void>
  onCancel: () => void
}

export function SetPasswordDialog({
  open,
  usuarioNome,
  onConfirm,
  onCancel,
}: SetPasswordDialogProps) {
  const [senha, setSenha] = useState("")
  const [salvando, setSalvando] = useState(false)

  const valida = senha.trim().length >= 6

  async function handleConfirm() {
    if (!valida) return
    setSalvando(true)
    try {
      await onConfirm(senha)
      setSenha("")
    } finally {
      setSalvando(false)
    }
  }

  function handleCancel() {
    setSenha("")
    onCancel()
  }

  return (
    <Modal open={open} onClose={handleCancel} title={`Definir nova senha para "${usuarioNome}"`}>
      <p className="text-sm text-slate-500">
        Se essa conta usa o mesmo e-mail em outro sistema seu, a senha muda lá também.
      </p>
      <div className="mt-4">
        <label htmlFor="nova-senha-modal" className="text-sm font-medium text-brand-navy-900">
          Nova senha
        </label>
        <PasswordField
          id="nova-senha-modal"
          value={senha}
          onChange={setSenha}
          placeholder="Mínimo 6 caracteres"
          className="mt-1"
        />
        {senha.length > 0 && !valida && (
          <p className="mt-1 text-xs text-red-600">A senha precisa ter pelo menos 6 caracteres.</p>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!valida || salvando}
          className="rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy-800 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar senha"}
        </button>
      </div>
    </Modal>
  )
}
