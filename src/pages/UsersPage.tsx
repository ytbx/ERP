import { useEffect, useState } from 'react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { UserService } from '../services/UserService'
import { RoleService } from '../services/RoleService'
import type { ProfileWithRole, Role } from '../types/database'
import { UserPlus, Users, Loader2, Key, Eye, EyeOff, Lock } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<ProfileWithRole[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState<{ user: ProfileWithRole, roleId: string } | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState<ProfileWithRole | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    full_name: '', 
    role_id: '' 
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [u, r] = await Promise.all([
        UserService.getAll(),
        RoleService.getAll()
      ])
      setUsers(u)
      setRoles(r)
      if (r.length > 0) {
        setFormData(prev => ({ ...prev, role_id: r[0].id }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setFormData({ email: '', password: '', full_name: '', role_id: roles[0]?.id || '' })
    setModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await UserService.createUser(formData)
      await fetchData()
      setModalOpen(false)
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Kullanıcı oluşturulurken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleUpdate = async () => {
    if (!roleModalOpen) return
    setSaving(true)
    try {
      await UserService.updateRole(roleModalOpen.user.id, roleModalOpen.roleId)
      await fetchData()
      setRoleModalOpen(null)
    } catch (err) {
      console.error(err)
      alert('Rol güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }
  const handlePasswordUpdate = async () => {
    if (!passwordModalOpen || !newPassword) return
    setSaving(true)
    try {
      // UserService.updatePassword metodu eklenecek
      await UserService.updateUserPassword(passwordModalOpen.id, newPassword)
      alert('Şifre başarıyla güncellendi.')
      setPasswordModalOpen(null)
      setNewPassword('')
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Şifre güncellenirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Header
        title="Kullanıcı Yönetimi"
        subtitle="Sistem kullanıcıları ve yetkilendirme"
        actions={
          <button onClick={openCreate} className="glass-button flex items-center gap-2 py-2.5 text-sm">
            <UserPlus size={18} /> Yeni Kullanıcı
          </button>
        }
      />

      <div className="p-8 animate-fade-in">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Kullanıcı</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">E-posta</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Rol</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Kayıt Tarihi</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                          <Users size={16} className="text-surface-400" />
                        </div>
                        <p className="text-sm font-medium text-surface-100">{u.full_name || 'İsimsiz'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-300">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${u.roles?.name === 'Admin' ? 'badge-info' : 'bg-surface-800 text-surface-300 border border-surface-700'}`}>
                        {u.roles?.name || 'Belirsiz'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-400">
                      {new Date(u.created_at!).toLocaleDateString('tr-TR')}
                    </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setPasswordModalOpen(u)}
                            className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-colors"
                            title="Şifre Güncelle"
                          >
                            <Lock size={15} />
                          </button>
                          <button 
                            onClick={() => setRoleModalOpen({ user: u, roleId: u.role_id })}
                            className="px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors flex items-center gap-2 text-surface-200"
                          >
                            <Key size={14} /> Rol
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

      {/* Create User Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Yeni Kullanıcı Oluştur">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Ad Soyad *</label>
            <input 
              value={formData.full_name} 
              onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
              required 
              className="glass-input w-full" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">E-posta *</label>
            <input 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              required 
              className="glass-input w-full" 
            />
          </div>
           <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Geçici Şifre *</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                required 
                minLength={6}
                className="glass-input w-full pr-10" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Rol *</label>
            <select 
              value={formData.role_id} 
              onChange={e => setFormData({ ...formData, role_id: e.target.value })} 
              required 
              className="glass-input w-full"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={() => setModalOpen(false)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
            <button type="submit" disabled={saving} className="glass-button py-2.5 text-sm flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Oluştur
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Role Modal */}
      <Modal isOpen={!!roleModalOpen} onClose={() => setRoleModalOpen(null)} title="Rol Değiştir" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            <strong className="text-white">{roleModalOpen?.user.full_name}</strong> kullanıcısının rolünü seçin:
          </p>
          <select 
            value={roleModalOpen?.roleId} 
            onChange={e => setRoleModalOpen(prev => prev ? { ...prev, roleId: e.target.value } : null)} 
            className="glass-input w-full"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button onClick={() => setRoleModalOpen(null)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
            <button onClick={handleRoleUpdate} disabled={saving} className="glass-button py-2.5 text-sm flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Kaydet
            </button>
          </div>
        </div>
      </Modal>
      {/* Update Password Modal */}
      <Modal isOpen={!!passwordModalOpen} onClose={() => setPasswordModalOpen(null)} title="Şifre Güncelle" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            <strong className="text-white">{passwordModalOpen?.full_name}</strong> için yeni şifre belirleyin:
          </p>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Yeni şifre (min 6 karakter)"
              className="glass-input w-full pr-10"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button onClick={() => setPasswordModalOpen(null)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
            <button onClick={handlePasswordUpdate} disabled={saving || newPassword.length < 6} className="glass-button py-2.5 text-sm flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              Şifreyi Değiştir
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
