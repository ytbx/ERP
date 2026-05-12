import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import { ProductService } from '../services/ProductService'
import { TransactionService } from '../services/TransactionService'
import type { Product, TransactionWithProduct } from '../types/database'
import {
  Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
  TrendingUp, Clock, ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [recentTx, setRecentTx] = useState<TransactionWithProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prods, txs] = await Promise.all([
          ProductService.getAll(),
          TransactionService.getRecent(8),
        ])
        setProducts(prods)
        setRecentTx(txs)
      } catch (err) {
        console.error('Dashboard veri yükleme hatası:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.current_stock, 0)
  const lowStockProducts = products.filter(p => p.current_stock < 10)
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.sale_price), 0)

  const stats = [
    { label: 'Toplam Ürün', value: totalProducts, icon: Package, color: 'from-brand-500 to-brand-600', shadow: 'shadow-brand-500/20' },
    { label: 'Toplam Stok', value: totalStock.toLocaleString('tr-TR'), icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Düşük Stok', value: lowStockProducts.length, icon: AlertTriangle, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { label: 'Toplam Değer', value: `₺${totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  ]

  if (loading) {
    return (
      <>
        <Header title="Dashboard" subtitle="Genel bakış" />
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </>
    )
  }

  return (
    <>
      <Header title="Dashboard" subtitle="Depo genel bakış ve son işlemler" />
      <div className="p-8 space-y-8 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={stat.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-surface-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                  <stat.icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="xl:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-500/15 flex items-center justify-center">
                  <Clock size={18} className="text-brand-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Son İşlemler</h2>
              </div>
              <Link to="/transactions" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                Tümünü Gör <ArrowRight size={14} />
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-surface-400 text-center py-8">Henüz işlem yok</p>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      {tx.type === 'in' ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-100 truncate">{tx.products?.name || 'Bilinmeyen'}</p>
                      <p className="text-xs text-surface-400">{tx.products?.sku} · {tx.notes || 'Not yok'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                      </p>
                      <p className="text-xs text-surface-500">{new Date(tx.created_at!).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle size={18} className="text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Düşük Stok Uyarısı</h2>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                  <Package size={22} className="text-emerald-400" />
                </div>
                <p className="text-surface-300 text-sm">Tüm stoklar yeterli</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-surface-100">{p.name}</p>
                      <p className="text-xs text-surface-400">{p.sku}</p>
                    </div>
                    <span className={p.current_stock === 0 ? 'badge-danger' : 'badge-warning'}>{p.current_stock} adet</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
