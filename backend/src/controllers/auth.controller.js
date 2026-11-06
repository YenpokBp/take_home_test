import * as authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function getCookieMaxAge() {
  const expiry = process.env.JWT_EXPIRES_IN || '1d';
  if (/^\d+$/.test(expiry)) {
    return parseInt(expiry, 10) * 1000;
  }
  const match = String(expiry).match(/^(\d+)([smhd])$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    if (unit === 's') return num * 1000;
    if (unit === 'm') return num * 60 * 1000;
    if (unit === 'h') return num * 60 * 60 * 1000;
    if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  }
  return 24 * 60 * 60 * 1000;
}

const isProd = process.env.NODE_ENV === 'production';
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
// SameSite=None mewajibkan Secure=true
const secure = isProd || sameSite === 'none';

export const cookieOptions = {
  httpOnly: true,                                   // tidak bisa dibaca JavaScript (anti XSS)
  secure,                                           // HTTPS only di production atau jika SameSite=None
  sameSite,                                         // 'lax' atau 'none' untuk cross-domain
  maxAge: getCookieMaxAge(),                        // konsisten dengan JWT_EXPIRES_IN
};

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ success: true, message: 'Registrasi berhasil', data: user });
});

export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  res.cookie('token', token, cookieOptions);
  
  const responseData = { user };
  // Di production, token HANYA dikirim via HttpOnly cookie (tidak dikirim di JSON)
  // Token di JSON hanya disertakan pada non-production (misal: testing di Postman)
  if (process.env.NODE_ENV !== 'production') {
    responseData.token = token;
  }

  res.json({ success: true, message: 'Login berhasil', data: responseData });
});

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
  });
  res.json({ success: true, message: 'Logout berhasil' });
};

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.json({ success: true, data: user });
});
