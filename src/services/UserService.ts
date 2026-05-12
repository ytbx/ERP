import { supabase } from './supabaseClient'
import type { ProfileWithRole } from '../types/database'

export interface CreateUserPayload {
  email: string
  password: string
  full_name: string
  role_id: string
}

export const UserService = {
  async getAll(): Promise<ProfileWithRole[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, roles(*)`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as ProfileWithRole[]) ?? []
  },

  async createUser(payload: CreateUserPayload): Promise<{ success: boolean, error?: string }> {
    console.log('Kullanıcı oluşturma isteği gönderiliyor:', payload)
    
    // Official invoke() handles the headers best
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: payload,
    })

    if (error) {
      console.error('Edge Function Çağrı Hatası:', error)
      
      // Detaylı hata mesajı oluştur
      let msg = 'Sunucu yanıt vermedi (401/400).'
      if (error.message.includes('algorithm')) {
        msg = 'JWT Algoritma uyumsuzluğu (ES256/HS256). Lütfen panelden "Verify JWT"yi kapatın.'
      } else if (error.message.includes('401')) {
        msg = 'Oturum geçersiz veya yetkisiz. Lütfen çıkış yapıp tekrar girin.'
      }
      
      throw new Error(msg)
    }

    if (data?.error) {
      console.error('Edge Function İş Mantığı Hatası:', data.error)
      throw new Error(data.error)
    }

    return { success: true }
  },

  async updateRole(profileId: string, role_id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role_id })
      .eq('id', profileId)

    if (error) throw error
  },

  async deleteUser(_userId: string): Promise<void> {
    throw new Error('Kullanıcı silme işlemi henüz desteklenmiyor.')
  },

  async updateUserPassword(userId: string, password: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { action: 'update_password', userId, password },
    })

    if (error) throw new Error('Şifre güncelleme servisi yanıt vermedi.')
    if (data?.error) throw new Error(data.error)
  }
}
