import { NavLink, useNavigate } from "react-router-dom"
import { LogOut, X } from "lucide-react"
import { Logo } from "./Logo"
import { navSections } from "../nav-config"
import { useAuth } from "../lib/auth-context"

type SidebarProps = {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { signOut, escopo } = useAuth()
  const navigate = useNavigate()

  const isAdmin = Boolean(escopo?.is_admin)

  async function handleSignOut() {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 transform flex-col bg-brand-navy-900 text-slate-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Logo variant="light" />
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="text-slate-300 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navSections.map((section) => {
            const items = section.items.filter((item) => !item.requiresAdmin || isAdmin)
            if (items.length === 0) return null

            return (
              <div key={section.title} className="mb-5">
                <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === "/"}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? "border-brand-blue-500 bg-brand-navy-800 font-medium text-white"
                              : "border-transparent text-slate-300 hover:bg-brand-navy-800/60 hover:text-white"
                          }`
                        }
                      >
                        <item.icon size={18} strokeWidth={2} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-brand-navy-800/60 hover:text-white"
          >
            <LogOut size={18} strokeWidth={2} />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}
