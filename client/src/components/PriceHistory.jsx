import { useState, useEffect } from 'react'
import { api, formatMoney, formatDateTime } from '../lib/api'
import { History } from 'lucide-react'

export default function PriceHistory({ productId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (productId) {
      loadHistory()
    }
  }, [productId])

  const loadHistory = async () => {
    try {
      const data = await api.get(`/products/${productId}/price-history`)
      setHistory(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <History size={32} className="mx-auto mb-2 opacity-50" />
        <p>Sin cambios de precio registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.map((record) => {
        const change = record.new_price - record.old_price
        const percentChange = ((change / record.old_price) * 100).toFixed(1)
        
        return (
          <div
            key={record.id}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {formatDateTime(record.changed_at)}
              </span>
              <span className="text-xs text-gray-400">
                por {record.changed_by_name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Anterior</p>
                <p className="font-mono text-gray-600">
                  {formatMoney(record.old_price)}
                </p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className={`text-2xl ${
                  change > 0 ? 'text-accent' : change < 0 ? 'text-danger' : 'text-gray-400'
                }`}>
                  →
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Nuevo</p>
                <p className="font-mono font-semibold">
                  {formatMoney(record.new_price)}
                </p>
              </div>
            </div>
            <div className="text-center mt-2">
              <span className={`text-sm font-medium ${
                change > 0 ? 'text-accent' : change < 0 ? 'text-danger' : 'text-gray-400'
              }`}>
                {change > 0 ? '+' : ''}{change.toFixed(2)} ({change > 0 ? '+' : ''}{percentChange}%)
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
