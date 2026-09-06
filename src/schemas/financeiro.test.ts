import { describe, expect, it } from "vitest"
import { contaPagarSchema, contaReceberSchema } from "./financeiro"

const validPagar = {
  associacao_id: "11111111-1111-1111-1111-111111111111",
  descricao: "Aluguel da sede",
  valor: "500.00",
  data_vencimento: "2026-10-06",
  status: "Pendente",
}

describe("contaPagarSchema", () => {
  it("accepts a minimal valid payload and converts valor to a number", () => {
    const result = contaPagarSchema.safeParse(validPagar)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valor).toBe(500)
      expect(result.data.fornecedor_id).toBeNull()
    }
  })

  it("rejects a negative valor", () => {
    const result = contaPagarSchema.safeParse({ ...validPagar, valor: "-10" })
    expect(result.success).toBe(false)
  })

  it("rejects an empty descricao", () => {
    const result = contaPagarSchema.safeParse({ ...validPagar, descricao: "  " })
    expect(result.success).toBe(false)
  })

  it("rejects a status outside Pendente/Pago/Cancelado", () => {
    const result = contaPagarSchema.safeParse({ ...validPagar, status: "Atrasado" })
    expect(result.success).toBe(false)
  })

  it("requires data_vencimento", () => {
    const result = contaPagarSchema.safeParse({ ...validPagar, data_vencimento: "" })
    expect(result.success).toBe(false)
  })
})

const validReceber = {
  associacao_id: "11111111-1111-1111-1111-111111111111",
  descricao: "Anuidade - Maria Souza (Nº 1001)",
  valor: "100.00",
  data_vencimento: "2026-10-06",
  status: "Pendente",
}

describe("contaReceberSchema", () => {
  it("accepts a minimal valid payload", () => {
    const result = contaReceberSchema.safeParse(validReceber)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.valor).toBe(100)
      expect(result.data.associado_id).toBeNull()
    }
  })

  it("rejects a non-numeric valor", () => {
    const result = contaReceberSchema.safeParse({ ...validReceber, valor: "abc" })
    expect(result.success).toBe(false)
  })
})
