import { useEffect, useState } from "react"
import staticLogo from "../assets/sucesu-logo.png"
import { supabase } from "../lib/supabase"

const LOGO_BUCKET = "sucesu-logos"

type LogoProps = {
  variant?: "dark" | "light"
  className?: string
}

export function Logo({ variant = "dark", className = "" }: LogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [nome, setNome] = useState("SUCESU SP")

  useEffect(() => {
    let active = true
    Promise.resolve(supabase.rpc("sucesu_associacao_publica"))
      .then(({ data }) => {
        if (!active) return
        const associacao = data?.[0]
        if (associacao?.nome) setNome(associacao.nome)
        if (associacao?.logo_url) {
          const { data: publicUrl } = supabase.storage
            .from(LOGO_BUCKET)
            .getPublicUrl(associacao.logo_url)
          setLogoUrl(publicUrl.publicUrl)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoUrl ?? staticLogo}
        alt={nome}
        className={`h-8 w-auto ${variant === "light" ? "rounded-md bg-white px-2 py-1.5" : ""}`}
      />
    </div>
  )
}
