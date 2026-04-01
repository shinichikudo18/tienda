import express from 'express';
import { run, get, all, lastInsertRowid } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    let products;
    
    if (req.user.role === 'vendedor') {
      products = all(`
        SELECT p.*, COALESCE(sa.quantity_assigned, p.stock_quantity) as available_stock
        FROM products p
        LEFT JOIN stock_assignments sa ON p.id = sa.product_id AND sa.user_id = ?
        WHERE p.stock_quantity > 0 OR sa.quantity_assigned > 0
        ORDER BY p.name
      `, [req.user.id]);
    } else {
      products = all(`
        SELECT p.*, u.full_name as created_by_name
        FROM products p
        LEFT JOIN users u ON p.created_by = u.id
        ORDER BY p.name
      `);
    }
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = get(`
      SELECT p.*, u.full_name as created_by_name
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.get('/:id/price-history', (req, res) => {
  try {
    const history = all(`
      SELECT ph.*, u.full_name as changed_by_name
      FROM product_price_history ph
      LEFT JOIN users u ON ph.changed_by = u.id
      WHERE ph.product_id = ?
      ORDER BY ph.changed_at DESC
    `, [req.params.id]);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de precios' });
  }
});

router.post('/', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const { name, description, unit_type, base_quantity, base_cost, package_count, package_unit, selling_price, stock_quantity, min_stock } = req.body;
    
    if (!name || !unit_type || !base_quantity || !selling_price) {
      return res.status(400).json({ error: 'Nombre, unidad, cantidad base y precio son requeridos' });
    }

    run(`INSERT INTO products (name, description, unit_type, base_quantity, base_cost, package_count, package_unit, selling_price, stock_quantity, min_stock, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description || null, unit_type, base_quantity, base_cost || 0, package_count || 1, package_unit || unit_type, selling_price, stock_quantity || 0, min_stock || 0, req.user.id]);

    const product = get('SELECT * FROM products WHERE id = last_insert_rowid()');
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const { name, description, unit_type, base_quantity, base_cost, package_count, package_unit, selling_price, stock_quantity, min_stock } = req.body;
    
    const product = get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (selling_price !== undefined && selling_price !== product.selling_price) {
      run(`INSERT INTO product_price_history (product_id, old_price, new_price, changed_by) VALUES (?, ?, ?, ?)`,
        [req.params.id, product.selling_price, selling_price, req.user.id]);
    }

    run(`UPDATE products SET name = ?, description = ?, unit_type = ?, base_quantity = ?, base_cost = ?,
      package_count = ?, package_unit = ?, selling_price = ?, stock_quantity = ?, min_stock = ? WHERE id = ?`,
      [name || product.name, description ?? product.description, unit_type || product.unit_type,
       base_quantity ?? product.base_quantity, base_cost ?? product.base_cost,
       package_count ?? product.package_count, package_unit || product.package_unit,
       selling_price ?? product.selling_price, stock_quantity ?? product.stock_quantity,
       min_stock ?? product.min_stock, req.params.id]);

    const updated = get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const product = get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

router.post('/:id/assign-stock', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const { user_id, quantity } = req.body;
    
    if (!user_id || quantity === undefined) {
      return res.status(400).json({ error: 'Usuario y cantidad requeridos' });
    }

    const user = get('SELECT * FROM users WHERE id = ? AND role = ?', [user_id, 'vendedor']);
    if (!user) {
      return res.status(400).json({ error: 'Usuario vendedor no encontrado' });
    }

    const existing = get('SELECT * FROM stock_assignments WHERE product_id = ? AND user_id = ?', [req.params.id, user_id]);
    
    if (existing) {
      run('UPDATE stock_assignments SET quantity_assigned = ? WHERE id = ?', [quantity, existing.id]);
    } else {
      run('INSERT INTO stock_assignments (product_id, user_id, quantity_assigned) VALUES (?, ?, ?)', [req.params.id, user_id, quantity]);
    }

    const assignment = get('SELECT * FROM stock_assignments WHERE product_id = ? AND user_id = ?', [req.params.id, user_id]);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Error al asignar stock' });
  }
});

export default router;
