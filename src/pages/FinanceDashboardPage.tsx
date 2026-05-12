import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Header from '../components/layout/Header'
import { TrendingUp, TrendingDown, DollarSign, ReceiptText, AlertTriangle, Loader2 } from 'lucide-react'

type NetProfitResult = {
  gross_profit: number
  total_expenses: number
  net_profit: number
  estimated_tax: number
}

export default function FinanceDashboardPage() {
  const [data, setData] = useState<NetProfitResult | null>(null)
  const [totalReceivables, setTotalReceivables] = useState(0)
  const [totalPayables, setTotalPayables] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      
      const [profitRes, accountsRes] = await Promise.all([
        supabase.rpc('calculate_net_profit'),
        supabase.from('accounts').select('type, balance')
      ])
      
      if (profitRes.error) throw profitRes.error
      if (accountsRes.error) throw accountsRes.error
      
      setData(profitRes.data as any as NetProfitResult)

      const receivables = (accountsRes.data || [])
        .reduce((sum, a) => sum + (Number(a.balance) > 0 ? Number(a.balance) : 0), 0)
      
      const payables = (accountsRes.data || [])
        .reduce((sum, a) => sum + (Number(a.balance) < 0 ? Math.abs(Number(a.balance)) : 0), 0)

      setTotalReceivables(receivables)
      setTotalPayables(payables)

    } catch (error) {
      console.error('Error fetching finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
  }

  if (loading) {
    return (
      <>
        <Header title="Finans Dashboard" subtitle="Yükleniyor..." />
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      </>
    )
  }

  const stats = [
    { label: 'Toplam Alacak', value: totalReceivables, icon: TrendingUp, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { label: 'Toplam Borç', value: totalPayables, icon: TrendingDown, color: 'from-red-500 to-red-600', shadow: 'shadow-red-500/20' },
    { label: 'Toplam Gider', value: data?.total_expenses || 0, icon: ReceiptText, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/20' },
    { label: 'Net Kâr', value: data?.net_profit || 0, icon: DollarSign, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
  ]

  return (
    <>
      <Header 
        title="Finans Dashboard" 
        subtitle="Finansal durum ve kâr/zarar analizi" 
      />

      <div className="p-8 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={stat.label} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-surface-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stat.value)}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                  <stat.icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Detaylı Kâr / Zarar Özeti</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <span className="text-surface-300">Brüt Kâr (Satış Marjı)</span>
                <span className="font-semibold text-emerald-400">{formatCurrency(data?.gross_profit || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                <span className="text-surface-300">İşletme Giderleri</span>
                <span className="font-semibold text-red-400">- {formatCurrency(data?.total_expenses || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-5 rounded-xl bg-brand-500/10 border border-brand-500/20 mt-6">
                <span className="font-bold text-white">Net İşletme Kârı</span>
                <span className={`text-xl font-bold ${(data?.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(data?.net_profit || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="text-amber-400" size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">Vergi Yükümlülüğü Tahmini</h2>
            </div>
            <p className="text-sm text-surface-400 mb-8 leading-relaxed">
              Bu tutar, sistemdeki net kâr üzerinden **%20** kurumlar/gelir vergisi oranı varsayılarak hesaplanmıştır. Gerçek vergi tutarı istisnalar ve muafiyetlere göre değişiklik gösterebilir.
            </p>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative flex items-center justify-center p-10 rounded-2xl bg-surface-900/50 border border-amber-500/20 backdrop-blur-sm overflow-hidden">
                <div className="text-center relative z-10">
                  <p className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">Tahmini Ödenecek Vergi</p>
                  <h3 className="text-4xl font-black text-white tracking-tight">
                    {formatCurrency(data?.estimated_tax || 0)}
                  </h3>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <DollarSign size={120} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
