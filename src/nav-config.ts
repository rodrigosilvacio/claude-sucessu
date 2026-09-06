import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  Truck,
  Package,
  Newspaper,
  CalendarRange,
  ClipboardList,
  CalendarDays,
  BarChart3,
  Landmark,
  UserCog,
  ShieldCheck,
  Wallet,
} from "lucide-react"

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  requiresFinanceiro?: boolean
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    title: "Visão geral",
    items: [{ label: "Dashboard Gerencial", path: "/", icon: LayoutDashboard }],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Associados", path: "/associados", icon: Users },
      { label: "Voluntários", path: "/voluntarios", icon: HeartHandshake },
      { label: "Fornecedores", path: "/fornecedores", icon: Truck },
      { label: "Produtos e Serviços", path: "/produtos-servicos", icon: Package },
    ],
  },
  {
    title: "Atividades",
    items: [
      { label: "Conteúdos", path: "/conteudos", icon: Newspaper },
      { label: "Eventos", path: "/eventos", icon: CalendarRange },
      { label: "Formulários", path: "/formularios", icon: ClipboardList },
      { label: "Agenda", path: "/agenda", icon: CalendarDays },
      { label: "Financeiro", path: "/financeiro", icon: Wallet, requiresFinanceiro: true },
    ],
  },
  {
    title: "Relatórios",
    items: [{ label: "Relatórios", path: "/relatorios", icon: BarChart3 }],
  },
  {
    title: "Configuração",
    items: [
      { label: "Associação", path: "/associacao", icon: Landmark },
      { label: "Usuários", path: "/usuarios", icon: UserCog },
      { label: "Auditoria", path: "/auditoria", icon: ShieldCheck },
    ],
  },
]
