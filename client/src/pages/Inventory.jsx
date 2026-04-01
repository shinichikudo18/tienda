import { useState, useEffect } from 'react'
import { api, formatMoney } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Edit2, Trash2, History, Package, Search } from 'lucide-react'
import Modal from '../components/Modal'
import ProductForm from '../components/ProductForm'
import PriceHistory from '../components/PriceHistory'

export default function Inventory() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [search, setSearch] = useState('')

  const canEdit = user?.role === 'admin' || user?.role === 'supervisor'
  const canDelete = user?.role === 'admin'

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await api.get('/products')
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (productData) => {
    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, productData)
      } else {
        await api.post('/products', productData)
      }
      setShowForm(false)
      setSelectedProduct(null)
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await api.delete(`/products/${id}`)
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleViewHistory = (product) => {
    setSelectedProduct(product)
    setShowHistory(true)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-secondary">Inventario</h1>
          <p className="text-gray-500">{products.length} productos</p>
        </div>
        {canEdit && (
          <button
            onClick={() => { setSelectedProduct(null); setShowForm(true) }}
            className="btn-primary flex items-center gap-2 self-start"
          >
            <Plus size={20} />
            Nuevo Producto
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="input pl-10"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="text-primary" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    {product.package_count} × {product.package_unit}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                product.stock_quantity > (product.min_stock || 0)
                  ? 'bg-accent/10 text-accent'
                  : 'bg-danger/10 text-danger'
              }`}>
                {product.stock_quantity} uds
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Costo:</span>
                <span className="font-mono">{formatMoney(product.base_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Venta:</span>
                <span className="font-mono font-semibold text-primary">
                  {formatMoney(product.selling_price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ganancia:</span>
                <span className="font-mono text-accent">
                  {formatMoney(product.selling_price - (product.base_cost / product.package_count))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleViewHistory(product)}
                className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1"
              >
                <History size={16} />
                Historial
              </button>
              {canEdit && (
                <button
                  onClick={() => { setSelectedProduct(product); setShowForm(true) }}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                >
                  <Edit2 size={18} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Package size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay productos que mostrar</p>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4"
            >
              Agregar producto
            </button>
          )}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setSelectedProduct(null) }}
        title={selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <ProductForm
          product={selectedProduct}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setSelectedProduct(null) }}
        />
      </Modal>

      <Modal
        open={showHistory}
        onClose={() => { setShowHistory(false); setSelectedProduct(null) }}
        title={`Historial de Precios: ${selectedProduct?.name}`}
      >
        <PriceHistory productId={selectedProduct?.id} />
      </Modal>
    </div>
  )
}
