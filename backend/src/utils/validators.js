const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const PHONE_RE = /^[0-9]{8,15}$/;
export const MAX_AMOUNT = 1_000_000_000;

export function validateRegister({ username, email, phone, password } = {}) {
  const errors = [];

  if (typeof username !== 'string' || !USERNAME_RE.test(username.trim()))
    errors.push({ field: 'username', message: 'Username 3-30 karakter (huruf, angka, underscore)' });

  if (typeof email !== 'string' || email.length > 255 || !EMAIL_RE.test(email.trim()))
    errors.push({ field: 'email', message: 'Format email tidak valid' });

  if (phone !== undefined && phone !== null && phone !== '' &&
      (typeof phone !== 'string' || !PHONE_RE.test(phone)))
    errors.push({ field: 'phone', message: 'Nomor telepon 8-15 digit angka' });

  if (typeof password !== 'string' || password.length < 8)
    errors.push({ field: 'password', message: 'Password minimal 8 karakter' });

  return errors;
}

// Return string pesan error, atau null kalau valid
export function validateAmount(amount) {
  if (amount === undefined || amount === null || amount === '') return 'Nominal wajib diisi';
  if (typeof amount !== 'number' || !Number.isInteger(amount)) return 'Nominal harus berupa bilangan bulat';
  if (amount <= 0) return 'Nominal harus lebih dari 0';
  if (amount > MAX_AMOUNT) return `Nominal maksimal ${MAX_AMOUNT}`;
  return null;
}

export function validateNote(note) {
  if (note === undefined || note === null) return null;
  if (typeof note !== 'string' || note.length > 255) return 'Catatan harus berupa teks maksimal 255 karakter';
  return null;
}
