import { describe, expect, it } from "vitest"
import {
  formatCEP,
  formatCNPJ,
  formatCPF,
  formatCurrencyBRL,
  formatDateBR,
  formatPhone,
  isValidCNPJ,
  isValidCPF,
  onlyDigits,
} from "./format"

describe("onlyDigits", () => {
  it("removes every non-digit character", () => {
    expect(onlyDigits("111.444.777-35")).toBe("11144477735")
    expect(onlyDigits("(11) 94020-7654")).toBe("11940207654")
  })
})

describe("formatCPF", () => {
  it("applies the 000.000.000-00 mask progressively", () => {
    expect(formatCPF("11144477735")).toBe("111.444.777-35")
    expect(formatCPF("111")).toBe("111")
    expect(formatCPF("111444")).toBe("111.444")
  })

  it("ignores extra digits past 11", () => {
    expect(formatCPF("111444777356789")).toBe("111.444.777-35")
  })
})

describe("isValidCPF", () => {
  it("accepts a real CPF with correct check digits", () => {
    expect(isValidCPF("111.444.777-35")).toBe(true)
  })

  it("rejects a CPF with wrong check digits", () => {
    expect(isValidCPF("111.444.777-36")).toBe(false)
  })

  it("rejects all-repeated-digit sequences", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false)
  })

  it("rejects the wrong length", () => {
    expect(isValidCPF("123456")).toBe(false)
  })
})

describe("formatCNPJ", () => {
  it("applies the 00.000.000/0000-00 mask", () => {
    expect(formatCNPJ("11222333000181")).toBe("11.222.333/0001-81")
  })
})

describe("isValidCNPJ", () => {
  it("accepts a real CNPJ with correct check digits", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true)
  })

  it("rejects a CNPJ with wrong check digits", () => {
    expect(isValidCNPJ("11.222.333/0001-82")).toBe(false)
  })

  it("rejects all-repeated-digit sequences", () => {
    expect(isValidCNPJ("11111111111111")).toBe(false)
  })
})

describe("formatPhone", () => {
  it("formats an 11-digit mobile number", () => {
    expect(formatPhone("11940207654")).toBe("(11) 94020-7654")
  })

  it("formats a 10-digit landline number", () => {
    expect(formatPhone("1140207654")).toBe("(11) 4020-7654")
  })
})

describe("formatCEP", () => {
  it("applies the 00000-000 mask", () => {
    expect(formatCEP("01310100")).toBe("01310-100")
  })
})

describe("formatDateBR", () => {
  it("formats an ISO date as dd/mm/yyyy", () => {
    expect(formatDateBR("2026-10-06")).toBe("06/10/2026")
  })

  it("returns an em dash for null", () => {
    expect(formatDateBR(null)).toBe("—")
  })
})

describe("formatCurrencyBRL", () => {
  it("formats a number as R$ currency", () => {
    expect(formatCurrencyBRL(100)).toBe("R$ 100,00")
  })

  it("returns an em dash for null", () => {
    expect(formatCurrencyBRL(null)).toBe("—")
  })

  it("returns an em dash for NaN", () => {
    expect(formatCurrencyBRL(NaN)).toBe("—")
  })
})
