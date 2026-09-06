export function friendlyErrorMessage(err: unknown, fallback = "Erro ao salvar."): string {
  const message = err instanceof Error ? err.message : String(err)

  if (message.includes("duplicate key") || message.includes("already exists")) {
    if (message.includes("cpf")) return "Já existe um associado cadastrado com esse CPF."
    if (message.includes("cnpj")) return "Já existe um registro cadastrado com esse CNPJ."
    if (message.includes("email")) return "Já existe um registro cadastrado com esse e-mail."
    return "Já existe um registro com esses dados (CPF/CNPJ/e-mail duplicado)."
  }

  if (message.includes("violates foreign key constraint")) {
    return "Não é possível excluir: este registro está em uso em outro cadastro."
  }

  return message || fallback
}
