import { supabase } from './supabaseClient'
import type { Role, RoleInsert, RoleUpdate } from '../types/database'

export const RoleService = {
  async getAll(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  async getById(id: string): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async create(role: RoleInsert): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, role: RoleUpdate): Promise<Role> {
    const { data, error } = await supabase
      .from('roles')
      .update(role)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
