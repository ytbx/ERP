import { useState } from 'react'
import Header from '../components/layout/Header'
import Modal from '../components/ui/Modal'
import { useProducts } from '../hooks/useProducts'
import { useAuth } from '../contexts/AuthContext'
import type { ProductInsert, ProductUpdate, Product } from '../types/database'
import { Plus, Pencil, Trash2, Package, Loader2, Barcode, Printer } from 'lucide-react'
import { BarcodeService } from '../services/BarcodeService'

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct, searchProducts } = useProducts()
  const { isAdmin } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({ name: '', sku: '', description: '', category: '', current_stock: 0, purchase_price: 0, sale_price: 0 })

  const openCreate = () => {
    setEditingProduct(null)
    setFormData({ name: '', sku: '', description: '', category: '', current_stock: 0, purchase_price: 0, sale_price: 0 })
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditingProduct(p)
    setFormData({ name: p.name, sku: p.sku, description: p.description || '', category: p.category || '', current_stock: p.current_stock, purchase_price: p.purchase_price, sale_price: p.sale_price })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingProduct) {
        const upd: ProductUpdate = { name: formData.name, sku: formData.sku, description: formData.description || null, category: formData.category || null, purchase_price: formData.purchase_price, sale_price: formData.sale_price }
        await updateProduct(editingProduct.id, upd)
      } else {
        const ins: ProductInsert = { name: formData.name, sku: formData.sku, description: formData.description || null, category: formData.category || null, current_stock: formData.current_stock, purchase_price: formData.purchase_price, sale_price: formData.sale_price }
        await createProduct(ins)
      }
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      setDeleteConfirm(null)
    } catch (err) {
      console.error(err)
    }
  }

  const stockBadge = (stock: number) => {
    if (stock === 0) return 'badge-danger'
    if (stock < 10) return 'badge-warning'
    return 'badge-success'
  }

  const handlePrintBarcode = () => {
    const printContent = document.getElementById('barcode-print-area');
    if (!printContent) return;
    
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime().toString();
    const printWindow = window.open(windowUrl, uniqueName, 'left=50000,top=50000,width=0,height=0');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <style>
              @page { size: auto; margin: 0; }
              body { margin: 10px; display: flex; flex-direction: column; align-items: center; font-family: sans-serif; }
              img { max-width: 100%; }
              p { margin-top: 5px; font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  }

  return (
    <>
      <Header
        title="Ürünler"
        subtitle={`${products.length} ürün listeleniyor`}
        onSearch={searchProducts}
        searchPlaceholder="Ürün adı veya SKU ara..."
        actions={
          isAdmin ? (
            <button onClick={openCreate} className="glass-button flex items-center gap-2 py-2.5 text-sm">
              <Plus size={18} /> Yeni Ürün
            </button>
          ) : undefined
        }
      />

      <div className="p-8 animate-fade-in">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-surface-500" />
            </div>
            <p className="text-surface-300 text-lg font-medium">Henüz ürün yok</p>
            <p className="text-surface-500 text-sm mt-1">İlk ürününüzü ekleyerek başlayın</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Ürün</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Kategori</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Stok</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Alış Fiyatı</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">Satış Fiyatı</th>
                  {isAdmin && <th className="text-right px-6 py-4 text-xs font-semibold text-surface-400 uppercase tracking-wider">İşlemler</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-surface-100">{p.name}</p>
                      {p.description && <p className="text-xs text-surface-500 mt-0.5 truncate max-w-xs">{p.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-white/5 px-2 py-1 rounded-md text-surface-300 font-mono">{p.sku}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-surface-300">{p.category || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={stockBadge(p.current_stock)}>{p.current_stock}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-surface-200 font-medium">
                      ₺{p.purchase_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-emerald-400 font-medium">
                      ₺{p.sale_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setBarcodeProduct(p)} className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-colors" title="Barkod">
                            <Barcode size={15} />
                          </button>
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg hover:bg-white/10 text-surface-400 hover:text-white transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteConfirm(p.id)} className="p-2 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Ürün Adı *</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="glass-input w-full" placeholder="Ürün adı" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">SKU *</label>
              <input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required className="glass-input w-full" placeholder="SKU-001" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Açıklama</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="glass-input w-full" rows={2} placeholder="Ürün açıklaması" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Kategori</label>
              <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="glass-input w-full" placeholder="Elektronik" />
            </div>
            {!editingProduct && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Başlangıç Stok</label>
                <input type="number" min={0} value={formData.current_stock} onChange={e => setFormData({ ...formData, current_stock: Number(e.target.value) })} className="glass-input w-full" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Alış Fiyatı (₺)</label>
              <input type="number" min={0} step="0.01" value={formData.purchase_price} onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Satış Fiyatı (₺)</label>
              <input type="number" min={0} step="0.01" value={formData.sale_price} onChange={e => setFormData({ ...formData, sale_price: Number(e.target.value) })} className="glass-input w-full" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={() => setModalOpen(false)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
            <button type="submit" disabled={saving} className="glass-button py-2.5 text-sm flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editingProduct ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Ürünü Sil" size="sm">
        <p className="text-surface-300 mb-6">Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="glass-button-secondary py-2.5 text-sm">İptal</button>
          <button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="glass-button-danger py-2.5 text-sm">Sil</button>
        </div>
      </Modal>

      {/* Barcode Modal */}
      <Modal isOpen={!!barcodeProduct} onClose={() => setBarcodeProduct(null)} title="Ürün Barkodu" size="sm">
        {barcodeProduct && (
          <div className="flex flex-col items-center">
            <div id="barcode-print-area" className="bg-white p-4 rounded-lg">
              <img src={BarcodeService.generateBarcode(barcodeProduct.sku)} alt="barcode" className="mx-auto" />
              <p className="text-center text-black font-bold mt-2">{barcodeProduct.name}</p>
            </div>
            <div className="w-full flex gap-3 mt-8">
              <button onClick={() => setBarcodeProduct(null)} className="flex-1 glass-button-secondary py-2.5 text-sm">Kapat</button>
              <button onClick={handlePrintBarcode} className="flex-1 glass-button py-2.5 text-sm flex items-center justify-center gap-2">
                <Printer size={18} /> Yazdır
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
