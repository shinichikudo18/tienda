import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    let sales;
    
    if (req.user.role === 'vendedor') {
      sales = db.prepare(`
        SELECT s.*, c.name as client_name, u.full_name as user_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
      `).all(req.user.id);
    } else {
      sales = db.prepare(`
        SELECT s.*, c.name as client_name, u.full_name as user_name
        FROM sales s
        LEFT JOIN clients c ON s.client_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT 100
      `).all();
    }

    for (let sale of sales) {
      sale.items = db.prepare(`
        SELECT si.*, p.name as product_name
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(sale.id);
    }
    
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const sale = db.prepare(`
      SELECT s.*, c.name as client_name, u.full_name as user_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    if (req.user.role === 'vendedor' && sale.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes acceso a esta venta' });
    }

    sale.items = db.prepare(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(sale.id);
    
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

    const saleResult = db.prepare(`
      INSERT INTO sales (user_id, client_id, total, discount, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, client_id || null, total, discount || 0, type);

    for (let item of items) {
      db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `).run(saleResult.lastInsertRowid, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price);

      db.prepare(`
        UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
      `).run(item.quantity, item.product_id);

      if (req.user.role === 'vendedor') {
        db.prepare(`
          UPDATE stock_assignments SET quantity_assigned = quantity_assigned - ? 
          WHERE product_id = ? AND user_id = ?
        `).run(item.quantity, item.product_id, req.user.id);
      }
    }

    if (type === 'fiado' && client_id) {
      db.prepare(`
        INSERT INTO debts (client_id, sale_id, original_amount, remaining_amount, paid_amount, status)
        VALUES (?, ?, ?, ?, 0, 'pending')
      `).run(client_id, saleResult.lastInsertRowid, total, total);
    }

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleResult.lastInsertRowid);
    sale.items = db.prepare(`
      SELECT si.*, p.name as product_name
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(saleResult.lastInsertRowid);
    
    res.status(201).json(sale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
});

export default router;
