import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export function authenticate(req, res, next) {
  // Utama: cookie httpOnly. Cadangan: header Bearer (untuk test di Postman)
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.token || bearer;

  if (!token) return next(new AppError(401, 'Silakan login terlebih dahulu'));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch {
    next(new AppError(401, 'Token tidak valid atau sudah kedaluwarsa'));
  }
}
