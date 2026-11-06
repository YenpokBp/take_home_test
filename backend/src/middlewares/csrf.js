import { AppError } from '../utils/AppError.js';

/**
 * Middleware proteksi CSRF untuk request yang menggunakan autentikasi cookie.
 * Terutama penting saat deployment cross-site (SameSite=None).
 */
export function verifyCsrf(req, res, next) {
  // Hanya evaluasi request mutasi (state-changing)
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Jika request menggunakan autentikasi berbasis cookie
  if (req.cookies?.token) {
    const origin = req.headers.origin;
    const clientUrls = (process.env.CLIENT_URL || '')
      .split(',')
      .map((url) => url.trim().replace(/\/+$/, ''))
      .filter(Boolean);

    if (origin && clientUrls.length > 0) {
      const normalizedOrigin = origin.replace(/\/+$/, '');
      const isAllowed = clientUrls.includes(normalizedOrigin);

      if (!isAllowed) {
        return next(new AppError(403, 'Akses ditolak: Verifikasi CSRF gagal'));
      }
    }
  }

  next();
}
