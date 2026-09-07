import { useState } from "react"
import { Check, Copy, Eye, EyeOff, Wand2 } from "lucide-react"

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"

function gerarSenhaAleatoria(tamanho = 10) {
  const bytes = new Uint32Array(tamanho)
  crypto.getRandomValues(bytes)
  let senha = ""
  for (let i = 0; i < tamanho; i++) senha += CHARS[bytes[i] % CHARS.length]
  return senha
}

type PasswordFieldProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  required,
  className,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro) — ignora silenciosamente
    }
  }

  function handleGerar() {
    onChange(gerarSenhaAleatoria())
    setVisible(true)
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        required={required}
        autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-[86px] text-sm focus:border-brand-blue-500 focus:outline-none"
      />
      <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
        <button
          type="button"
          onClick={handleGerar}
          title="Gerar senha"
          className="rounded p-1.5 text-slate-400 hover:text-brand-blue-600"
        >
          <Wand2 size={15} />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar senha"
          disabled={!value}
          className="rounded p-1.5 text-slate-400 hover:text-brand-blue-600 disabled:opacity-40"
        >
          {copied ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
        </button>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          title={visible ? "Ocultar senha" : "Mostrar senha"}
          className="rounded p-1.5 text-slate-400 hover:text-brand-blue-600"
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}
