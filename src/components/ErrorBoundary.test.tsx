import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "./ErrorBoundary"

function Bomb(): never {
  throw new Error("Falha de teste")
}

describe("ErrorBoundary", () => {
  it("renders children normally when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>Conteúdo normal</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText("Conteúdo normal")).toBeInTheDocument()
  })

  it("renders a friendly fallback instead of a blank screen when a child throws", () => {
    // React logs the caught error to the console; silence it for this expected-failure test.
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Algo deu errado")).toBeInTheDocument()
    expect(screen.getByText("Voltar para o início")).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
