import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import TransactionsPage from './pages/TransactionsPage'
import RolesPage from './pages/RolesPage'
import UsersPage from './pages/UsersPage'
import FinanceDashboardPage from './pages/FinanceDashboardPage'
import AccountsPage from './pages/AccountsPage'
import ExpensesPage from './pages/ExpensesPage'
import AuditLogsPage from './pages/AuditLogsPage'
import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-surface-400 text-sm">Yükleniyor...</p>
      </div>
    </div>
  )
}

function UnauthorizedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Yetkisiz Erişim</h2>
        <p className="text-surface-400 text-sm">Bu sayfaya erişim yetkiniz bulunmuyor.</p>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <DashboardLayout />
}

function PageGuard({ children, pageId }: { children: ReactNode, pageId: string }) {
  const { hasPageAccess, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!hasPageAccess(pageId)) return <UnauthorizedScreen />

  return <>{children}</>
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<PageGuard pageId="dashboard"><DashboardPage /></PageGuard>} />
        <Route path="/products" element={<PageGuard pageId="products"><ProductsPage /></PageGuard>} />
        <Route path="/transactions" element={<PageGuard pageId="transactions"><TransactionsPage /></PageGuard>} />
        <Route path="/finance" element={<PageGuard pageId="finance_dashboard"><FinanceDashboardPage /></PageGuard>} />
        <Route path="/accounts" element={<PageGuard pageId="accounts"><AccountsPage /></PageGuard>} />
        <Route path="/expenses" element={<PageGuard pageId="expenses"><ExpensesPage /></PageGuard>} />
        <Route path="/roles" element={<PageGuard pageId="roles"><RolesPage /></PageGuard>} />
        <Route path="/users" element={<PageGuard pageId="users"><UsersPage /></PageGuard>} />
        <Route path="/audit-logs" element={<PageGuard pageId="audit_logs"><AuditLogsPage /></PageGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
