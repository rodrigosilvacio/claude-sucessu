export type Usuario = {
  id: string
  email: string | null
  usuario: string
  nome: string | null
  associacao_id: string | null
  is_admin: boolean
  papel: "admin" | "gestor"
  created_at: string
  last_sign_in_at: string | null
  confirmed_at: string | null
}
