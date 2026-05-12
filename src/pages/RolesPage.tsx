import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { RoleService } from '../services/RoleService'
import type { Role, RoleInsert, RoleUpdate } from '../types/database'
import { Plus, Trash2, Key, Loader2 } from 'lucide-react'

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Ürünler' },
  { id: 'transactions', label: 'Stok Hareketleri' },
  { id: 'finance_dashboard', label: 'Finans Paneli' },
  { id: 'accounts', label: 'Cari Hesaplar' },
  { id: 'expenses', label: 'Gider Yönetimi' },
  { id: 'roles', label: 'Rol Yönetimi' },
  { id: 'users', label: 'Kullanıcı Yönetimi' },
  { id: 'audit_logs', label: 'Denetim İzleri' },
]

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    allowed_pages: [] as string[] 
  })

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const data = await RoleService.getAll()
      setRoles(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingRole(null)
    setFormData({ name: '', description: '', allowed_pages: [] })
    setModalOpen(true)
  }

  const openEdit = (r: Role) => {
    setEditingRole(r)
    setFormData({ 
      name: r.name, 
      description: r.description || '', 
      allowed_pages: (r.allowed_pages as string[]) || [] 
    })
    setModalOpen(true)
  }

  const togglePage = (pageId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_pages: prev.allowed_pages.includes(pageId)
        ? prev.allowed_pages.filter(p => p !== pageId)
        : [...prev.allowed_pages, pageId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingRole) {
        const upd: RoleUpdate = { 
          name: formData.name, 
          description: formData.description || null, 
          allowed_pages: formData.allowed_pages 
        }
        await RoleService.update(editingRole.id, upd)
      } else {
        const ins: RoleInsert = { 
          name: formData.name, 
          description: formData.description || null, 
          allowed_pages: formData.allowed_pages,
          is_system: false
        }
        await RoleService.create(ins)
      }
      await fetchRoles()
      setModalOpen(false)
    } catch (err) {
      console.error(err)
      alert('Rol kaydedilirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await RoleService.delete(id)
      await fetchRoles()
      setDeleteConfirm(null)
    } catch (err) {
      console.error(err)
      alert('Rol silinirken hata oluştu')
    }
  }

  return (
    <>
      <Header
        title="Rol Yönetimi"
        subtitle="Sistem rolleri ve sayfa yetkileri"
        actions={
          <button onClick={openCreate} className="glass-button flex items-center gap-2 py-2.5 text-sm">
            <Plus size={18} /> Yeni Rol
          </button>
        }
      />

      <div className="p-8 animate-fade-in">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="glass-card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                      <Key size={20} className="text-brand-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        {role.name}
                        {role.is_system && <span className="badge badge-info text-[10px]">Sistem</span>}
                      </h3>
                      <p className="text-xs text-surface-400">{role.description || 'Açıklama yok'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 mb-6">
                  <p className="text-xs font-medium text-surface-500 mb-2 uppercase tracking-wider">Yetkili Sayfalar</p>
                  <div className="flex flex-wrap gap-2">
                    {(role.allowed_pages as string[])?.map(pageId => {
                      const page = AVAILABLE_PAGES.find(p => p.id === pageId)
                      return (
                        <span key={pageId} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-surface-300">
                          {page?.label || pageId}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                  <button 
                    onClick={() => openEdit(role)} 
                    className="flex-1 glass-button-secondary py-2 text-sm flex justify-center"
                  >
                    Düzenle
                  </button>
                  {!role.is_system && (
                    <button 
                      onClick={() => setDeleteConfirm(role.id)}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRole ? 'Rol Düzenle' : 'Yeni Rol'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Rol Adı *</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required 
              disabled={editingRole?.is_system}
              className="glass-input w-full disabled:opacity-50" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Açıklama</label>
            <textarea 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              className="glass-input w-full" 
              rows={2} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-3">Erişilebilir Sayfalar</label>
            <div className="space-y-2">
              {AVAILABLE_PAGES.map(page => (
                <label key={page.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.allowed_pages.includes(page.id)}
                    onChange={() => togglePage(page.id)}
                    className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-surface-900"
                  />
                  <span className="text-sm font-medium text-surface-200">{page.label}</span>
                </label>
              ))}
            </div>
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

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Rolü Sil" size="sm">
        <p className="text-surface-300 mb-6">Bu rolü silmek istediğinize emin misiniz? Bu role sahip kullanıcılar sisteme erişemeyebilir.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="glass-button-danger py-2.5 text-sm">Sil</button>
        </div>
      </Modal>
    </>
  )
}
