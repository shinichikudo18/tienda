import { useState, useEffect } from 'react'
import { api, formatMoney } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { DollarSign, Package, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await api.get('/dashboard/stats')
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  const chartData = {
    labels: stats?.last7Days?.map(d => d.day) || [],
    datasets: [
      {
        label: 'Ventas',
        data: stats?.last7Days?.map(d => d.total) || [],
        backgroundColor: '#E67E22',
        borderRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatMoney(value),
        },
      },
    },
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-secondary">
            Hola, {user?.full_name}
          </h1>
          <p className="text-gray-500">Resumen de tu negocio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <DollarSign size={16} />
            Caja Hoy
          </div>
          <p className="font-mono font-semibold text-xl text-accent">
            {formatMoney(stats?.cashToday || 0)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <TrendingUp size={16} />
            Inventario
          </div>
          <p className="font-mono font-semibold text-xl text-secondary">
            {formatMoney(stats?.inventoryValue || 0)}
          </p>
        </div>

        <div className="stat-card border-l-4 border-danger">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Users size={16} />
            Fiados
          </div>
          <p className="font-mono font-semibold text-xl text-danger">
            {formatMoney(stats?.fiadoTotal || 0)}
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Package size={16} />
            Mes
          </div>
          <p className="font-mono font-semibold text-xl text-primary">
            {formatMoney(stats?.monthlySales || 0)}
          </p>
        </div>
      </div>

      {stats?.lowStock > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-warning shrink-0" size={20} />
          <p className="text-sm">
            <strong>{stats.lowStock}</strong> producto{stats.lowStock > 1 ? 's' : ''} con stock bajo
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="font-heading font-semibold text-lg mb-4">Ventas últimos 7 días</h2>
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-heading font-semibold text-lg mb-4">Productos más vendidos</h2>
          {stats?.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {stats.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.units_sold} unidades</p>
                  </div>
                  <p className="font-mono font-semibold text-accent">
                    {formatMoney(product.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Sin ventas este mes</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-heading font-semibold text-lg mb-4">Resumen del día</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Ventas realizadas</span>
              <span className="font-semibold">{stats?.todayCount || 0}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Total del día</span>
              <span className="font-mono font-semibold text-primary">
                {formatMoney(stats?.todaySales || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Promedio por venta</span>
              <span className="font-mono font-semibold">
                {formatMoney(stats?.todayCount > 0 ? stats?.todaySales / stats?.todayCount : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
