import { useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { Plus, Receipt, Loader2, Calendar, Tag, CreditCard } from 'lucide-react'
import type { Expense } from '../types/database'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      
      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const { error } = await supabase
        .from('expenses')
        .insert([{
          title: formData.title,
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          notes: formData.notes
        }])

      if (error) throw error
      
      setIsModalOpen(false)
      setFormData({
        title: '',
        category: 'other',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchExpenses()
    } catch (error) {
      console.error('Error creating expense:', error)
      alert('Gider kaydedilirken bir hata oluştu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => 
    expense.title.toLowerCase().includes(search.toLowerCase()) ||
    expense.category.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount)
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      salary: 'Maaş',
      rent: 'Kira',
      tax: 'Vergi',
      other: 'Diğer'
    }
    return labels[category] || category
  }

  return (
    <>
      <Header
        title="Giderler"
        subtitle="İşletme harcamaları ve ödemeler"
        onSearch={setSearch}
        searchPlaceholder="Gider ara..."
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="glass-button flex items-center gap-2 py-2.5 text-sm"
          >
            <Plus size={18} /> Yeni Gider Ekle
          </button>
        }
      />

      <div className="p-8 animate-fade-in">
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Açıklama</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-surface-400">
                      <Loader2 size={20} className="animate-spin" />
                      Yükleniyor...
                    </div>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-surface-500">Gider kaydı bulunamadı.</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="table-row">
                    <td className="px-6 py-4 font-medium text-surface-100">
                      <div className="flex flex-col">
                        <span>{expense.title}</span>
                        {expense.notes && <span className="text-xs text-surface-500 font-normal mt-0.5">{expense.notes}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-info">
                        <Tag size={14} className="mr-1.5" /> {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-surface-400 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(expense.date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-red-400">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Gider Ekle"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Gider Başlığı *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="glass-input w-full"
              placeholder="Örn: Kira Ödemesi, Elektrik Faturası"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="glass-input w-full appearance-none cursor-pointer"
              >
                <option value="salary" className="bg-surface-900">Maaş</option>
                <option value="rent" className="bg-surface-900">Kira</option>
                <option value="tax" className="bg-surface-900">Vergi</option>
                <option value="other" className="bg-surface-900">Diğer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Tutar *</label>
              <div className="relative">
                <CreditCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="glass-input w-full pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Tarih *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Notlar</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="glass-input w-full min-h-[80px] resize-none"
              placeholder="Ek bilgiler..."
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
    </>
  )
}
