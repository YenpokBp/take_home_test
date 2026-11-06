import { AppError } from '../utils/AppError.js';

/**
 * Middleware untuk memastikan request body berupa plain JSON object yang valid.
 * Menolak null, array, string, number, boolean, atau tipe data non-object lainnya.
 */
export function validateBody(req, res, next) {
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(new AppError(400, 'Request body harus berupa JSON object yang valid'));
  }
  next();
}
