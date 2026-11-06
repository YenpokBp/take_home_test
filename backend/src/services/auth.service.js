import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, withTransaction } from '../config/db.js';
import { AppError, validationError } from '../utils/AppError.js';
import { validateRegister } from '../utils/validators.js';

export async function register(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Request body harus berupa JSON object');
  }

  const errors = validateRegister(body);
  if (errors.length) throw validationError(errors);

  // Normalisasi username dan email menggunakan lowercase sebelum disimpan
  const username = body.username.trim().toLowerCase();
  const email = body.email.trim().toLowerCase();
  const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;

  // Cek ketersediaan username / email / phone
  const [existing] = await pool.query(
    'SELECT username, email, phone FROM users WHERE username = ? OR email = ? OR (phone IS NOT NULL AND phone = ?)',
    [username, email, phone]
  );
  const conflicts = [];
  for (const row of existing) {
    if (row.username && row.username.toLowerCase() === username) {
      conflicts.push({ field: 'username', message: 'Username sudah dipakai' });
    }
    if (row.email && row.email.toLowerCase() === email) {
      conflicts.push({ field: 'email', message: 'Email sudah terdaftar' });
    }
    if (phone && row.phone === phone) {
      conflicts.push({ field: 'phone', message: 'Nomor telepon sudah terdaftar' });
    }
  }
  if (conflicts.length) throw new AppError(409, 'Data sudah digunakan', conflicts);

  const passwordHash = await bcrypt.hash(body.password, 10);

  // User + dompetnya dibuat dalam 1 transaksi (tidak boleh ada user tanpa dompet)
  try {
    return await withTransaction(async (conn) => {
      const [result] = await conn.query(
        'INSERT INTO users (username, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        [username, email, phone, passwordHash]
      );
      await conn.query('INSERT INTO wallets (user_id, balance) VALUES (?, 0)', [result.insertId]);
      return { id: result.insertId, username, email, phone };
    });
  } catch (err) {
    // Tangani kemungkinan race condition duplicate entry pada concurrent registration
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      const msg = (err.message || err.sqlMessage || '').toLowerCase();
      const duplicateConflicts = [];
      if (msg.includes('username') || msg.includes('uq_users_username')) {
        duplicateConflicts.push({ field: 'username', message: 'Username sudah dipakai' });
      } else if (msg.includes('email') || msg.includes('uq_users_email')) {
        duplicateConflicts.push({ field: 'email', message: 'Email sudah terdaftar' });
      } else if (msg.includes('phone') || msg.includes('uq_users_phone')) {
        duplicateConflicts.push({ field: 'phone', message: 'Nomor telepon sudah terdaftar' });
      } else {
        duplicateConflicts.push({ field: 'duplicate', message: 'Data sudah digunakan' });
      }
      throw new AppError(409, 'Data sudah digunakan', duplicateConflicts);
    }
    throw err;
  }
}

export async function login(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'Request body harus berupa JSON object');
  }

  const { email, password } = body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw validationError([{ field: 'credentials', message: 'Email dan password wajib diisi' }]);
  }

  const [rows] = await pool.query(
    'SELECT id, username, email, password_hash FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  const user = rows[0];

  // Pesan sengaja dibuat sama agar tidak membocorkan email mana yang terdaftar
  const valid = user && (await bcrypt.compare(password, user.password_hash));
  if (!valid) throw new AppError(401, 'Email atau password salah');

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

  return { token, user: { id: user.id, username: user.username, email: user.email } };
}

export async function getProfile(userId) {
  const [rows] = await pool.query(
    'SELECT id, username, email, phone FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) throw new AppError(404, 'User tidak ditemukan');
  return rows[0];
}
