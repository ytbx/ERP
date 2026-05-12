import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { TransactionService } from '../services/TransactionService'
import { ProductService } from '../services/ProductService'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabaseClient'
import type { TransactionWithProduct, Product, TransactionInsert, Account } from '../types/database'
import { Plus, ArrowDownToLine, ArrowUpFromLine, Loader2, ArrowLeftRight, FileText } from 'lucide-react'
import { DocumentService } from '../services/DocumentService'

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionWithProduct[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [generateDispatchNote, setGenerateDispatchNote] = useState(false)
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [formData, setFormData] = useState({ 
    product_id: '', 
    account_id: '', 
    type: 'in' as 'in' | 'out', 
    quantity: 1, 
    unit_price: 0,
    vat_rate: 20,
    vat_included: false,
    currency: 'TRY',
    tax_exemption_code: '',
    tax_exemption_reason: '',
    notes: '' 
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txs, prods, accountsRes] = await Promise.all([
          TransactionService.getAll(),
          ProductService.getAll(),
          supabase.from('accounts').select('*').order('name')
        ])
        setTransactions(txs)
        setProducts(prods)
        setAccounts(accountsRes.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (formData.product_id) {
      const product = products.find(p => p.id === formData.product_id)
      if (product) {
        setFormData(prev => ({
          ...prev,
          unit_price: formData.type === 'out' ? product.sale_price : product.purchase_price,
          currency: 'TRY' // Default to TRY for now or inherit from account
        }))
      }
    }
  }, [formData.product_id, formData.type, products])

  useEffect(() => {
    if (formData.account_id) {
      const account = accounts.find(a => a.id === formData.account_id)
      if (account) {
        setFormData(prev => ({ 
          ...prev, 
          currency: account.currency || 'TRY',
          vat_rate: account.is_international ? 0 : (prev.vat_rate || 20),
          vat_included: account.is_international ? false : prev.vat_included,
          tax_exemption_code: account.is_international ? '301' : '',
          tax_exemption_reason: account.is_international ? 'Mal İhracatı' : ''
        }))
      }
    }
  }, [formData.account_id, accounts])

  const openCreate = () => {
    const firstProd = products[0]
    setFormData({ 
      product_id: firstProd?.id || '', 
      account_id: '', 
      type: 'in', 
      quantity: 1, 
      unit_price: firstProd?.purchase_price || 0,
      vat_rate: 20,
      vat_included: false,
      currency: 'TRY',
      tax_exemption_code: '',
      tax_exemption_reason: '',
      notes: '' 
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const account = accounts.find(a => a.id === formData.account_id)
      const tx: TransactionInsert = {
        product_id: formData.product_id,
        account_id: formData.account_id || null,
        type: formData.type,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        vat_rate: account?.is_international ? 0 : formData.vat_rate,
        vat_included: account?.is_international ? false : formData.vat_included,
        currency: formData.currency,
        tax_exemption_code: (account?.is_international || formData.vat_rate === 0) ? (formData.tax_exemption_code || '301') : null,
        tax_exemption_reason: (account?.is_international || formData.vat_rate === 0) ? (formData.tax_exemption_reason || 'Mal İhracatı') : null,
        notes: formData.notes || null,
        user_id: user?.id,
      }
      const newTx = await TransactionService.create(tx)
      setTransactions(prev => [newTx, ...prev])
      
      if (generateDispatchNote && newTx) {
        DocumentService.generateDispatchNote(newTx)
      }
      
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header
        title="Stok Hareketleri"
        subtitle={`${transactions.length} işlem listeleniyor`}
        actions={
          <button onClick={openCreate} className="glass-button flex items-center gap-2 py-2.5 text-sm">
            <Plus size={18} /> Yeni İşlem
          </button>
        }
      />

      <div className="p-8 animate-fade-in">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight size={28} className="text-surface-500" />
            </div>
            <p className="text-surface-300 text-lg font-medium">Henüz işlem yok</p>
            <p className="text-surface-500 text-sm mt-1">İlk stok hareketinizi kaydedin</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Tür</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Ürün</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Cari Hesap</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Miktar</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Birim Fiyat</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Toplam</th>
                   <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Not</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Tarih</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Belge</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tx.type === 'in' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {tx.type === 'in' ? <ArrowDownToLine size={16} /> : <ArrowUpFromLine size={16} />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-surface-100">{tx.products?.name || '—'}</p>
                      <p className="text-xs text-surface-500">{tx.products?.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-surface-300">{tx.accounts?.name || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-semibold ${tx.type === 'in' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.type === 'in' ? '+' : '-'}{tx.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-surface-300">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: tx.currency || 'TRY' }).format(tx.unit_price || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-surface-100">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: tx.currency || 'TRY' }).format(
                          (tx.vat_included 
                            ? (tx.quantity * (tx.unit_price || 0)) 
                            : (tx.quantity * (tx.unit_price || 0) * (1 + (tx.vat_rate ?? 20) / 100))
                          )
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-400 max-w-xs truncate">{tx.notes || '—'}</td>
                     <td className="px-6 py-4 text-right text-sm text-surface-400">
                      {new Date(tx.created_at!).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => DocumentService.generateDispatchNote(tx)}
                          className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                          title="İrsaliye İndir"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => DocumentService.generateInvoice(tx)}
                          className="p-2 hover:bg-surface-700 text-surface-400 rounded-lg transition-colors"
                          title="Fatura İndir"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Transaction Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Yeni Stok Hareketi">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Ürün *</label>
            <select
              value={formData.product_id}
              onChange={e => setFormData({ ...formData, product_id: e.target.value })}
              className="glass-input w-full appearance-none cursor-pointer"
              required
            >
              <option value="">Ürün seçin</option>
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-surface-900">{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">İşlem Türü *</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as 'in' | 'out' })}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="in" className="bg-surface-900">Giriş (Stok Ekleme)</option>
              <option value="out" className="bg-surface-900">Çıkış (Stok Düşme)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Cari Hesap (Opsiyonel)</label>
            <select
              value={formData.account_id}
              onChange={e => setFormData({ ...formData, account_id: e.target.value })}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="" className="bg-surface-900">Cari Seçin</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id} className="bg-surface-900">{a.name} ({a.type === 'customer' ? 'Müşteri' : 'Tedarikçi'})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Miktar *</label>
            <input
              type="number"
              min={1}
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
              required
              className="glass-input w-full"
            />
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <button
              type="button"
              onClick={() => setGenerateDispatchNote(!generateDispatchNote)}
              className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                generateDispatchNote ? 'bg-blue-500 border-blue-500' : 'border-surface-600 bg-surface-800'
              }`}
            >
              {generateDispatchNote && <Plus size={16} className="text-white" />}
            </button>
            <div>
              <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">Sevk İrsaliyesi Oluştur</p>
              <p className="text-[10px] text-surface-500">Bu işlem için fiyat içermeyen irsaliye belgesi üretilir.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Birim Fiyat *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.unit_price}
                onChange={e => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                required
                className="glass-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Para Birimi</label>
              <select
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="glass-input w-full appearance-none cursor-pointer"
              >
                <option value="TRY" className="bg-surface-900">TRY (₺)</option>
                <option value="USD" className="bg-surface-900">USD ($)</option>
                <option value="EUR" className="bg-surface-900">EUR (€)</option>
                <option value="GBP" className="bg-surface-900">GBP (£)</option>
              </select>
            </div>
          </div>

          {!accounts.find(a => a.id === formData.account_id)?.is_international && (
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">KDV Oranı (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.vat_rate}
                onChange={e => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
                className="glass-input w-full"
              />
            </div>
          )}

          {formData.vat_rate === 0 && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-amber-400">
                <FileText size={16} />
                <span className="text-sm font-bold uppercase tracking-wider">KDV İstisna Bilgileri</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-1 uppercase">İstisna Kodu</label>
                  <select
                    value={formData.tax_exemption_code}
                    onChange={e => {
                      const reasons: any = { '301': 'Mal İhracatı', '302': 'Hizmet İhracatı', '350': 'Diğer İstisnalar' };
                      setFormData({ 
                        ...formData, 
                        tax_exemption_code: e.target.value,
                        tax_exemption_reason: reasons[e.target.value] || ''
                      })
                    }}
                    className="glass-input w-full text-sm"
                  >
                    <option value="">Kod Seçin</option>
                    <option value="301">301 - Mal İhracatı</option>
                    <option value="302">302 - Hizmet İhracatı</option>
                    <option value="350">350 - Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-surface-500 mb-1 uppercase">İstisna Açıklaması</label>
                  <input
                    type="text"
                    value={formData.tax_exemption_reason}
                    onChange={e => setFormData({ ...formData, tax_exemption_reason: e.target.value })}
                    className="glass-input w-full text-sm"
                    placeholder="Örn: Mal İhracatı"
                  />
                </div>
              </div>
            </div>
          )}
          {formData.vat_rate > 0 && (
            <div className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, vat_included: !formData.vat_included })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  formData.vat_included 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-surface-800/50 border-white/5 text-surface-400'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.vat_included ? 'bg-emerald-500 border-emerald-500' : 'border-surface-600'}`}>
                  {formData.vat_included && <Plus size={12} className="text-white" />}
                </div>
                <span className="text-sm font-medium">KDV Dahil</span>
              </button>
              {!formData.vat_included && formData.vat_rate > 0 && (
                 <span className="text-xs text-surface-500">KDV fiyata eklenecektir.</span>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Notlar</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="glass-input w-full min-h-[80px] resize-none"
              placeholder="İşlem notları..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={() => setModalOpen(false)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
            <button type="submit" disabled={saving} className="glass-button py-2.5 text-sm flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
