import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  LogOut,
  Warehouse,
  Shield,
  User,
  Users,
  Key,
  PieChart,
  Briefcase,
  Receipt,
  History as HistoryIcon
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { to: '/products', icon: Package, label: 'Ürünler', id: 'products' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Stok Hareketleri', id: 'transactions' },
  { to: '/finance', icon: PieChart, label: 'Finans Dashboard', id: 'finance_dashboard' },
  { to: '/accounts', icon: Briefcase, label: 'Cari Hesaplar', id: 'accounts' },
  { to: '/expenses', icon: Receipt, label: 'Giderler', id: 'expenses' },
  { to: '/roles', icon: Key, label: 'Rol Yönetimi', id: 'roles' },
  { to: '/users', icon: Users, label: 'Kullanıcı Yönetimi', id: 'users' },
  { to: '/audit-logs', icon: HistoryIcon, label: 'Denetim İzleri', id: 'audit_logs' },
]

export default function Sidebar() {
  const { profile, signOut, isAdmin, hasPageAccess } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => hasPageAccess(item.id))

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 glass border-r border-white/10 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Warehouse size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">WMS</h1>
            <p className="text-xs text-surface-400">Depo Yönetim Sistemi</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">
          Ana Menü
        </p>
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/5">
        <div className="glass-card p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
              <User size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-100 truncate">
                {profile?.full_name || 'Kullanıcı'}
              </p>
              <div className="flex items-center gap-1.5">
                {isAdmin && <Shield size={12} className="text-brand-400" />}
                <span className="text-xs text-surface-400">
                  {profile?.roles?.name || 'Personel'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut size={20} />
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  )
}
