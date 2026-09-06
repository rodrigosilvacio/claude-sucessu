import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Combobox, type ComboboxOption } from "./Combobox"

const options: ComboboxOption[] = [
  { value: "1", label: "SUCESU SP", sublabel: "Associação" },
  { value: "2", label: "Maria Souza", sublabel: "Nº 1001" },
  { value: "3", label: "João Silva", sublabel: "Nº 1002" },
]

describe("Combobox", () => {
  it("shows the label of the currently selected option", () => {
    render(<Combobox value="2" onChange={vi.fn()} options={options} />)
    expect(screen.getByDisplayValue("Maria Souza")).toBeInTheDocument()
  })

  it("filters options as the user types and selects one on click", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Combobox value="" onChange={handleChange} options={options} />)

    const input = screen.getByPlaceholderText("Buscar...")
    await user.click(input)
    await user.type(input, "João")

    expect(screen.getByText("João Silva")).toBeInTheDocument()
    expect(screen.queryByText("Maria Souza")).not.toBeInTheDocument()

    await user.click(screen.getByText("João Silva"))
    expect(handleChange).toHaveBeenCalledWith("3")
  })

  it("shows an empty-state message when nothing matches", async () => {
    const user = userEvent.setup()
    render(<Combobox value="" onChange={vi.fn()} options={options} emptyMessage="Nada encontrado" />)

    const input = screen.getByPlaceholderText("Buscar...")
    await user.click(input)
    await user.type(input, "xyz-inexistente")

    expect(screen.getByText("Nada encontrado")).toBeInTheDocument()
  })

  it("clears the selection when the clear button is clicked", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Combobox value="1" onChange={handleChange} options={options} />)

    await user.click(screen.getByLabelText("Limpar seleção"))
    expect(handleChange).toHaveBeenCalledWith("")
  })
})
