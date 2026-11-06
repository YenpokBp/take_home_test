import { randomUUID } from 'node:crypto';
import { pool, withTransaction } from '../config/db.js';
import { AppError, validationError } from '../utils/AppError.js';
import { validateAmount, validateNote } from '../utils/validators.js';

export async function getBalance(userId) {
  const [rows] = await pool.query('SELECT balance FROM wallets WHERE user_id = ?', [userId]);
  if (!rows[0]) throw new AppError(404, 'Dompet tidak ditemukan');
  return rows[0].balance;
}

export async function topUp(userId, { amount, note } = {}) {
  const errors = [];
  const amountError = validateAmount(amount);
  if (amountError) errors.push({ field: 'amount', message: amountError });
  const noteError = validateNote(note);
  if (noteError) errors.push({ field: 'note', message: noteError });
  if (errors.length) throw validationError(errors);

  return withTransaction(async (conn) => {
    // FOR UPDATE = kunci baris dompet, request lain harus menunggu
    const [rows] = await conn.query(
      'SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    if (!rows[0]) throw new AppError(404, 'Dompet tidak ditemukan');

    const newBalance = rows[0].balance + amount;
    const referenceCode = randomUUID();

    await conn.query('UPDATE wallets SET balance = ? WHERE user_id = ?', [newBalance, userId]);
    await conn.query(
      `INSERT INTO transactions
        (reference_code, type, sender_id, receiver_id, amount, note, sender_balance_after, receiver_balance_after)
       VALUES (?, 'TOPUP', NULL, ?, ?, ?, NULL, ?)`,
      [referenceCode, userId, amount, note || null, newBalance]
    );

    return { reference_code: referenceCode, amount, balance: newBalance };
  });
}

export async function transfer(senderId, { recipient, amount, note } = {}) {
  // 1. Validasi input
  const errors = [];
  if (typeof recipient !== 'string' || !recipient.trim())
    errors.push({ field: 'recipient', message: 'Email atau nomor telepon penerima wajib diisi' });
  const amountError = validateAmount(amount);
  if (amountError) errors.push({ field: 'amount', message: amountError });
  const noteError = validateNote(note);
  if (noteError) errors.push({ field: 'note', message: noteError });
  if (errors.length) throw validationError(errors);

  // 2. Cari penerima berdasarkan email / nomor telepon
  const target = recipient.trim().toLowerCase();
  const [found] = await pool.query(
    'SELECT id, username FROM users WHERE email = ? OR phone = ?',
    [target, target]
  );
  if (!found[0]) throw new AppError(404, 'Penerima tidak ditemukan');
  const receiver = found[0];
  if (receiver.id === senderId) throw new AppError(400, 'Tidak dapat transfer ke diri sendiri');

  // 3. Transaksi database: semua berhasil, atau semua dibatalkan (rollback)
  return withTransaction(async (conn) => {
    // Kunci kedua dompet, diurutkan berdasarkan user_id agar tidak terjadi deadlock
    const [wallets] = await conn.query(
      'SELECT user_id, balance FROM wallets WHERE user_id IN (?, ?) ORDER BY user_id FOR UPDATE',
      [senderId, receiver.id]
    );
    const senderWallet = wallets.find((w) => w.user_id === senderId);
    const receiverWallet = wallets.find((w) => w.user_id === receiver.id);
    if (!senderWallet || !receiverWallet) throw new AppError(404, 'Dompet tidak ditemukan');

    if (senderWallet.balance < amount) throw new AppError(400, 'Saldo tidak mencukupi');

    const senderAfter = senderWallet.balance - amount;
    const receiverAfter = receiverWallet.balance + amount;
    const referenceCode = randomUUID();

    await conn.query('UPDATE wallets SET balance = ? WHERE user_id = ?', [senderAfter, senderId]);
    await conn.query('UPDATE wallets SET balance = ? WHERE user_id = ?', [receiverAfter, receiver.id]);
    await conn.query(
      `INSERT INTO transactions
        (reference_code, type, sender_id, receiver_id, amount, note, sender_balance_after, receiver_balance_after)
       VALUES (?, 'TRANSFER', ?, ?, ?, ?, ?, ?)`,
      [referenceCode, senderId, receiver.id, amount, note || null, senderAfter, receiverAfter]
    );

    return { reference_code: referenceCode, to: receiver.username, amount, balance: senderAfter };
  });
}

export async function getHistory(userId, { page, limit } = {}) {
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
  const offset = (pageNum - 1) * limitNum;

  // userId diambil dari token, jadi user hanya bisa melihat mutasi miliknya sendiri
  const [rows] = await pool.query(
    `SELECT t.reference_code, t.type, t.amount, t.note, t.created_at,
            CASE WHEN t.receiver_id = ? THEN 'IN' ELSE 'OUT' END AS direction,
            CASE WHEN t.receiver_id = ? THEN t.receiver_balance_after ELSE t.sender_balance_after END AS balance_after,
            CASE WHEN t.receiver_id = ? THEN s.username ELSE r.username END AS counterparty
     FROM transactions t
     LEFT JOIN users s ON s.id = t.sender_id
     JOIN users r ON r.id = t.receiver_id
     WHERE t.sender_id = ? OR t.receiver_id = ?
     ORDER BY t.created_at DESC, t.id DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, userId, userId, userId, limitNum, offset]
  );

  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM transactions WHERE sender_id = ? OR receiver_id = ?',
    [userId, userId]
  );

  return {
    items: rows,
    pagination: { page: pageNum, limit: limitNum, total, total_pages: Math.ceil(total / limitNum) },
  };
}
