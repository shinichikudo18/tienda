import express from 'express';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    let debts;
    
    if (req.user.role === 'vendedor') {
      debts = db.prepare(`
        SELECT d.*, c.name as client_name, s.created_at as sale_date
        FROM debts d
        JOIN clients c ON d.client_id = c.id
        JOIN sales s ON d.sale_id = s.id
        WHERE s.user_id = ?
        ORDER BY d.created_at DESC
      `).all(req.user.id);
    } else {
      debts = db.prepare(`
        SELECT d.*, c.name as client_name, s.created_at as sale_date
        FROM debts d
        JOIN clients c ON d.client_id = c.id
        JOIN sales s ON d.sale_id = s.id
        ORDER BY d.created_at DESC
      `).all();
    }
    
    res.json(debts);
  } catch (error) {
    console.error('Get debts error:', error);
    res.status(500).json({ error: 'Error al obtener deudas' });
  }
});

router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(remaining_amount), 0) as total_pending,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'partial' THEN 1 END) as partial_count
      FROM debts
      WHERE status != 'paid'
    `).get();

    const recentPayments = db.prepare(`
      SELECT dp.*, c.name as client_name, u.full_name as paid_by_name
      FROM debt_payments dp
      JOIN debts d ON dp.debt_id = d.id
      JOIN clients c ON d.client_id = c.id
      LEFT JOIN users u ON dp.paid_by = u.id
      ORDER BY dp.created_at DESC
      LIMIT 10
    `).all();

    const topDebtors = db.prepare(`
      SELECT c.id, c.name, COALESCE(SUM(d.remaining_amount), 0) as total_debt
      FROM clients c
      JOIN debts d ON c.id = d.client_id
      WHERE d.status != 'paid'
      GROUP BY c.id
      ORDER BY total_debt DESC
      LIMIT 5
    `).all();
    
    res.json({ stats, recentPayments, topDebtors });
  } catch (error) {
    console.error('Get debt stats error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.post('/:id/pay', (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    const debt = db.prepare(`
      SELECT d.*, c.name as client_name
      FROM debts d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?
    `).get(req.params.id);

    if (!debt) {
      return res.status(404).json({ error: 'Deuda no encontrada' });
    }

    const paymentAmount = Math.min(amount, debt.remaining_amount);

    db.prepare(`
      UPDATE debts SET 
        paid_amount = paid_amount + ?,
        remaining_amount = remaining_amount - ?,
        status = CASE 
          WHEN remaining_amount - ? <= 0 THEN 'paid' 
          WHEN paid_amount + ? > 0 THEN 'partial'
          ELSE status 
        END
      WHERE id = ?
    `).run(paymentAmount, paymentAmount, paymentAmount, paymentAmount, req.params.id);

    db.prepare(`
      INSERT INTO debt_payments (debt_id, amount, paid_by)
      VALUES (?, ?, ?)
    `).run(req.params.id, paymentAmount, req.user.id);

    const updated = db.prepare(`
      SELECT d.*, c.name as client_name
      FROM debts d
      JOIN clients c ON d.client_id = c.id
      WHERE d.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    console.error('Pay debt error:', error);
    res.status(500).json({ error: 'Error al registrar pago' });
  }
});

export default router;
