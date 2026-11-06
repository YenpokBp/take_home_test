import { AppError } from '../utils/AppError.js';

export function errorHandler(err, req, res, next) {
  // JSON body rusak
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400 && 'body' in err)) {
    return res.status(400).json({ success: false, message: 'Format JSON tidak valid' });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  console.error(err); // error tak terduga: jangan bocorkan detail ke client
  res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
}
