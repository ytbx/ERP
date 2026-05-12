import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { Plus, Building2, UserCircle, Loader2, Wallet, ArrowDownCircle, ArrowUpCircle, History as HistoryIcon, XCircle, CornerUpLeft, Download, FileSpreadsheet, FileText } from 'lucide-react'
import type { Account, Ledger } from '../types/database'
import { ExportService } from '../services/ExportService'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    entity_type: 'person' as 'person' | 'corporate',
    currency: 'TRY',
    is_international: false,
    contact_info: ''
  })

  const [paymentData, setPaymentData] = useState({
    type: 'credit' as 'credit' | 'debt', // credit: tahsilat (customer pays us), debt: ödeme (we pay supplier)
    amount: 0,
    description: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ledgerHistory, setLedgerHistory] = useState<Ledger[]>([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('accounts')
        .insert([{
          name: formData.name,
          type: formData.type as 'customer' | 'supplier',
          entity_type: formData.entity_type,
          currency: formData.currency,
          is_international: formData.is_international,
          contact_info: formData.contact_info,
          balance: 0
        }])

      if (error) throw error
      
      setIsModalOpen(false)
      setFormData({ name: '', type: 'customer', entity_type: 'person', currency: 'TRY', is_international: false, contact_info: '' })
      fetchAccounts()
    } catch (error) {
      console.error('Error creating account:', error)
      alert('Cari hesap oluşturulurken bir hata oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('ledger')
        .insert([{
          account_id: selectedAccount.id,
          type: paymentData.type,
          amount: paymentData.amount,
          description: paymentData.description || (paymentData.type === 'credit' ? 'Tahsilat' : 'Ödeme'),
          currency: selectedAccount.currency || 'TRY'
        }])

      if (error) throw error
      
      setIsPaymentModalOpen(false)
      setPaymentData({ type: 'credit', amount: 0, description: '' })
      fetchAccounts()
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('İşlem kaydedilirken bir hata oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchHistory = async (account: Account) => {
    try {
      setSelectedAccount(account)
      const { data, error } = await supabase
        .from('ledger')
        .select('*')
        .eq('account_id', account.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLedgerHistory(data || [])
      setIsHistoryModalOpen(true)
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleVoidEntry = async (id: string) => {
    const reason = prompt('İptal nedeni giriniz:')
    if (!reason) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase.rpc('void_ledger_entry', {
        p_ledger_id: id,
        p_reason: reason
      })

      if (error) throw error
      
      alert('İşlem başarıyla iptal edildi ve ters kayıt oluşturuldu.')
      if (selectedAccount) fetchHistory(selectedAccount)
      fetchAccounts()
    } catch (error: any) {
      console.error('Error voiding entry:', error)
      alert(error.message || 'İşlem iptal edilirken bir hata oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredAccounts = accounts.filter(account => 
    account.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency }).format(amount)
  }

  const totals = accounts.reduce((acc: any, curr) => {
    const cur = curr.currency || 'TRY'
    if (!acc[cur]) acc[cur] = { debt: 0, credit: 0 }
    if (curr.balance > 0) acc[cur].debt += curr.balance
    else acc[cur].credit += Math.abs(curr.balance)
    return acc
  }, {})

  return (
    <>
      <Header
        title="Cari Hesaplar"
        subtitle={`${accounts.length} cari kayıt listeleniyor`}
        onSearch={setSearch}
        searchPlaceholder="Cari ara..."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => ExportService.exportAccountsToExcel(accounts)}
              className="glass-button-secondary flex items-center gap-2 py-2.5 text-sm"
              title="Excel'e Aktar"
            >
              <FileSpreadsheet size={18} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="glass-button flex items-center gap-2 py-2.5 text-sm"
            >
              <Plus size={18} /> Yeni Cari Hesap
            </button>
          </div>
        }
      />

      <div className="p-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 border-emerald-500/10 hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ArrowUpCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Toplam Alacak (TRY)</p>
                <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totals['TRY']?.debt || 0, 'TRY')}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 border-red-500/10 hover:border-red-500/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                <ArrowDownCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Toplam Borç (TRY)</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(totals['TRY']?.credit || 0, 'TRY')}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 border-blue-500/10 hover:border-blue-500/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">Dövizli Bakiyeler</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {Object.keys(totals).filter(c => c !== 'TRY').map(c => (
                    <div key={c} className="flex items-center gap-2">
                      <span className="text-[10px] text-surface-500 font-bold">{c}:</span>
                      <span className={`text-sm font-semibold ${(totals[c].debt - totals[c].credit) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency((totals[c].debt - totals[c].credit), c)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(totals).filter(c => c !== 'TRY').length === 0 && (
                    <p className="text-sm text-surface-500">Döviz işlemi yok.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Cari Adı</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Tür</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Varlık</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">İletişim</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">Bakiye</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-surface-400">
                      <Loader2 size={20} className="animate-spin" />
                      Yükleniyor...
                    </div>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-surface-500">Cari hesap bulunamadı.</td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr key={account.id} className="table-row">
                    <td className="px-6 py-4 font-medium text-surface-100">
                      <div className="flex items-center gap-2">
                        {account.name}
                        {account.is_international && (
                          <span className="text-[10px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 uppercase tracking-tighter">
                            Yurt Dışı
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {account.type === 'customer' ? (
                        <span className="badge-success">
                          <UserCircle size={14} className="mr-1.5" /> Müşteri
                        </span>
                      ) : (
                        <span className="badge-info">
                          <Building2 size={14} className="mr-1.5" /> Tedarikçi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {account.entity_type === 'corporate' ? (
                        <span className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md border border-amber-500/20">
                          Tüzel Kişi
                        </span>
                      ) : (
                        <span className="text-[11px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
                          Gerçek Kişi
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-surface-400 text-sm">{account.contact_info || '—'}</td>
                    <td className="px-6 py-4 text-right font-semibold">
                      <div className="flex flex-col items-end">
                        <span className={account.balance > 0 ? 'text-emerald-400' : account.balance < 0 ? 'text-red-400' : 'text-surface-400'}>
                          {formatCurrency(account.balance, account.currency || 'TRY')}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-surface-500">
                          {account.balance > 0 ? 'Alacaklıyız' : account.balance < 0 ? 'Borçluyuz' : 'Dengede'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAccount(account)
                            setPaymentData({ ...paymentData, type: account.type === 'customer' ? 'credit' : 'debt' })
                            setIsPaymentModalOpen(true)
                          }}
                          className="p-2 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors"
                          title="Ödeme/Tahsilat Ekle"
                        >
                          <Wallet size={16} />
                        </button>
                        <button
                          onClick={() => fetchHistory(account)}
                          className="p-2 rounded-lg bg-surface-800 text-surface-400 hover:text-surface-100 transition-colors"
                          title="İşlem Geçmişi"
                        >
                          <HistoryIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cari Ekleme Modalı */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Cari Hesap Ekle"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Cari Adı *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass-input w-full"
              placeholder="Firma veya Kişi Adı"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Hesap Türü</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="customer" className="bg-surface-900">Müşteri (Alıcı)</option>
              <option value="supplier" className="bg-surface-900">Tedarikçi (Satıcı)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Varlık Türü</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, entity_type: 'person' })}
                className={`p-2.5 rounded-xl border text-sm transition-all ${
                  formData.entity_type === 'person'
                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                    : 'bg-surface-800/50 border-white/5 text-surface-400'
                }`}
              >
                Gerçek Kişi
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, entity_type: 'corporate' })}
                className={`p-2.5 rounded-xl border text-sm transition-all ${
                  formData.entity_type === 'corporate'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                    : 'bg-surface-800/50 border-white/5 text-surface-400'
                }`}
              >
                Tüzel Kişi
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Hesap Para Birimi</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="glass-input w-full appearance-none cursor-pointer"
            >
              <option value="TRY" className="bg-surface-900">Türk Lirası (₺)</option>
              <option value="USD" className="bg-surface-900">Amerikan Doları ($)</option>
              <option value="EUR" className="bg-surface-900">Euro (€)</option>
              <option value="GBP" className="bg-surface-900">İngiliz Sterlini (£)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
            <div>
              <p className="text-sm font-bold text-purple-400">Yurt Dışı Cari</p>
              <p className="text-[10px] text-surface-500">Bu cari yurt dışı ise vergi istisnası uygulanabilir.</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_international: !formData.is_international })}
              className={`w-12 h-6 rounded-full p-1 transition-all ${formData.is_international ? 'bg-purple-600' : 'bg-surface-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all ${formData.is_international ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">İletişim Bilgileri</label>
            <textarea
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              className="glass-input w-full min-h-[100px] resize-none"
              placeholder="Telefon, Email, Adres vb."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="glass-button-secondary flex-1 py-2.5 text-sm"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="glass-button flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Ödeme/Tahsilat Modalı */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`${selectedAccount?.name} - Finansal İşlem`}
        size="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-surface-400">Mevcut Bakiye:</span>
              <span className={`font-bold ${selectedAccount?.balance && selectedAccount.balance > 0 ? 'text-emerald-400' : selectedAccount?.balance && selectedAccount.balance < 0 ? 'text-red-400' : 'text-surface-100'}`}>
                {formatCurrency(selectedAccount?.balance || 0, selectedAccount?.currency || 'TRY')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, type: 'credit' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  paymentData.type === 'credit'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-surface-800/50 border-white/5 text-surface-400'
                }`}
              >
                <ArrowDownCircle size={18} />
                <div className="text-left">
                  <div className="text-sm font-bold">Tahsilat</div>
                  <div className="text-[10px] opacity-70">Para Girişi</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentData({ ...paymentData, type: 'debt' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  paymentData.type === 'debt'
                    ? 'bg-red-500/10 border-red-500/50 text-red-400'
                    : 'bg-surface-800/50 border-white/5 text-surface-400'
                }`}
              >
                <ArrowUpCircle size={18} />
                <div className="text-left">
                  <div className="text-sm font-bold">Ödeme</div>
                  <div className="text-[10px] opacity-70">Para Çıkışı</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Tutar (₺) *</label>
            <input
              type="number"
              required
              min={0.01}
              step={0.01}
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })}
              className="glass-input w-full text-xl font-bold"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Açıklama</label>
            <input
              type="text"
              value={paymentData.description}
              onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
              className="glass-input w-full"
              placeholder={paymentData.type === 'credit' ? 'Müşteri ödemesi' : 'Tedarikçiye yapılan ödeme'}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="glass-button-secondary flex-1 py-2.5 text-sm"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2.5 text-sm rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                paymentData.type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
              } text-white shadow-lg`}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              İşlemi Onayla
            </button>
          </div>
        </form>
      </Modal>

      {/* İşlem Geçmişi Modalı */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`${selectedAccount?.name} - İşlem Geçmişi`}
        size="lg"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          {ledgerHistory.length === 0 ? (
            <p className="text-center py-8 text-surface-500">Henüz bir işlem kaydı yok.</p>
          ) : (
            ledgerHistory.map((entry) => {
              const isPlus = entry.type === 'debt';
              const isVoided = entry.is_voided;
              const isReversal = entry.description?.startsWith('IPTAL:');
              
              return (
                <div key={entry.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${
                  isVoided ? 'bg-red-500/5 border-red-500/10 opacity-60' : 
                  isReversal ? 'bg-emerald-500/5 border-emerald-500/10' :
                  'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isVoided ? 'bg-surface-800 text-surface-500' :
                      isReversal ? 'bg-emerald-500/20 text-emerald-400' :
                      (isPlus ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')
                    }`}>
                      {isVoided ? <XCircle size={20} /> : (isReversal ? <CornerUpLeft size={20} /> : (isPlus ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />))}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${isVoided ? 'text-surface-500 line-through' : 'text-surface-100'}`}>
                          {entry.description}
                        </p>
                        {isVoided && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase">İptal Edildi</span>}
                        {isReversal && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase">Ters Kayıt</span>}
                      </div>
                      <p className="text-xs text-surface-500">
                        {new Date(entry.created_at!).toLocaleString('tr-TR')}
                        {isVoided && entry.void_reason && ` • Neden: ${entry.void_reason}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-bold ${isVoided ? 'text-surface-600 line-through' : (isPlus ? 'text-emerald-400' : 'text-red-400')}`}>
                        {isPlus ? '+' : '-'}{formatCurrency(entry.amount, entry.currency || 'TRY')}
                      </p>
                      <p className="text-[10px] text-surface-600 uppercase tracking-widest">
                        {entry.transaction_id 
                          ? (entry.type === 'debt' ? 'SATIŞ' : 'ALIŞ') 
                          : (entry.type === 'debt' ? 'ÖDEME' : 'TAHSİLAT')}
                      </p>
                    </div>
                    {!isVoided && !isReversal && (
                      <button
                        onClick={() => handleVoidEntry(entry.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                        title="İşlemi İptal Et (Ters Kayıt)"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
            <div className="flex gap-2">
              <button 
                onClick={() => ExportService.exportLedgerToExcel(ledgerHistory, selectedAccount?.name || 'Cari')}
                className="glass-button-secondary px-4 py-2 text-xs flex items-center gap-2"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button 
                onClick={() => ExportService.exportLedgerToPDF(ledgerHistory, selectedAccount?.name || 'Cari')}
                className="glass-button-secondary px-4 py-2 text-xs flex items-center gap-2"
              >
                <FileText size={14} /> PDF
              </button>
            </div>
            <button onClick={() => setIsHistoryModalOpen(false)} className="glass-button-secondary px-6 py-2 text-sm">Kapat</button>
        </div>
      </Modal>
    </>
  )
}
