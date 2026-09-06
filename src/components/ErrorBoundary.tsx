import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Logo } from "./Logo"

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado na interface:", error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.href = "/"
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-bg px-4">
        <div className="rounded-2xl bg-white px-8 py-5 shadow-sm">
          <Logo />
        </div>

        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle size={24} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-brand-navy-900">Algo deu errado</h1>
          <p className="mt-2 text-sm text-slate-500">
            Encontramos um erro inesperado nesta tela. Isso não deveria acontecer — tente voltar
            para o início; se continuar, avise a equipe técnica.
          </p>

          <button
            onClick={this.handleReload}
            className="mt-6 w-full rounded-lg bg-brand-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-navy-800"
          >
            Voltar para o início
          </button>

          {import.meta.env.DEV && (
            <pre className="mt-6 overflow-x-auto rounded-lg bg-slate-50 p-3 text-left text-xs text-red-600">
              {this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
