import express from 'express';
import { run, get, all } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const clients = all(`
      SELECT c.*, 
        COALESCE(SUM(d.remaining_amount), 0) as total_debt,
        COUNT(d.id) as pending_debts
      FROM clients c
      LEFT JOIN debts d ON c.id = d.client_id AND d.status != 'paid'
      GROUP BY c.id
      ORDER BY total_debt DESC
    `);
    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    client.debts = all(`
      SELECT d.*, s.created_at as sale_date, s.type as sale_type
      FROM debts d
      JOIN sales s ON d.sale_id = s.id
      WHERE d.client_id = ?
      ORDER BY d.created_at DESC
    `, [req.params.id]);

    client.total_debt = client.debts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + d.remaining_amount, 0);
    
    client.payments = all(`
      SELECT dp.*, u.full_name as paid_by_name
      FROM debt_payments dp
      LEFT JOIN users u ON dp.paid_by = u.id
      JOIN debts d ON dp.debt_id = d.id
      WHERE d.client_id = ?
      ORDER BY dp.created_at DESC
    `, [req.params.id]);
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    run('INSERT INTO clients (name, phone) VALUES (?, ?)', [name, phone || null]);
    
    const client = get('SELECT * FROM clients WHERE id = last_insert_rowid()');
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    run('UPDATE clients SET name = ?, phone = ? WHERE id = ?', [name || client.name, phone ?? client.phone, req.params.id]);

    const updated = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const client = get('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const pendingDebts = get(`SELECT COUNT(*) as count FROM debts WHERE client_id = ? AND status != 'paid'`, [req.params.id]);

    if (pendingDebts.count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar cliente con deudas pendientes' });
    }

    run('DELETE FROM clients WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

export default router;
