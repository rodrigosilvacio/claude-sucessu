import { describe, expect, it } from "vitest"
import { associadoSchema } from "./associado"

const validPayload = {
  associacao_id: "11111111-1111-1111-1111-111111111111",
  nome_completo: "Maria Souza",
  cpf: "111.444.777-35",
  telefone: "(11) 94020-7654",
  email: "maria@example.com",
  categoria_associado: "Efetivo",
  status: "Ativo",
  forma_pagamento: "Pix",
}

describe("associadoSchema", () => {
  it("accepts a minimal valid payload and strips CPF formatting", () => {
    const result = associadoSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cpf).toBe("11144477735")
      expect(result.data.tipo_pessoa).toBe("Pessoa Física")
    }
  })

  it("rejects an invalid CPF check digit", () => {
    const result = associadoSchema.safeParse({ ...validPayload, cpf: "111.444.777-36" })
    expect(result.success).toBe(false)
  })

  it("rejects a missing associacao_id", () => {
    const result = associadoSchema.safeParse({ ...validPayload, associacao_id: "" })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid e-mail", () => {
    const result = associadoSchema.safeParse({ ...validPayload, email: "not-an-email" })
    expect(result.success).toBe(false)
  })

  it("rejects a category outside the known list", () => {
    const result = associadoSchema.safeParse({ ...validPayload, categoria_associado: "Inexistente" })
    expect(result.success).toBe(false)
  })

  it("parses valor_associacao from a comma-decimal string", () => {
    const result = associadoSchema.safeParse({ ...validPayload, valor_associacao: "150,50" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valor_associacao).toBe(150.5)
    }
  })

  it("treats an empty valor_associacao as null rather than 0", () => {
    const result = associadoSchema.safeParse({ ...validPayload, valor_associacao: "" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valor_associacao).toBeNull()
    }
  })

  it("rejects a missing forma_pagamento", () => {
    const { forma_pagamento: _forma_pagamento, ...withoutFormaPagamento } = validPayload
    const result = associadoSchema.safeParse(withoutFormaPagamento)
    expect(result.success).toBe(false)
  })

  it("requires parcelas_cartao when forma_pagamento is Cartão", () => {
    const result = associadoSchema.safeParse({ ...validPayload, forma_pagamento: "Cartão" })
    expect(result.success).toBe(false)
  })

  it("accepts Cartão with a valid parcelas_cartao", () => {
    const result = associadoSchema.safeParse({
      ...validPayload,
      forma_pagamento: "Cartão",
      parcelas_cartao: "3",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.parcelas_cartao).toBe(3)
    }
  })

  it("nulls out parcelas_cartao when forma_pagamento is Pix", () => {
    const result = associadoSchema.safeParse({
      ...validPayload,
      forma_pagamento: "Pix",
      parcelas_cartao: "5",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.parcelas_cartao).toBeNull()
    }
  })
})
