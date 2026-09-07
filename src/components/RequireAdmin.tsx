import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../lib/auth-context"

export function RequireAdmin() {
  const { escopo } = useAuth()

  if (!escopo?.is_admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
