import express from 'express';
import { run, get, all } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    let sales;
    
    if (req.user.role === 'vendedor') {
      sales = all(`
        SELECT s.*, c.name as client_name, u.full_name as user_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
      `, [req.user.id]);
    } else {
      sales = all(`
        SELECT s.*, c.name as client_name, u.full_name as user_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT 100
      `);
    }

    for (let sale of sales) {
      sale.items = all(`
        SELECT si.*, p.name as product_name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `, [sale.id]);
    }
    
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const sale = get(`
      SELECT s.*, c.name as client_name, u.full_name as user_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);
    
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (req.user.role === 'vendedor' && sale.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta venta' });
    }

    sale.items = all(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [sale.id]);
    
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

router.post('/', (req, res) => {
  try {
    const { items, client_id, type, discount } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Debes agregar al menos un producto' });
    }

    if (!type || !['contado', 'fiado'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de venta inválido' });
    }

    if (type === 'fiado' && !client_id) {
      return res.status(400).json({ error: 'Cliente requerido para venta fiada' });
    }

    let subtotal = 0;
    for (let item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    
    const total = subtotal - (discount || 0);

    run(`INSERT INTO sales (user_id, client_id, total, discount, type) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, client_id || null, total, discount || 0, type]);

    const saleIdResult = all('SELECT last_insert_rowid() as id');
    const saleId = saleIdResult[0].id;

    for (let item of items) {
      run(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]);

      run(`UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`, [item.quantity, item.product_id]);

      if (req.user.role === 'vendedor') {
        run(`UPDATE stock_assignments SET quantity_assigned = quantity_assigned - ? WHERE product_id = ? AND user_id = ?`,
          [item.quantity, item.product_id, req.user.id]);
      }
    }

    if (type === 'fiado' && client_id) {
      run(`INSERT INTO debts (client_id, sale_id, original_amount, remaining_amount, paid_amount, status) VALUES (?, ?, ?, ?, 0, 'pending')`,
        [client_id, saleId, total, total]);
    }

    const sale = get('SELECT * FROM sales WHERE id = ?', [saleId]);
    sale.items = all(`SELECT si.*, p.name as product_name FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = ?`, [saleId]);
    
    res.status(201).json(sale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
});

export default router;
