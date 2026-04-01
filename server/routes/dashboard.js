import express from 'express';
import db from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = today.substring(0, 7) + '-01';

    let salesFilter = '';
    let params = [];
    
    if (req.user.role === 'vendedor') {
      salesFilter = 'AND s.user_id = ?';
      params = [req.user.id];
    }

    const cashToday = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM sales s
      WHERE s.type = 'contado' 
        AND DATE(s.created_at) = ?
        ${salesFilter}
    `).get(today, ...params);

    const fiadoTotal = db.prepare(`
      SELECT COALESCE(SUM(remaining_amount), 0) as total
      FROM debts d
      WHERE d.status != 'paid'
    `).get();

    const inventoryValue = db.prepare(`
      SELECT COALESCE(SUM(p.stock_quantity * p.selling_price), 0) as total
      FROM products p
    `).get();

    const monthlySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total
      FROM sales s
      WHERE DATE(s.created_at) >= ?
        ${salesFilter}
    `).get(startOfMonth, ...params);

    const todaySales = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as total, COUNT(*) as count
      FROM sales s
      WHERE DATE(s.created_at) = ?
        ${salesFilter}
    `).get(today, ...params);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySales = db.prepare(`
        SELECT COALESCE(SUM(total), 0) as total
        FROM sales s
        WHERE DATE(s.created_at) = ?
          ${salesFilter}
      `).get(dateStr, ...params);
      
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        total: daySales.total
      });
    }

    const topProducts = db.prepare(`
      SELECT p.name, SUM(si.quantity) as units_sold, SUM(si.subtotal) as total
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE DATE(s.created_at) >= ?
        ${salesFilter}
      GROUP BY p.id
      ORDER BY total DESC
      LIMIT 5
    `).all(startOfMonth, ...params);

    const lowStock = db.prepare(`
      SELECT COUNT(*) as count
      FROM products p
      WHERE p.stock_quantity <= p.min_stock AND p.min_stock > 0
    `).get();

    res.json({
      cashToday: cashToday.total,
      fiadoTotal: fiadoTotal.total,
      inventoryValue: inventoryValue.total,
      monthlySales: monthlySales.total,
      todaySales: todaySales.total,
      todayCount: todaySales.count,
      last7Days,
      topProducts,
      lowStock: lowStock.count
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

export default router;
