import { useState } from 'react'

export default function ProductForm({ product, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    unit_type: product?.unit_type || 'kg',
    base_quantity: product?.base_quantity || 1,
    base_cost: product?.base_cost || 0,
    package_count: product?.package_count || 10,
    package_unit: product?.package_unit || 'bolsas',
    selling_price: product?.selling_price || 0,
    stock_quantity: product?.stock_quantity || 0,
    min_stock: product?.min_stock || 0,
  })

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const profit = formData.package_count > 0
    ? (formData.selling_price - (formData.base_cost / formData.package_count)).toFixed(2)
    : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del Producto *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="input"
          placeholder="Ej: Maní importado"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="input"
          placeholder="Descripción opcional"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Unidad de Compra</label>
          <select
            value={formData.unit_type}
            onChange={(e) => handleChange('unit_type', e.target.value)}
            className="input"
          >
            <option value="kg">Kilogramo (kg)</option>
            <option value="lb">Libra (lb)</option>
            <option value="g">Gramo (g)</option>
            <option value="l">Litro (L)</option>
            <option value="ml">Mililitro (ml)</option>
            <option value="unidad">Unidad</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cantidad Base</label>
          <input
            type="number"
            step="0.01"
            value={formData.base_quantity}
            onChange={(e) => handleChange('base_quantity', parseFloat(e.target.value) || 0)}
            className="input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Costo de Compra</label>
          <input
            type="number"
            step="0.01"
            value={formData.base_cost}
            onChange={(e) => handleChange('base_cost', parseFloat(e.target.value) || 0)}
            className="input"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock Actual</label>
          <input
            type="number"
            step="0.01"
            value={formData.stock_quantity}
            onChange={(e) => handleChange('stock_quantity', parseFloat(e.target.value) || 0)}
            className="input"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3 text-sm text-gray-600">Empaquetado</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">No. de Paquetes</label>
            <input
              type="number"
              value={formData.package_count}
              onChange={(e) => handleChange('package_count', parseInt(e.target.value) || 1)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Paquete</label>
            <input
              type="text"
              value={formData.package_unit}
              onChange={(e) => handleChange('package_unit', e.target.value)}
              className="input"
              placeholder="bolsas, paquetes, etc."
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Precio de Venta por Paquete *</label>
        <input
          type="number"
          step="0.01"
          value={formData.selling_price}
          onChange={(e) => handleChange('selling_price', parseFloat(e.target.value) || 0)}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Alerta Stock Mínimo</label>
          <input
            type="number"
            step="0.01"
            value={formData.min_stock}
            onChange={(e) => handleChange('min_stock', parseFloat(e.target.value) || 0)}
            className="input"
          />
        </div>
        <div className="flex items-center">
          <div className={`text-sm ${parseFloat(profit) >= 0 ? 'text-accent' : 'text-danger'}`}>
            Ganancia aprox: <span className="font-mono font-semibold">{profit}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1">
          {product ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </form>
  )
}
