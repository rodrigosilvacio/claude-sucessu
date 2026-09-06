import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
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
    // tem contas de todos eles. sucesu_usuarios é o escopo de quem pertence a ESTE app;
    // nunca listamos, convidamos duplicado ou revogamos fora desse escopo.
    const { data: escopo, error: escopoError } = await admin
      .from("sucesu_usuarios")
      .select("id, nome, criado_em, associacao_id, is_admin, papel")
    if (escopoError) throw escopoError

    const callerScope = escopo.find((u) => u.id === callerData.user.id)

    const idsEscopo = new Set(escopo.map((u) => u.id as string))

    // O próprio chamador precisa estar no escopo do SUCESU SP Connect para gerenciar usuários dele.
    if (!idsEscopo.has(callerData.user.id)) {
      return json({ error: "Esta conta não tem acesso ao SUCESU SP Connect" }, 403)
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
      // Só admin pode alterar a associação/permissão de outra conta.
      if (!callerScope?.is_admin) {
        return json({ error: "Apenas administradores podem alterar isso" }, 403)
      }
      const { userId, associacaoId, isAdmin, papel } = body
      if (!userId || typeof userId !== "string") return json({ error: "ID do usuário é obrigatório" }, 400)
      if (papel && papel !== "gestor" && papel !== "financeiro") {
        return json({ error: "Papel inválido" }, 400)
      }

      const { error } = await admin
        .from("sucesu_usuarios")
        .update({
          associacao_id: associacaoId ?? null,
          is_admin: Boolean(isAdmin),
          ...(papel ? { papel } : {}),
        })
        .eq("id", userId)
      if (error) throw error

      return json({ ok: true })
    }

    if (action === "invite") {
      const { email, nome } = body
      if (!email || typeof email !== "string") return json({ error: "E-mail é obrigatório" }, 400)

      // Só um admin pode conceder admin ou o papel financeiro a um convite; qualquer
      // outro chamador só consegue criar contas gestor comuns, mesmo que tente enviar
      // isAdmin/papel no corpo da requisição.
      const isAdmin = callerScope?.is_admin ? Boolean(body.isAdmin) : false
      const papelSolicitado = callerScope?.is_admin ? body.papel : undefined
      if (papelSolicitado && papelSolicitado !== "gestor" && papelSolicitado !== "financeiro") {
        return json({ error: "Papel inválido" }, 400)
      }
      const papel = papelSolicitado ?? "gestor"
      // Um não-admin só pode convidar gente para a própria associação, nunca outra.
      const associacaoId = callerScope?.is_admin ? body.associacaoId : callerScope?.associacao_id

      // Se já existe uma conta com esse e-mail (comum neste projeto compartilhado,
      // usado por vários dos seus apps), só adiciona ela ao escopo do SUCESU SP Connect
      // em vez de tentar criar uma conta nova.
      const { data: todosUsuarios, error: listError } = await admin.auth.admin.listUsers({
        perPage: 1000,
      })
      if (listError) throw listError
      const existente = todosUsuarios.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      )

      let userId: string
      let actionLink: string | null = null

      if (existente) {
        userId = existente.id
      } else {
        const tempPassword = crypto.randomUUID()
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
        })
        if (createError) throw createError
        userId = created.user.id

        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
        })
        if (linkError) throw linkError
        actionLink = linkData.properties?.action_link ?? null
      }

      const { error: upsertError } = await admin.from("sucesu_usuarios").upsert({
        id: userId,
        nome: nome ?? null,
        associacao_id: associacaoId ?? null,
        is_admin: Boolean(isAdmin),
        papel: papel ?? "gestor",
      })
      if (upsertError) throw upsertError

      return json({ user: { id: userId, email }, actionLink })
    }

    if (action === "reset_link") {
      const { email } = body
      if (!email || typeof email !== "string") return json({ error: "E-mail é obrigatório" }, 400)

      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
      })
      if (linkError) throw linkError

      return json({ actionLink: linkData.properties?.action_link ?? null })
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
