import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../lib/auth-context"

export function RequireFinanceiro() {
  const { escopo } = useAuth()

  const podeAcessar = escopo?.is_admin || escopo?.papel === "financeiro"

  if (!podeAcessar) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
