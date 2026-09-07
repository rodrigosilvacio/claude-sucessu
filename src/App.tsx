import { Routes, Route } from "react-router-dom"
import { Layout } from "./components/Layout"
import { RequireAuth } from "./components/RequireAuth"
import { RequireAdmin } from "./components/RequireAdmin"
import { Login } from "./pages/Login"
import { DefinirSenha } from "./pages/DefinirSenha"
import { Dashboard } from "./pages/Dashboard"
import { AssociadosList } from "./pages/AssociadosList"
import { AssociadoForm } from "./pages/AssociadoForm"
import { PreCadastro } from "./pages/PreCadastro"
import { AssociacaoPage } from "./pages/Associacao"
import { VoluntariosList } from "./pages/VoluntariosList"
import { VoluntarioForm } from "./pages/VoluntarioForm"
import { FornecedoresList } from "./pages/FornecedoresList"
import { FornecedorForm } from "./pages/FornecedorForm"
import { ProdutosServicosList } from "./pages/ProdutosServicosList"
import { ProdutoServicoForm } from "./pages/ProdutoServicoForm"
import { ConteudosKanban } from "./pages/ConteudosKanban"
import { ConteudoForm } from "./pages/ConteudoForm"
import { EventosList } from "./pages/EventosList"
import { EventoForm } from "./pages/EventoForm"
import { EventoInscricaoPublica } from "./pages/EventoInscricaoPublica"
import { AgendaPublica } from "./pages/AgendaPublica"
import { FormulariosList } from "./pages/FormulariosList"
import { FormularioForm } from "./pages/FormularioForm"
import { FormularioPublico } from "./pages/FormularioPublico"
import { Agenda } from "./pages/Agenda"
import { Relatorios } from "./pages/Relatorios"
import { UsuariosList } from "./pages/UsuariosList"
import { Auditoria } from "./pages/Auditoria"
import { FinanceiroPage } from "./pages/FinanceiroPage"
import { ContaPagarForm } from "./pages/ContaPagarForm"
import { ContaReceberForm } from "./pages/ContaReceberForm"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/definir-senha" element={<DefinirSenha />} />
      <Route path="/pre-cadastro" element={<PreCadastro />} />
      <Route path="/inscricao/:slug" element={<EventoInscricaoPublica />} />
      <Route path="/formulario/:slug" element={<FormularioPublico />} />
      <Route path="/agenda-publica" element={<AgendaPublica />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/associados" element={<AssociadosList />} />
          <Route path="/associados/novo" element={<AssociadoForm />} />
          <Route path="/associados/:id/editar" element={<AssociadoForm />} />
          <Route path="/voluntarios" element={<VoluntariosList />} />
          <Route path="/voluntarios/novo" element={<VoluntarioForm />} />
          <Route path="/voluntarios/:id/editar" element={<VoluntarioForm />} />
          <Route path="/fornecedores" element={<FornecedoresList />} />
          <Route path="/fornecedores/novo" element={<FornecedorForm />} />
          <Route path="/fornecedores/:id/editar" element={<FornecedorForm />} />
          <Route path="/produtos-servicos" element={<ProdutosServicosList />} />
          <Route path="/produtos-servicos/novo" element={<ProdutoServicoForm />} />
          <Route path="/produtos-servicos/:id/editar" element={<ProdutoServicoForm />} />
          <Route path="/conteudos" element={<ConteudosKanban />} />
          <Route path="/conteudos/novo" element={<ConteudoForm />} />
          <Route path="/conteudos/:id/editar" element={<ConteudoForm />} />
          <Route path="/eventos" element={<EventosList />} />
          <Route path="/eventos/novo" element={<EventoForm />} />
          <Route path="/eventos/:id/editar" element={<EventoForm />} />
          <Route path="/formularios" element={<FormulariosList />} />
          <Route path="/formularios/novo" element={<FormularioForm />} />
          <Route path="/formularios/:id/editar" element={<FormularioForm />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/financeiro/pagar/novo" element={<ContaPagarForm />} />
          <Route path="/financeiro/pagar/:id/editar" element={<ContaPagarForm />} />
          <Route path="/financeiro/receber/novo" element={<ContaReceberForm />} />
          <Route path="/financeiro/receber/:id/editar" element={<ContaReceberForm />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route element={<RequireAdmin />}>
            <Route path="/associacao" element={<AssociacaoPage />} />
            <Route path="/usuarios" element={<UsuariosList />} />
            <Route path="/auditoria" element={<Auditoria />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
