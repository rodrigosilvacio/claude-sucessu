import { useEffect, useState } from "react"
import { UserRound } from "lucide-react"
import { getFotoUrl } from "../lib/associados"

type AssociadoAvatarProps = {
  fotoPath: string | null
  nome: string
  size?: number
}

export function AssociadoAvatar({ fotoPath, nome, size = 36 }: AssociadoAvatarProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!fotoPath) {
      setUrl(null)
      return
    }
    getFotoUrl(fotoPath).then((signedUrl) => {
      if (active) setUrl(signedUrl)
    })
    return () => {
      active = false
    }
  }, [fotoPath])

  const style = { width: size, height: size }

  if (url) {
    return (
      <img
        src={url}
        alt={nome}
        style={style}
        className="rounded-full object-cover ring-1 ring-slate-200"
      />
    )
  }

  return (
    <div
      style={style}
      className="flex items-center justify-center rounded-full bg-brand-navy-900/10 text-brand-navy-900"
    >
      <UserRound size={size * 0.55} strokeWidth={1.75} />
    </div>
  )
}
