import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const cookieOptions = {
  httpOnly: true,                                   // tidak bisa dibaca JavaScript (anti XSS)
  secure: process.env.NODE_ENV === 'production',    // HTTPS only di production
  sameSite: 'lax',                                  // mengurangi risiko CSRF
  maxAge: 24 * 60 * 60 * 1000,                      // 1 hari (samakan dengan JWT_EXPIRES_IN)
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, message: 'Registrasi berhasil', data: user });
});

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.cookie('token', token, cookieOptions);
  // token juga dikirim di body hanya untuk memudahkan test di Postman
  res.json({ success: true, message: 'Login berhasil', data: { user, token } });
});

export const logout = (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: undefined });
  res.json({ success: true, message: 'Logout berhasil' });
};

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, data: user });
});
