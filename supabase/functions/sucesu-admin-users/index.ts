import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Domínio usado para gerar um e-mail interno quando o admin não informa um
// e-mail de contato para o usuário — o Supabase Auth exige um e-mail único
// por conta mesmo quando o login real é feito por "usuário".
const EMAIL_INTERNO_DOMINIO = "sucesusp.local"

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function normalizarUsuario(valor: unknown): string | null {
  if (typeof valor !== "string") return null
  const normalizado = valor.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, ".")
  return normalizado.length > 0 ? normalizado : null
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Não autenticado" }, 401)

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    // O gateway do Supabase já valida o JWT (verify_jwt=true nesta função);
    // isso confirma que o token corresponde a um usuário de fato.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData.user) return json({ error: "Sessão inválida" }, 401)

    const admin = createClient(supabaseUrl, serviceKey)

    // Este projeto Supabase é compartilhado com outros apps do usuário — o auth.users
    // tem contas de todos eles. sucesu_usuarios é o escopo de quem pertence a ESTE app.
    const { data: escopo, error: escopoError } = await admin
      .from("sucesu_usuarios")
      .select("id, nome, usuario, criado_em, associacao_id, is_admin, papel")
    if (escopoError) throw escopoError

    const callerScope = escopo.find((u) => u.id === callerData.user.id)
    const idsEscopo = new Set(escopo.map((u) => u.id as string))

    if (!idsEscopo.has(callerData.user.id)) {
      return json({ error: "Esta conta não tem acesso ao SUCESU SP Connect" }, 403)
    }

    // A tela de Usuários é uma tela de Configuração: só admin gerencia contas.
    if (!callerScope?.is_admin) {
      return json({ error: "Apenas administradores podem gerenciar usuários" }, 403)
    }

    const body = await req.json()
    const { action } = body

    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
      if (error) throw error

      const escopoPorId = new Map(escopo.map((u) => [u.id as string, u]))
      const users = data.users
        .filter((u) => idsEscopo.has(u.id))
        .map((u) => {
          const s = escopoPorId.get(u.id)
          return {
            id: u.id,
            email: u.email,
            usuario: s?.usuario ?? null,
            nome: s?.nome ?? null,
            associacao_id: s?.associacao_id ?? null,
            is_admin: s?.is_admin ?? false,
            papel: s?.papel ?? "gestor",
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            confirmed_at: u.confirmed_at,
          }
        })
      return json({ users })
    }

    if (action === "update_scope") {
      const { userId, associacaoId, papel } = body
      if (!userId || typeof userId !== "string") return json({ error: "ID do usuário é obrigatório" }, 400)
      if (papel !== "admin" && papel !== "gestor") {
        return json({ error: "Papel inválido" }, 400)
      }

      const { error } = await admin
        .from("sucesu_usuarios")
        .update({
          associacao_id: associacaoId ?? null,
          is_admin: papel === "admin",
          papel,
        })
        .eq("id", userId)
      if (error) throw error

      return json({ ok: true })
    }

    if (action === "invite") {
      const { nome, email, password, associacaoId, papel } = body
      const usuario = normalizarUsuario(body.usuario)
      if (!usuario) return json({ error: "Informe um nome de usuário válido" }, 400)
      if (papel !== "admin" && papel !== "gestor") return json({ error: "Papel inválido" }, 400)
      if (!password || typeof password !== "string" || password.length < 6) {
        return json({ error: "Defina uma senha com pelo menos 6 caracteres" }, 400)
      }

      const usuarioEmUso = escopo.some((u) => (u.usuario as string | null)?.toLowerCase() === usuario)
      if (usuarioEmUso) return json({ error: "Esse nome de usuário já está em uso" }, 400)

      const emailFinal =
        typeof email === "string" && email.trim() ? email.trim() : `${usuario}@${EMAIL_INTERNO_DOMINIO}`

      // Se já existe uma conta com esse e-mail (comum neste projeto compartilhado,
      // usado por vários dos seus apps), só adiciona ela ao escopo do SUCESU SP
      // Connect — e NUNCA mexe na senha dela, já que a mesma conta pode ser usada
      // para logar em outro app deste mesmo projeto.
      const { data: todosUsuarios, error: listError } = await admin.auth.admin.listUsers({
        perPage: 1000,
      })
      if (listError) throw listError
      const existente = todosUsuarios.users.find(
        (u) => u.email?.toLowerCase() === emailFinal.toLowerCase(),
      )

      let userId: string
      let contaExistente = false

      if (existente) {
        userId = existente.id
        contaExistente = true
      } else {
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email: emailFinal,
          password,
          email_confirm: true,
        })
        if (createError) throw createError
        userId = created.user.id
      }

      const { error: upsertError } = await admin.from("sucesu_usuarios").upsert({
        id: userId,
        usuario,
        nome: nome ?? null,
        associacao_id: associacaoId ?? null,
        is_admin: papel === "admin",
        papel,
      })
      if (upsertError) throw upsertError

      return json({ user: { id: userId, usuario, email: emailFinal }, contaExistente })
    }

    if (action === "set_password") {
      const { userId, password } = body
      if (!userId || typeof userId !== "string") return json({ error: "ID do usuário é obrigatório" }, 400)
      if (!password || typeof password !== "string" || password.length < 6) {
        return json({ error: "A senha deve ter pelo menos 6 caracteres" }, 400)
      }
      if (!idsEscopo.has(userId)) {
        return json({ error: "Usuário fora do escopo do SUCESU SP Connect" }, 403)
      }

      const { error } = await admin.auth.admin.updateUserById(userId, { password })
      if (error) throw error

      return json({ ok: true })
    }

    if (action === "revoke") {
      // Remove o acesso desta pessoa ao SUCESU SP Connect. NUNCA apaga a conta do
      // auth.users — ela pode ser usada por outros apps deste mesmo projeto.
      const { userId } = body
      if (!userId || typeof userId !== "string") return json({ error: "ID do usuário é obrigatório" }, 400)

      if (userId === callerData.user.id) {
        return json({ error: "Você não pode remover seu próprio acesso por aqui" }, 400)
      }

      const { error } = await admin.from("sucesu_usuarios").delete().eq("id", userId)
      if (error) throw error

      return json({ ok: true })
    }

    return json({ error: "Ação inválida" }, 400)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno"
    return json({ error: message }, 500)
  }
})
