import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, full_name, role, active, created_at 
      FROM users 
      ORDER BY created_at DESC
    `).all();
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

router.get('/:id', requireRole('admin', 'supervisor'), (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, full_name, role, active, created_at 
      FROM users WHERE id = ?
    `).get(req.params.id);
    
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

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const hash = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).run(username, hash, full_name, role);

    const user = db.prepare('SELECT id, username, full_name, role, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
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

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (role && !['admin', 'supervisor', 'vendedor'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE users SET full_name = ?, role = ?, active = ?, password_hash = ?
        WHERE id = ?
      `).run(full_name || user.full_name, role || user.role, active ?? user.active, hash, userId);
    } else {
      db.prepare(`
        UPDATE users SET full_name = ?, role = ?, active = ?
        WHERE id = ?
      `).run(full_name || user.full_name, role || user.role, active ?? user.active, userId);
    }

    const updated = db.prepare('SELECT id, username, full_name, role, active, created_at FROM users WHERE id = ?').get(userId);
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

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(userId);
    
    res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;
