import { useState, useEffect, useCallback } from 'react'
import { ProductService } from '../services/ProductService'
import type { Product, ProductInsert, ProductUpdate } from '../types/database'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductService.getAll()
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürünler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const createProduct = async (product: ProductInsert) => {
    const newProduct = await ProductService.create(product)
    setProducts(prev => [newProduct, ...prev])
    return newProduct
  }

  const updateProduct = async (id: string, product: ProductUpdate) => {
    const updated = await ProductService.update(id, product)
    setProducts(prev => prev.map(p => p.id === id ? updated : p))
    return updated
  }

  const deleteProduct = async (id: string) => {
    await ProductService.delete(id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      await fetchProducts()
      return
    }
    try {
      setLoading(true)
      const data = await ProductService.search(query)
      setProducts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arama hatası')
    } finally {
      setLoading(false)
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
  }
}
