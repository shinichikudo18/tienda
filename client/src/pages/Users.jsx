import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Plus, Edit2, Trash2, User, Shield, UserCheck, Crown } from 'lucide-react'
import Modal from '../components/Modal'

const roleConfig = {
  admin: { label: 'Administrador', icon: Crown, color: 'text-warning' },
  supervisor: { label: 'Supervisor', icon: Shield, color: 'text-primary' },
  vendedor: { label: 'Vendedor', icon: UserCheck, color: 'text-accent' },
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'vendedor',
    active: true,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await api.get('/users')
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (user = null) => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        full_name: user.full_name,
        role: user.role,
        active: user.active === 1,
      })
      setSelectedUser(user)
    } else {
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'vendedor',
        active: true,
      })
      setSelectedUser(null)
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.full_name || (!selectedUser && !formData.password)) {
      alert('Completa los campos requeridos')
      return
    }

    try {
      if (selectedUser) {
        const updateData = {
          full_name: formData.full_name,
          role: formData.role,
          active: formData.active,
        }
        if (formData.password) updateData.password = formData.password
        await api.put(`/users/${selectedUser.id}`, updateData)
      } else {
        await api.post('/users', {
          username: formData.username,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
        })
      }
      setShowForm(false)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (user) => {
    if (!confirm(`¿Desactivar al usuario ${user.full_name}?`)) return
    try {
      await api.delete(`/users/${user.id}`)
      loadUsers()
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
          <h1 className="font-heading font-bold text-2xl text-secondary">Usuarios</h1>
          <p className="text-gray-500">{users.length} usuarios</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="space-y-3">
        {users.map((user) => {
          const config = roleConfig[user.role]
          const Icon = config.icon
          return (
            <div key={user.id} className={`card flex items-center gap-4 ${user.active ? '' : 'opacity-60'}`}>
              <div className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ${config.color}`}>
                <User size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{user.full_name}</h3>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-warning/10 text-warning' :
                    user.role === 'supervisor' ? 'bg-primary/10 text-primary' :
                    'bg-accent/10 text-accent'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Icon size={12} />
                      {config.label}
                    </span>
                  </span>
                </div>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-accent' : 'bg-gray-300'}`}></span>
                <button
                  onClick={() => handleOpenForm(user)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(user)}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <div className="space-y-4">
          {!selectedUser && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  placeholder="Nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="Contraseña"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              <option value="vendedor">Vendedor</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {selectedUser && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-primary"
              />
              <label htmlFor="active" className="text-sm">Usuario activo</label>
            </div>
          )}
          {selectedUser && (
            <div>
              <label className="block text-sm font-medium mb-1">Nueva Contraseña (opcional)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="Dejar vacío para mantener la actual"
              />
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary flex-1">
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
