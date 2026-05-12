import { supabase } from './supabaseClient'
import type { TransactionInsert, TransactionWithProduct } from '../types/database'

export const TransactionService = {
  async getAll(): Promise<TransactionWithProduct[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, products(name, sku), accounts(name)`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as TransactionWithProduct[]) ?? []
  },

  async getByProduct(productId: string): Promise<TransactionWithProduct[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, products(name, sku), accounts(name)`)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data as TransactionWithProduct[]) ?? []
  },

  async create(transaction: TransactionInsert): Promise<TransactionWithProduct> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select(`*, products(name, sku), accounts(name)`)
      .single()

    if (error) throw error
    return data as TransactionWithProduct
  },

  async getRecent(limit: number = 10): Promise<TransactionWithProduct[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`*, products(name, sku), accounts(name)`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as TransactionWithProduct[]) ?? []
  },
}
