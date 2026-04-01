import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Menu, X 
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventario' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/users', icon: Settings, label: 'Usuarios', roles: ['admin'] },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const filteredNav = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  )

  return (
    <div className="min-h-screen bg-cream">
      <nav className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="font-heading font-bold text-xl text-primary">TiendaMi</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {sidebarOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 shadow-lg animate-slide-up">
            <div className="p-4 border-b border-gray-100">
              <p className="font-medium">{user?.full_name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
            <div className="p-2">
              {filteredNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 w-full mt-2"
              >
                <LogOut size={20} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="hidden lg:flex">
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h1 className="font-heading font-bold text-2xl text-primary">TiendaMi</h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {filteredNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user?.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-sm">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-danger transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </aside>
      </div>

      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around">
          {filteredNav.slice(0, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-3 min-w-[64px] ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`
              }
            >
              <item.icon size={22} />
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
