import { useState, useEffect } from 'react'
import { api, formatMoney, formatDateTime } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Plus, ShoppingCart, Check, CreditCard, Search, X } from 'lucide-react'
import Modal from '../components/Modal'

export default function Sales() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewSale, setShowNewSale] = useState(false)
  const [cart, setCart] = useState([])
  const [saleType, setSaleType] = useState('contado')
  const [selectedClient, setSelectedClient] = useState(null)
  const [discount, setDiscount] = useState(0)
  const [searchProduct, setSearchProduct] = useState('')

  const canViewAll = user?.role !== 'vendedor'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, salesData, clientsData] = await Promise.all([
        api.get('/products'),
        api.get('/sales'),
        api.get('/clients'),
      ])
      setProducts(productsData)
      setSales(salesData)
      setClients(clientsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.selling_price,
        quantity: 1,
        max_quantity: product.stock_quantity,
      }])
    }
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product_id !== productId))
    } else {
      setCart(cart.map(item =>
        item.product_id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId))
  }

  const getTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    return subtotal - discount
  }

  const handleSale = async () => {
    if (cart.length === 0) return
    if (saleType === 'fiado' && !selectedClient) {
      alert('Selecciona un cliente para venta fiada')
      return
    }

    try {
      await api.post('/sales', {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        client_id: selectedClient?.id,
        type: saleType,
        discount,
      })
      setShowNewSale(false)
      setCart([])
      setSelectedClient(null)
      setDiscount(0)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProduct.toLowerCase())
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
          <h1 className="font-heading font-bold text-2xl text-secondary">Ventas</h1>
          <p className="text-gray-500">
            {canViewAll ? `${sales.length} ventas` : 'Tus ventas'}
          </p>
        </div>
        <button
          onClick={() => setShowNewSale(true)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Nueva Venta
        </button>
      </div>

      <div className="space-y-3">
        {sales.map((sale) => (
          <div key={sale.id} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-gray-400">#{sale.id}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  sale.type === 'contado'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-danger/10 text-danger'
                }`}>
                  {sale.type === 'contado' ? (
                    <span className="flex items-center gap-1"><Check size={12} /> Contado</span>
                  ) : (
                    <span className="flex items-center gap-1"><CreditCard size={12} /> Fiado</span>
                  )}
                </span>
              </div>
              <span className="text-sm text-gray-500">{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="space-y-1 mb-3">
              {sale.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span className="font-mono">{formatMoney(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                {sale.client_name && (
                  <p className="text-sm text-gray-500">Cliente: {sale.client_name}</p>
                )}
                {sale.user_name && canViewAll && (
                  <p className="text-sm text-gray-400">Vendedor: {sale.user_name}</p>
                )}
              </div>
              <p className="font-mono font-semibold text-lg text-primary">
                {formatMoney(sale.total)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {sales.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay ventas registradas</p>
        </div>
      )}

      <Modal
        open={showNewSale}
        onClose={() => { setShowNewSale(false); setCart([]); setSelectedClient(null) }}
        title="Nueva Venta"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSaleType('contado')}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                saleType === 'contado' ? 'bg-accent text-white' : 'bg-gray-100'
              }`}
            >
              <Check size={18} /> Contado
            </button>
            <button
              onClick={() => setSaleType('fiado')}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                saleType === 'fiado' ? 'bg-danger text-white' : 'bg-gray-100'
              }`}
            >
              <CreditCard size={18} /> Fiado
            </button>
          </div>

          {saleType === 'fiado' && (
            <div>
              <label className="block text-sm font-medium mb-1">Cliente</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const client = clients.find(c => c.id === parseInt(e.target.value))
                  setSelectedClient(client || null)
                }}
                className="input"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.total_debt > 0 ? `(Deuda: ${formatMoney(client.total_debt)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Buscar producto..."
                className="input pl-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className="text-left p-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.stock_quantity} uds</p>
                  <p className="font-mono text-sm text-primary">{formatMoney(product.selling_price)}</p>
                </button>
              ))}
            </div>
          </div>

          {cart.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Carrito</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product_id} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{item.product_name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono w-20 text-right">{formatMoney(item.unit_price * item.quantity)}</span>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-danger"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="Descuento"
              className="input w-32"
            />
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-mono font-bold text-2xl text-primary">
                {formatMoney(getTotal())}
              </p>
            </div>
            <button
              onClick={handleSale}
              disabled={cart.length === 0}
              className="btn-primary px-8"
            >
              Cobrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
