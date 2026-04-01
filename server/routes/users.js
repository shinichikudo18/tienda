import express from 'express';
import bcrypt from 'bcryptjs';
import { run, get, all } from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const users = all(`
      SELECT id, username, full_name, role, active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/:id', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const user = get(`
      SELECT id, username, full_name, role, active, created_at 
      FROM users WHERE id = ?
    `, [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

router.post('/', requireRole('admin'), (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!['admin', 'supervisor', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const existing = get('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const hash = bcrypt.hashSync(password, 10);
    run(`INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`, [username, hash, full_name, role]);
    
    const user = get('SELECT id, username, full_name, role, active, created_at FROM users WHERE id = last_insert_rowid()');
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/:id', requireRole('admin'), (req, res) => {
  try {
    const { full_name, role, active, password } = req.body;
    const userId = req.params.id;

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (role && !['admin', 'supervisor', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      run(`UPDATE users SET full_name = ?, role = ?, active = ?, password_hash = ? WHERE id = ?`,
        [full_name || user.full_name, role || user.role, active ?? user.active, hash, userId]);
    } else {
      run(`UPDATE users SET full_name = ?, role = ?, active = ? WHERE id = ?`,
        [full_name || user.full_name, role || user.role, active ?? user.active, userId]);
    }

    const updated = get('SELECT id, username, full_name, role, active, created_at FROM users WHERE id = ?', [userId]);
    res.json(updated);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  try {
    const userId = req.params.id;
    
    if (userId == req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const user = get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    run('UPDATE users SET active = 0 WHERE id = ?', [userId]);
    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
