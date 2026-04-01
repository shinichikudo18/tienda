import { useState, useEffect } from 'react'
import { api, formatMoney, formatDateTime } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Plus, Users, Phone, DollarSign, Check, History } from 'lucide-react'
import Modal from '../components/Modal'

export default function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [debts, setDebts] = useState([])
  const [debtStats, setDebtStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showClientDetail, setShowClientDetail] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [payAmount, setPayAmount] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [clientsData, debtsData, statsData] = await Promise.all([
        api.get('/clients'),
        api.get('/debts'),
        api.get('/debts/stats'),
      ])
      setClients(clientsData)
      setDebts(debtsData)
      setDebtStats(statsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClient = async () => {
    if (!newClientName.trim()) return
    try {
      await api.post('/clients', { name: newClientName, phone: newClientPhone })
      setNewClientName('')
      setNewClientPhone('')
      setShowNewClient(false)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleViewClient = async (client) => {
    try {
      const data = await api.get(`/clients/${client.id}`)
      setSelectedClient(data)
      setShowClientDetail(true)
    } catch (err) {
      alert(err.message)
    }
  }

  const handlePayment = async (debt) => {
    const amount = parseFloat(payAmount) || debt.remaining_amount
    try {
      await api.post(`/debts/${debt.id}/pay`, { amount })
      setPayAmount('')
      if (selectedClient) {
        const updated = await api.get(`/clients/${selectedClient.id}`)
        setSelectedClient(updated)
      }
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

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
          <h1 className="font-heading font-bold text-2xl text-secondary">Clientes</h1>
          <p className="text-gray-500">Gestión de fiados</p>
        </div>
        <button
          onClick={() => setShowNewClient(true)}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {debtStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card text-center">
            <p className="text-gray-500 text-sm">Total Deuda</p>
            <p className="font-mono font-bold text-xl text-danger">
              {formatMoney(debtStats.stats.total_pending)}
            </p>
          </div>
          <div className="stat-card text-center">
            <p className="text-gray-500 text-sm">Pendientes</p>
            <p className="font-mono font-bold text-xl text-warning">
              {debtStats.stats.pending_count}
            </p>
          </div>
          <div className="stat-card text-center">
            <p className="text-gray-500 text-sm">Parciales</p>
            <p className="font-mono font-bold text-xl text-primary">
              {debtStats.stats.partial_count}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {clients.filter(c => c.total_debt > 0).map((client) => (
          <div
            key={client.id}
            className="card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewClient(client)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center">
                <Users className="text-danger" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{client.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {client.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {client.phone}
                    </span>
                  )}
                  <span>{client.pending_debts} deuda(s)</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-lg text-danger">
                  {formatMoney(client.total_debt)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.filter(c => c.total_debt > 0).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No hay clientes con deudas</p>
        </div>
      )}

      <Modal
        open={showNewClient}
        onClose={() => setShowNewClient(false)}
        title="Nuevo Cliente"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="input"
              placeholder="Nombre del cliente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono (opcional)</label>
            <input
              type="tel"
              value={newClientPhone}
              onChange={(e) => setNewClientPhone(e.target.value)}
              className="input"
              placeholder="0412-123-4567"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewClient(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={handleCreateClient} className="btn-primary flex-1">
              Crear
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showClientDetail}
        onClose={() => { setShowClientDetail(false); setSelectedClient(null) }}
        title={selectedClient?.name}
        size="lg"
      >
        {selectedClient && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-danger/10 rounded-lg">
              <span className="text-gray-600">Deuda Total</span>
              <span className="font-mono font-bold text-2xl text-danger">
                {formatMoney(selectedClient.total_debt)}
              </span>
            </div>

            <div>
              <h4 className="font-medium mb-2">Deudas</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedClient.debts?.map((debt) => (
                  <div key={debt.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{formatDateTime(debt.sale_date)}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        debt.status === 'paid' ? 'bg-accent/10 text-accent' :
                        debt.status === 'partial' ? 'bg-warning/10 text-warning' :
                        'bg-danger/10 text-danger'
                      }`}>
                        {debt.status === 'paid' ? 'Pagado' : debt.status === 'partial' ? 'Parcial' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Total:</span>
                      <span className="font-mono">{formatMoney(debt.original_amount)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Pagado:</span>
                      <span className="font-mono text-accent">{formatMoney(debt.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-500">Restante:</span>
                      <span className="font-mono text-danger">{formatMoney(debt.remaining_amount)}</span>
                    </div>
                    {debt.status !== 'paid' && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="number"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="Monto"
                          className="input flex-1"
                          max={debt.remaining_amount}
                        />
                        <button
                          onClick={() => handlePayment(debt)}
                          className="btn-primary flex items-center gap-1"
                        >
                          <Check size={16} />
                          Pagar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedClient.payments?.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <History size={18} />
                  Historial de Pagos
                </h4>
                <div className="space-y-2">
                  {selectedClient.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>{formatDateTime(payment.created_at)}</span>
                      <span className="font-mono text-accent">+{formatMoney(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
